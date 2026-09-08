import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  DescriptionList,
  Dialog,
  Input,
  RemovableChip,
  ScrollArea,
  Select,
  StateBlock,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  useToast,
} from '@bighat/ui';

import { can, denyingRule, roleById } from '../data/permissions';
import { RetentionSummary } from '../pages/Retention';
import {
  DOCUMENT_TYPES,
  MAX_TAGS,
  auditEntry,
  formatDate,
  formatSize,
  statusTone,
  type DocumentStatus,
  type DocumentType,
  type ManagedDocument,
} from '../data/documents';

const STATUSES: DocumentStatus[] = ['Approved', 'Pending', 'Rejected'];

export function DocumentDialog({
  document: doc,
  onClose,
  onChange,
  onUploadNewVersion,
  currentRole,
}: {
  document: ManagedDocument | null;
  onClose: () => void;
  onChange: (id: string, change: (doc: ManagedDocument) => ManagedDocument) => void;
  onUploadNewVersion: (id: string) => void;
  currentRole: string;
}) {
  const { notify } = useToast();

  const [tab, setTab] = useState('info');
  const [description, setDescription] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState<string | undefined>();

  const id = doc?.id;

  // Opening a different document resets the dialog rather than showing the
  // previous document's unsaved draft under the new title.
  useEffect(() => {
    setTab('info');
    setNewTag('');
    setTagError(undefined);
    setDescription(doc?.description ?? '');
    // Keyed on the id, not the object — an edit elsewhere must not wipe a draft.
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!doc) return null;

  /*
   * This is the whole point of the permission model. The blueprint said
   * "approve has a screen but no authority", and it was right: anybody could
   * press this. Now the operation is resolved against the rules for this
   * document's metadata, and where it is refused the interface names the rule
   * that refused it — an interface that says "you cannot" without saying which
   * rule said so produces a support ticket.
   */
  const mayApprove = can(doc, currentRole, 'approve');
  const mayEdit = can(doc, currentRole, 'edit');
  const approveDeniedBy = denyingRule(doc, currentRole, 'approve');
  const editDeniedBy = denyingRule(doc, currentRole, 'edit');
  const roleName = roleById(currentRole)?.name ?? currentRole;

  const refusal = (operation: string, deny: ReturnType<typeof denyingRule>) =>
    deny
      ? `Denied by ${deny.id} ${deny.name}. Deny outranks grant.`
      : `No rule grants ${roleName} ${operation} on this document.`;

  function setStatus(status: DocumentStatus) {
    onChange(doc!.id, (current) => ({
      ...current,
      status,
      auditTrail: [auditEntry(`Status changed to ${status}`), ...current.auditTrail],
    }));
    notify({ tone: 'success', title: `Marked as ${status.toLowerCase()}` });
  }

  function addTag() {
    const tag = newTag.trim().toLowerCase();
    if (!tag) {
      // The Add tag button is disabled on empty input, but Enter is not, so a
      // whitespace-only Enter used to do nothing and say nothing.
      setTagError('Enter a tag name.');
      return;
    }

    if (doc!.tags.includes(tag)) {
      setTagError('That tag is already on this document.');
      return;
    }
    if (doc!.tags.length >= MAX_TAGS) {
      setTagError(`A document can carry ${MAX_TAGS} tags. Remove one to add another.`);
      return;
    }

    onChange(doc!.id, (current) => ({
      ...current,
      tags: [...current.tags, tag],
      auditTrail: [auditEntry(`Tag "${tag}" added`), ...current.auditTrail],
    }));
    setNewTag('');
    setTagError(undefined);
  }

  return (
    <Dialog open onClose={onClose} title={doc.title} description={doc.linkedRecord} size="lg">
      <Tabs value={tab} onChange={setTab}>
        <TabList ariaLabel="Document details">
          <Tab id="info">Info</Tab>
          <Tab id="edit">Edit</Tab>
          <Tab id="versions" badge={doc.versions.length}>
            Versions
          </Tab>
          <Tab id="audit">Audit trail</Tab>
        </TabList>

        <TabPanel id="info">
          <div className="dm-tabbody">
            <ScrollArea ariaLabel="Document information" maxHeight="100%" fade={false}>
              <div className="dm-stack">
                {/*
                 * `DescriptionList` is the system's term/value pair, so the three
                 * facts about this document are one list rather than three
                 * hand-rolled label-and-paragraph blocks. The status row keeps its
                 * actions in the value: they act on the term beside them.
                 */}
                <DescriptionList
                  ariaLabel="Document details"
                  items={[
                    {
                      term: 'Status',
                      value: (
                        <span className="dm-row">
                          <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
                          {STATUSES.filter((status) => status !== doc.status).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant="secondary"
                              tone={status === 'Rejected' ? 'critical' : undefined}
                              disabled={!mayApprove}
                              title={mayApprove ? undefined : refusal('approve', approveDeniedBy)}
                              onClick={() => setStatus(status)}
                            >
                              Mark {status.toLowerCase()}
                            </Button>
                          ))}
                        </span>
                      ),
                      wide: true,
                    },
                    {
                      term: 'Type',
                      value: doc.type,
                    },
                    {
                      term: 'Uploaded',
                      value: `${formatDate(doc.uploadDate)} by ${doc.uploadedBy}`,
                    },
                    {
                      term: 'File',
                      value: `${formatSize(doc.fileSize)} · version ${doc.versions.length}`,
                    },
                    {
                      term: 'Description',
                      value: doc.description || 'No description yet. Add one from the Edit tab.',
                      wide: true,
                    },
                    {
                      term: 'Your access',
                      // Colour is never the carrier here: the sentence is.
                      value: mayApprove
                        ? `${roleName} may approve or reject this document.`
                        : refusal('approve', approveDeniedBy),
                      wide: true,
                    },
                  ]}
                />

                {/*
                  RET-10: a document under retention says so in place, with the
                  date and the policy — not on a separate screen a reader has
                  to know exists.
                */}
                <RetentionSummary doc={doc} />

                <div className="dm-row">
                  <Button variant="secondary" onClick={() => onUploadNewVersion(doc.id)}>
                    Upload new version
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabPanel>

        <TabPanel id="edit">
          {!mayEdit ? (
            /*
              Refused as a whole rather than as eight disabled controls. A form
              the reader can neither fill nor understand the refusal of is
              worse than no form, so this names the rule instead.
            */
            <div className="dm-tabbody">
              <StateBlock
                state="error"
                scope="section"
                title="This role cannot edit metadata"
                description={refusal('edit', editDeniedBy)}
              />
            </div>
          ) : (
          /*
            The only tab whose content is unbounded *and* has a primary action.
            Adding the type Select pushed "Save changes" past the fold, so the
            fields scroll and the action is pinned beneath them — a form that
            hides its own submit button is worse than a form that scrolls.
          */
          <div className="dm-tabbody dm-tabbody--form">
            <div className="dm-tabbody__scroll">
              <ScrollArea ariaLabel="Edit this document" maxHeight="100%" fade={false}>
              <div className="dm-stack">
                {/*
                  UPL-19. The type used to be fixed at upload and unchangeable
                  afterwards, so a production order filed as an invoice stayed
                  one. Changing it is a state change, so it is audited.
                */}
                <Select
                  label="Document type"
                  value={doc.type}
                  options={DOCUMENT_TYPES.map((value) => ({ value, label: value }))}
                  onChange={(event) => {
                    const next = event.target.value as DocumentType;
                    if (next === doc.type) return;
                    onChange(doc.id, (current) => ({
                      ...current,
                      type: next,
                      auditTrail: [
                        auditEntry(`Type changed from ${current.type} to ${next}`),
                        ...current.auditTrail,
                      ],
                    }));
                    notify({ tone: 'success', title: `Type changed to ${next.toLowerCase()}` });
                  }}
                />

                <Textarea
                  label="Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  description="What this document is for, in a line or two."
                  rows={4}
                />

                <div className="dm-stack">
                  <p className="dm-label">
                    Tags ({doc.tags.length}/{MAX_TAGS})
                  </p>

                  {doc.tags.length > 0 && (
                    <div className="dm-chips" role="group" aria-label="Tags on this document">
                      {doc.tags.map((tag) => (
                        <RemovableChip
                          key={tag}
                          label={tag}
                          // "Remove finance" reads like removing the department.
                          removeLabel={`Remove tag ${tag}`}
                          onRemove={() =>
                            onChange(doc.id, (current) => ({
                              ...current,
                              tags: current.tags.filter((existing) => existing !== tag),
                              auditTrail: [
                                auditEntry(`Tag "${tag}" removed`),
                                ...current.auditTrail,
                              ],
                            }))
                          }
                        />
                      ))}
                    </div>
                  )}

                  <div className="dm-row dm-row--fields">
                    <span className="dm-grow">
                      <Input
                        label="New tag"
                        value={newTag}
                        error={tagError}
                        onChange={(event) => {
                          setNewTag(event.target.value);
                          setTagError(undefined);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addTag();
                          }
                        }}
                      />
                    </span>
                    <Button variant="secondary" onClick={addTag} disabled={!newTag.trim()}>
                      Add tag
                    </Button>
                  </div>
                </div>
              </div>
              </ScrollArea>
            </div>

            <div className="dm-tabbody__actions">
              <Button
                onClick={() => {
                  const next = description.trim();
                  onChange(doc.id, (current) => ({
                    ...current,
                    description: next,
                    auditTrail: [
                      auditEntry(current.description ? 'Description edited' : 'Description added'),
                      ...current.auditTrail,
                    ],
                  }));
                  notify({ tone: 'success', title: 'Changes saved' });
                }}
                disabled={description.trim() === doc.description}
              >
                Save changes
              </Button>
            </div>
          </div>
          )}
        </TabPanel>

        <TabPanel id="versions">
          <div className="dm-tabbody">
            <ScrollArea ariaLabel="Version history" maxHeight="100%" fade={false}>
              <ol className="dm-trail">
                {[...doc.versions].reverse().map((version) => (
                  <li className="dm-trail__item" key={version.version}>
                    <span className="dm-trail__title">Version {version.version}</span>
                    <br />
                    {formatDate(version.date)} · {formatSize(version.size)}
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </div>
        </TabPanel>

        <TabPanel id="audit">
          <div className="dm-tabbody">
            <ScrollArea ariaLabel="Audit trail" maxHeight="100%" fade={false}>
              {doc.auditTrail.length === 0 ? (
                <StateBlock
                  state="empty"
                  scope="inline"
                  title="Nothing recorded yet"
                  description="Uploads, approvals and new versions will appear here."
                />
              ) : (
                <ol className="dm-trail">
                  {doc.auditTrail.map((entry, index) => (
                    <li className="dm-trail__item" key={`${entry}-${index}`}>
                      {entry}
                    </li>
                  ))}
                </ol>
              )}
            </ScrollArea>
          </div>
        </TabPanel>
      </Tabs>
    </Dialog>
  );
}
