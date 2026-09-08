import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  DescriptionList,
  Dialog,
  Input,
  RemovableChip,
  StateBlock,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  useToast,
} from '@bighat/ui';

import {
  CURRENT_USER,
  MAX_TAGS,
  stamp,
  statusTone,
  type DocumentStatus,
  type ManagedDocument,
} from '../data/documents';

const STATUSES: DocumentStatus[] = ['Approved', 'Pending', 'Rejected'];

export function DocumentDialog({
  document: doc,
  onClose,
  onChange,
  onUploadNewVersion,
}: {
  document: ManagedDocument | null;
  onClose: () => void;
  onChange: (id: string, change: (doc: ManagedDocument) => ManagedDocument) => void;
  onUploadNewVersion: (id: string) => void;
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

  function setStatus(status: DocumentStatus) {
    onChange(doc!.id, (current) => ({
      ...current,
      status,
      auditTrail: [`${stamp()} – Status changed to ${status} by ${CURRENT_USER}`, ...current.auditTrail],
    }));
    notify({ tone: 'success', title: `Marked as ${status.toLowerCase()}` });
  }

  function addTag() {
    const tag = newTag.trim().toLowerCase();
    if (!tag) return;

    if (doc!.tags.includes(tag)) {
      setTagError('That tag is already on this document.');
      return;
    }
    if (doc!.tags.length >= MAX_TAGS) {
      setTagError(`A document can carry ${MAX_TAGS} tags. Remove one to add another.`);
      return;
    }

    onChange(doc!.id, (current) => ({ ...current, tags: [...current.tags, tag] }));
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
                  term: 'Uploaded',
                  value: `${doc.uploadDate} by ${doc.uploadedBy}`,
                },
                {
                  term: 'File',
                  value: `${doc.fileSize} MB · version ${doc.versions.length}`,
                },
                {
                  term: 'Description',
                  value: doc.description || 'No description yet. Add one from the Edit tab.',
                  wide: true,
                },
              ]}
            />

            <div className="dm-row">
              <Button variant="secondary" onClick={() => onUploadNewVersion(doc.id)}>
                Upload new version
              </Button>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="edit">
          <div className="dm-stack">
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

            <div className="dm-row dm-row--between">
              <Button
                onClick={() => {
                  onChange(doc.id, (current) => ({ ...current, description: description.trim() }));
                  notify({ tone: 'success', title: 'Changes saved' });
                }}
                disabled={description.trim() === doc.description}
              >
                Save changes
              </Button>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="versions">
          <ol className="dm-trail">
            {[...doc.versions].reverse().map((version) => (
              <li className="dm-trail__item" key={version.version}>
                <span className="dm-trail__title">Version {version.version}</span>
                <br />
                {version.date} · {version.size}
              </li>
            ))}
          </ol>
        </TabPanel>

        <TabPanel id="audit">
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
        </TabPanel>
      </Tabs>
    </Dialog>
  );
}
