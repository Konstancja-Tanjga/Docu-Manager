import { useEffect, useState } from 'react';
import { Button, Dialog, FileDropzone, RemovableChip, Select, StateBlock } from '@bighat/ui';

import {
  CURRENT_USER,
  DOCUMENT_TYPES,
  MAX_FILE_SIZE_MB,
  auditEntry,
  formatSize,
  today,
  type DocumentType,
  type ManagedDocument,
} from '../data/documents';

export function UploadDialog({
  open,
  newVersionOf,
  onClose,
  onUploaded,
}: {
  open: boolean;
  /** A document id when uploading a new version of it, otherwise null. */
  newVersionOf: string | null;
  onClose: () => void;
  onUploaded: (created: ManagedDocument[], newVersionOf: string | null) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  /*
   * UPL-19: metadata is proposed, not demanded. The type is offered here with a
   * default so nobody is stopped at the upload, and it stays editable on the
   * document afterwards. Before this it was hard-coded to Invoice, so every
   * production order arrived mislabelled and could never be corrected.
   */
  const [type, setType] = useState<DocumentType>('Invoice');

  // Reopening the dialog must not inherit the last attempt's queue.
  useEffect(() => {
    if (!open) {
      setFiles([]);
      setType('Invoice');
    }
  }, [open]);

  const sized = files.map((file) => ({
    file,
    sizeMB: file.size / (1024 * 1024),
  }));
  const tooBig = sized.filter((entry) => entry.sizeMB > MAX_FILE_SIZE_MB);
  const accepted = sized.filter((entry) => entry.sizeMB <= MAX_FILE_SIZE_MB);

  // A new version is one file replacing one file; more than that is ambiguous.
  const limit = newVersionOf ? 1 : Infinity;
  const queued = accepted.slice(0, limit);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={newVersionOf ? 'Upload new version' : 'Upload documents'}
      description={
        newVersionOf
          ? 'The new file becomes the latest version. Earlier versions stay available.'
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            // Disabled rather than an alert on click: the reason there is
            // nothing to upload is already visible on screen.
            disabled={queued.length === 0}
            onClick={() =>
              onUploaded(
                queued.map((entry) => toDocument(entry.file, entry.sizeMB, type)),
                newVersionOf,
              )
            }
          >
            {queued.length > 1 ? `Upload ${queued.length} files` : 'Upload'}
          </Button>
        </>
      }
    >
      <div className="dm-stack">
        <FileDropzone
          label={newVersionOf ? 'Replacement file' : 'Files to upload'}
          description={`Any file type, up to ${formatSize(MAX_FILE_SIZE_MB)} each.${
            newVersionOf ? ' One file — a new version replaces one file.' : ''
          }`}
          multiple={!newVersionOf}
          onFiles={(incoming) => setFiles(newVersionOf ? incoming.slice(0, 1) : incoming)}
        />

        {!newVersionOf && (
          <Select
            label="Document type"
            description="You can change this later from the document's Edit tab."
            value={type}
            options={DOCUMENT_TYPES.map((value) => ({ value, label: value }))}
            onChange={(event) => setType(event.target.value as DocumentType)}
          />
        )}

        {queued.length > 0 && (
          /*
           * One chip per queued file. `RemovableChip` names its own remove
           * button after the file it removes, which the hand-rolled row of
           * ghost buttons could only do by repeating the filename in a label
           * nobody maintained.
           */
          <div className="dm-chips" role="group" aria-label="Files queued for upload">
            {queued.map((entry, index) => (
              <RemovableChip
                key={`${entry.file.name}-${index}`}
                label={`${entry.file.name} · ${formatSize(entry.sizeMB)}`}
                removeLabel={`Remove ${entry.file.name} from this upload`}
                onRemove={() => setFiles((current) => current.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        )}

        {tooBig.length > 0 && (
          /*
           * An error the user has to act on in place, so it is a StateBlock and
           * not a Toast — and it names the files rather than the rule.
           */
          <StateBlock
            state="error"
            scope="inline"
            title={
              tooBig.length === 1
                ? 'One file is too large to upload'
                : `${tooBig.length} files are too large to upload`
            }
            description={`Over the ${formatSize(MAX_FILE_SIZE_MB)} limit: ${tooBig
              .map((entry) => `${entry.file.name} (${formatSize(entry.sizeMB)})`)
              .join(', ')}. Remove them or choose smaller files.`}
          />
        )}
      </div>
    </Dialog>
  );
}

function toDocument(file: File, sizeMB: number, type: DocumentType): ManagedDocument {
  const size = sizeMB.toFixed(1);
  return {
    id: `DOC-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6)}`,
    title: file.name,
    type,
    linkedRecord: 'Not linked yet',
    status: 'Pending',
    uploadDate: today(),
    uploadedBy: CURRENT_USER,
    fileSize: size,
    description: '',
    tags: [],
    versions: [{ version: 1, date: today(), size: `${size} MB` }],
    auditTrail: [auditEntry('Uploaded')],
  };
}
