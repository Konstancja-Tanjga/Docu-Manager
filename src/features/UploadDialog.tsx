import { useEffect, useState } from 'react';
import { Button, Dialog, FileDropzone, RemovableChip, StateBlock } from '@bighat/ui';

import {
  CURRENT_USER,
  MAX_FILE_SIZE_MB,
  stamp,
  today,
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

  // Reopening the dialog must not inherit the last attempt's queue.
  useEffect(() => {
    if (!open) setFiles([]);
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
            onClick={() => onUploaded(queued.map((entry) => toDocument(entry.file, entry.sizeMB)), newVersionOf)}
          >
            {queued.length > 1 ? `Upload ${queued.length} files` : 'Upload'}
          </Button>
        </>
      }
    >
      <div className="dm-stack">
        <FileDropzone
          label={newVersionOf ? 'Replacement file' : 'Files to upload'}
          description={`Any file type, up to ${MAX_FILE_SIZE_MB} MB each.${
            newVersionOf ? ' One file — a new version replaces one file.' : ''
          }`}
          multiple={!newVersionOf}
          onFiles={(incoming) => setFiles(newVersionOf ? incoming.slice(0, 1) : incoming)}
        />

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
                label={`${entry.file.name} · ${entry.sizeMB.toFixed(1)} MB`}
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
            description={`Over the ${MAX_FILE_SIZE_MB} MB limit: ${tooBig
              .map((entry) => `${entry.file.name} (${entry.sizeMB.toFixed(1)} MB)`)
              .join(', ')}. Remove them or choose smaller files.`}
          />
        )}
      </div>
    </Dialog>
  );
}

function toDocument(file: File, sizeMB: number): ManagedDocument {
  const size = sizeMB.toFixed(1);
  return {
    id: `DOC-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6)}`,
    title: file.name,
    type: 'Invoice',
    linkedRecord: 'Not linked yet',
    status: 'Pending',
    uploadDate: today(),
    uploadedBy: CURRENT_USER,
    fileSize: size,
    description: '',
    tags: [],
    versions: [{ version: 1, date: today(), size: `${size} MB` }],
    auditTrail: [`${stamp()} – Uploaded by ${CURRENT_USER}`],
  };
}
