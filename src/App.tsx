import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  AppShell,
  Avatar,
  Button,
  Input,
  NavItem,
  NavList,
  SidePanel,
  SkipLink,
  useToast,
} from '@bighat/ui';

import { DocumentDialog } from './features/DocumentDialog';
import { UploadDialog } from './features/UploadDialog';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import {
  CURRENT_USER,
  NO_FILTERS,
  loadDocuments,
  saveDocuments,
  stamp,
  type Filters,
  type ManagedDocument,
} from './data/documents';

type Page = 'dashboard' | 'documents';

const PAGES: { id: Page; label: string; screen: string }[] = [
  { id: 'dashboard', label: 'Dashboard', screen: 'Dashboard' },
  { id: 'documents', label: 'Documents', screen: 'Document library' },
];

export function App() {
  const { notify } = useToast();

  const [documents, setDocuments] = useState<ManagedDocument[]>(() => loadDocuments());
  const [page, setPage] = useState<Page>('dashboard');
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

  useEffect(() => saveDocuments(documents), [documents]);

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
      auditTrail: [`${stamp()} – New version uploaded by ${CURRENT_USER}`, ...doc.auditTrail],
    }));
  }

  const currentScreen = PAGES.find((item) => item.id === page)?.screen ?? '';

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
                 */}
                <span className="dm-navtoggle">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNavOpen((open) => !open)}
                    aria-expanded={navOpen}
                  >
                    {navOpen ? 'Close menu' : 'Menu'}
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
              <span className="dm-user">
                {/* `decorative`, because the name is rendered beside it. An
                    avatar with an accessible name next to the same name spoken
                    again is the duplicate every audit finds. */}
                <Avatar name={CURRENT_USER} size="sm" decorative />
                {CURRENT_USER}
              </span>
            }
          />
        }
        sidebar={
          <SidePanel
            ariaLabel="Sections"
            header={
              <Button fullWidth onClick={() => setUpload('new')}>
                Upload
              </Button>
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
        {page === 'dashboard' ? (
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
        onUploadNewVersion={(id) => {
          setOpenDocId(null);
          setUpload(id);
        }}
      />
    </>
  );
}
