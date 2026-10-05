import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  AppShell,
  Button,
  Input,
  Select,
  NavItem,
  NavList,
  SegmentedControl,
  SidePanel,
  SkipLink,
  UserProfile,
  useToast,
} from '@bighat/ui';

import { DocumentDialog } from './features/DocumentDialog';
import { UploadDialog } from './features/UploadDialog';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Permissions } from './pages/Permissions';
import { Retention } from './pages/Retention';
import { ROLES, operationsForRole, roleById } from './data/permissions';
import {
  CURRENT_USER,
  NO_FILTERS,
  loadDocuments,
  saveDocuments,
  auditEntry,
  type Filters,
  type ManagedDocument,
} from './data/documents';
import { THEME_OPTIONS, useTheme, type ThemeChoice } from './theme';

type Page = 'dashboard' | 'documents' | 'permissions' | 'retention';

const PAGES: { id: Page; label: string; screen: string }[] = [
  { id: 'dashboard', label: 'Dashboard', screen: 'Dashboard' },
  { id: 'documents', label: 'Documents', screen: 'Document library' },
  { id: 'permissions', label: 'Permissions', screen: 'Permissions' },
  { id: 'retention', label: 'Retention', screen: 'Retention' },
];

export function App() {
  const { notify } = useToast();

  // Read once. `reseeded` says the stored library was unreadable and has been
  // replaced by the sample data — which is indistinguishable from a first visit
  // unless somebody says so.
  const [stored] = useState(() => loadDocuments());
  const [documents, setDocuments] = useState<ManagedDocument[]>(stored.documents);
  const [page, setPage] = useState<Page>('dashboard');
  /*
   * PRM-1 says roles come from the identity provider and are read-only here,
   * so a prototype has no legitimate way to *change* one. This switcher is
   * openly a stand-in for signing in as somebody else: it is the only way to
   * see a rule-based permission model do anything, and the permissions screen
   * marks which role you are acting as.
   */
  const [role, setRole] = useState('controller');
  const [theme, setTheme] = useTheme();
  /** Below 900px the shell's panels leave the grid; this is how they come back. */
  const [navOpen, setNavOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  /** `null` = closed. A document id = that document's detail dialog. */
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  /**
   * `null` = closed, `'new'` = a fresh upload, an id = a new version of that
   * document. One piece of state instead of the prototype's two globals that
   * had to be reset in agreement with each other.
   */
  const [upload, setUpload] = useState<'new' | string | null>(null);

  /*
   * `localStorage` is the whole backend, and it can refuse: quota, private
   * browsing, a locked-down kiosk. The session keeps working either way, but a
   * "Changes saved" toast over a write that threw is the product asserting
   * something untrue — and the reader finds out when the reload is empty.
   *
   * Warned once, not per keystroke: the condition does not clear itself, so
   * repeating it on every edit would bury the edits it is warning about.
   */
  const warnedAboutSaving = useRef(false);
  useEffect(() => {
    if (saveDocuments(documents)) return;
    if (warnedAboutSaving.current) return;
    warnedAboutSaving.current = true;
    notify({
      tone: 'critical',
      title: 'Changes cannot be saved',
      description:
        'They are visible in this session but will be lost on reload. Check whether this browser allows local storage.',
    });
  }, [documents, notify]);

  useEffect(() => {
    if (!stored.reseeded) return;
    notify({
      tone: 'critical',
      title: 'Saved documents could not be read',
      description: 'The library has been reset to the sample data.',
    });
  }, [stored.reseeded, notify]);

  const openDoc = useMemo(
    () => documents.find((doc) => doc.id === openDocId) ?? null,
    [documents, openDocId],
  );

  const updateDoc = useCallback(
    (id: string, change: (doc: ManagedDocument) => ManagedDocument) => {
      setDocuments((current) => current.map((doc) => (doc.id === id ? change(doc) : doc)));
    },
    [],
  );

  function goTo(next: Page) {
    setPage(next);
    // On a narrow screen the nav is an overlay covering the content the reader
    // just asked for, so choosing a section has to close it.
    setNavOpen(false);
    // Filters belong to the library screen; leaving it clears them, which is
    // what the prototype did and what stops a stale filter from making the
    // screen look empty on return.
    setFilters(NO_FILTERS);
  }

  function addDocuments(incoming: ManagedDocument[]) {
    setDocuments((current) => [...incoming, ...current]);
  }

  function addVersion(id: string, size: string) {
    updateDoc(id, (doc) => ({
      ...doc,
      fileSize: size,
      versions: [
        ...doc.versions,
        { version: doc.versions.length + 1, date: new Date().toISOString().slice(0, 10), size: `${size} MB` },
      ],
      auditTrail: [auditEntry('New version uploaded'), ...doc.auditTrail],
    }));
  }

  const currentScreen = PAGES.find((item) => item.id === page)?.screen ?? '';
  const mayUpload = operationsForRole(role).includes('upload');

  return (
    <>
      <SkipLink />

      <AppShell
        navOpen={navOpen}
        onNavToggle={() => setNavOpen((open) => !open)}
        header={
          <AppBar
            brand={
              <span className="dm-brand">
                {/*
                 * The shell renders the scrim that closes the nav, but opening
                 * it is the product's job — there is no leading slot on AppBar,
                 * and a menu button belongs beside the wordmark anyway. Hidden
                 * above 900px, where the sidebar is on screen already.
                 *
                 * Always "Menu": since 5.0 the open overlay makes the header
                 * inert, so this button cannot be reached while the nav is
                 * open. Escape and the shell's scrim close it, and focus
                 * returns here.
                 */}
                <span className="dm-navtoggle">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNavOpen((open) => !open)}
                    aria-expanded={navOpen}
                  >
                    Menu
                  </Button>
                </span>
                <span className="dm-brand__mark" aria-hidden="true">
                  D
                </span>
                DocuManager
              </span>
            }
            title={currentScreen}
            // Each page renders its own visible <h1>; two would be worse than
            // a bar without heading semantics.
            titleAsHeading={false}
            center={
              <Input
                label="Search documents"
                hideLabel
                placeholder="Search documents"
                value={filters.search}
                onChange={(event) => {
                  const search = event.target.value;
                  setFilters((current) => ({ ...current, search }));
                  // Searching is an act of looking for a document, so it takes
                  // the user to the screen that can show them.
                  if (search) setPage('documents');
                }}
              />
            }
            actions={
              /*
               * The system's identity slot. It was a local Avatar-plus-name;
               * `UserProfile` does the same with the avatar already marked
               * decorative, and its secondary line is the thing that tells two
               * sessions apart — here, the role being acted as.
               */
              <UserProfile name={CURRENT_USER} secondary={roleById(role)?.name ?? role} />
            }
          />
        }
        sidebar={
          <SidePanel
            ariaLabel="Sections"
            /*
             * Session settings live here rather than in the app bar: the panel
             * is reachable at every width (as an overlay below 900px), and the
             * footer is the slot the system names for them.
             *
             * The role switcher was in the app bar, where its always-visible
             * label (Select has no `hideLabel`) touched the bar's top edge, and
             * below 900px it was hidden outright. The role still shows in the
             * app bar, as the UserProfile's secondary line.
             */
            footer={
              <div className="dm-stack">
                {/*
                 * PRM-1 says roles come from the identity provider, so this is
                 * openly a stand-in for signing in as somebody else — see the
                 * comment on `role` above.
                 */}
                <Select
                  label="Acting as"
                  value={role}
                  options={ROLES.map((r) => ({ value: r.id, label: r.name }))}
                  onChange={(event) => setRole(event.target.value)}
                />
                {/*
                 * Three visible options that take effect at once — a
                 * SegmentedControl, not a Switch, because "follow the OS" is a
                 * real third answer.
                 */}
                <SegmentedControl
                  legend="Theme"
                  showLegend
                  options={THEME_OPTIONS}
                  value={theme}
                  onChange={(next) => setTheme(next as ThemeChoice)}
                  size="sm"
                  fullWidth
                />
              </div>
            }
            header={
              /*
               * `upload` is not a document-scoped question — there is no
               * document yet — so it is asked of the role's granted operations.
               * Disabled with the reason on it beats a button that fails.
               */
              mayUpload ? (
                <Button fullWidth onClick={() => setUpload('new')}>
                  Upload
                </Button>
              ) : (
                <Button
                  fullWidth
                  disabled
                  title={`${roleById(role)?.name ?? role} has no rule granting upload`}
                >
                  Upload
                </Button>
              )
            }
          >
            <NavList ariaLabel="Sections">
              {PAGES.map((item) => (
                <NavItem
                  key={item.id}
                  item={{ id: item.id, label: item.label }}
                  active={page === item.id}
                  onSelect={() => goTo(item.id)}
                />
              ))}
            </NavList>
          </SidePanel>
        }
      >
        {page === 'retention' ? (
          <Retention documents={documents} currentRole={role} onOpenDocument={setOpenDocId} />
        ) : page === 'permissions' ? (
          <Permissions currentRole={role} />
        ) : page === 'dashboard' ? (
          <Dashboard
            documents={documents}
            onOpenDocument={setOpenDocId}
            onSeeAll={() => goTo('documents')}
          />
        ) : (
          <Documents
            documents={documents}
            filters={filters}
            onFiltersChange={setFilters}
            onOpenDocument={setOpenDocId}
            onUpload={() => setUpload('new')}
            currentRole={role}
            onChangeDocument={updateDoc}
          />
        )}
      </AppShell>

      <UploadDialog
        open={upload !== null}
        newVersionOf={upload && upload !== 'new' ? upload : null}
        onClose={() => setUpload(null)}
        onUploaded={(created, versionOf) => {
          if (versionOf && created[0]) {
            addVersion(versionOf, created[0].fileSize);
            notify({ tone: 'success', title: 'New version uploaded' });
          } else {
            addDocuments(created);
            notify({
              tone: 'success',
              title: `${created.length} ${created.length === 1 ? 'file' : 'files'} uploaded`,
              description: 'Each one is waiting for approval.',
            });
          }
          setUpload(null);
        }}
      />

      <DocumentDialog
        document={openDoc}
        onClose={() => setOpenDocId(null)}
        onChange={updateDoc}
        currentRole={role}
        onUploadNewVersion={(id) => {
          setOpenDocId(null);
          setUpload(id);
        }}
      />
    </>
  );
}
