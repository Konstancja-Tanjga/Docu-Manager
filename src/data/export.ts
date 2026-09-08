/**
 * Bulk metadata export, and the manifest that goes with it.
 *
 * There is no ZIP writer and no server, so what this produces is the manifest
 * and the metadata — not an archive of files. That is a real limit and it is
 * stated in requirements/README.md rather than dressed up: `BDL-6` (mirror the
 * dossier structure) and `BDL-10` through `BDL-14` (asynchronous job, progress,
 * cancellation, expiring link) all need a backend this prototype does not have.
 *
 * What is here is the part that is a design problem rather than an
 * infrastructure one: what the manifest has to say, which documents are left
 * out and why, and how a filename stays safe.
 */

import { formatSize, type ManagedDocument } from './documents';
import { retentionOf } from './retention';

export const EXPORT_FORMATS = ['CSV', 'JSON'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/**
 * `BDL-7`: deterministic, collision-free, and safe on every target filesystem.
 *
 * Deterministic because the same selection must produce the same archive twice.
 * Collision-free because two documents in this fiction genuinely share a title
 * — `Invoice_SUPP-ABC_Feb2025.pdf` appears on two documents — so the id has to
 * carry the uniqueness rather than the title. Safe because Windows refuses
 * `\\ / : * ? " < > |` and trailing dots, and every one of those is legal in a
 * title here.
 */
export function safeFilename(doc: ManagedDocument): string {
  const base = doc.title
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 80);
  const extension = /\.([A-Za-z0-9]+)$/.exec(doc.title)?.[1] ?? 'bin';
  return `${doc.id}_${base || 'document'}.${extension}`;
}

export type ExportExclusion = { id: string; title: string; reason: string };

export type ExportPlan = {
  included: ManagedDocument[];
  excluded: ExportExclusion[];
  totalMb: number;
};

/**
 * `BDL-4` and `BDL-16`: documents the reader may not download are excluded,
 * counted and reported, and so are documents under legal hold. Silently
 * shipping a smaller archive than was asked for is the same class of bug as a
 * silently shortened list.
 */
export function planExport(
  selection: ManagedDocument[],
  mayDownload: (doc: ManagedDocument) => boolean,
): ExportPlan {
  const included: ManagedDocument[] = [];
  const excluded: ExportExclusion[] = [];

  for (const doc of selection) {
    if (!mayDownload(doc)) {
      excluded.push({
        id: doc.id,
        title: doc.title,
        reason: 'No rule grants this role download on it',
      });
      continue;
    }
    if (doc.legalHold) {
      excluded.push({
        id: doc.id,
        title: doc.title,
        reason: 'Under legal hold, and this role is not entitled to override it',
      });
      continue;
    }
    included.push(doc);
  }

  const totalMb = included.reduce((sum, doc) => sum + (Number.parseFloat(doc.fileSize) || 0), 0);
  return { included, excluded, totalMb };
}

export function planSummary(plan: ExportPlan): string {
  // BDL-2: the count and the total size, before the download is requested.
  return `${plan.included.length} document${plan.included.length === 1 ? '' : 's'}, ${formatSize(plan.totalMb)}`;
}

/**
 * `BDL-8`: every archive contains a manifest. Its job is to make the archive
 * self-explaining months later — what was asked for, what arrived, and what
 * did not, with the reason attached to each omission.
 */
export function buildManifest(
  plan: ExportPlan,
  criteria: string,
  actor: string,
  roleName: string,
): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      actor,
      role: roleName,
      selectionCriteria: criteria,
      requested: plan.included.length + plan.excluded.length,
      included: plan.included.map((doc) => ({
        id: doc.id,
        filename: safeFilename(doc),
        title: doc.title,
        type: doc.type,
        // BDL-9: the latest version is what is included by default.
        version: doc.versions.length,
        sizeMb: Number.parseFloat(doc.fileSize) || 0,
        department: doc.department,
        classification: doc.classification,
        retention: retentionOf(doc).state,
      })),
      excluded: plan.excluded,
      notes: [
        'Metadata and manifest only. This prototype has no archive writer, so no file content is included.',
        'The latest version of each document is described; a specific version cannot yet be requested.',
      ],
    },
    null,
    2,
  );
}

const CSV_COLUMNS = [
  'id',
  'filename',
  'title',
  'type',
  'status',
  'department',
  'classification',
  'retention',
  'version',
  'sizeMb',
  'uploadedBy',
  'uploadDate',
] as const;

/** A quoted CSV cell: the titles contain commas, and one contains a comma today. */
function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildMetadata(plan: ExportPlan, format: ExportFormat): string {
  const rows = plan.included.map((doc) => ({
    id: doc.id,
    filename: safeFilename(doc),
    title: doc.title,
    status: doc.status,
    type: doc.type,
    department: doc.department,
    classification: doc.classification,
    retention: retentionOf(doc).state,
    version: doc.versions.length,
    sizeMb: Number.parseFloat(doc.fileSize) || 0,
    uploadedBy: doc.uploadedBy,
    uploadDate: doc.uploadDate,
  }));

  if (format === 'JSON') return JSON.stringify(rows, null, 2);

  const header = CSV_COLUMNS.join(',');
  const body = rows.map((row) =>
    CSV_COLUMNS.map((column) => cell(row[column as keyof typeof row] ?? '')).join(','),
  );
  return [header, ...body].join('\n');
}

/**
 * The one thing a browser can genuinely do here. `BDL-13` wants an expiring
 * link from a server; an object URL is the honest local equivalent, and it is
 * revoked immediately so it cannot leak.
 */
export function downloadText(filename: string, contents: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
