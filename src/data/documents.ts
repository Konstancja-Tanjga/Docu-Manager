/**
 * The fake backend. `localStorage` with delusions of persistence.
 *
 * The key is `docuManager_docs`, matching the rename away from the old ERP
 * product name. Anyone who opened an earlier build reseeds from the example
 * data on first load, which is the intended behaviour for a prototype with
 * no backend behind it.
 */

/*
 * `retention.ts` imports from this file with `import type` only, so the type
 * import is erased and this is not a runtime cycle. The retention state is
 * computed rather than stored, which is why filtering and sorting by it has to
 * reach the computation.
 */
import { RETENTION_STATES, retentionOf } from './retention';

export type DocumentStatus = 'Approved' | 'Pending' | 'Rejected';
/** The single source of the type list — the upload and the edit form share it. */
export const DOCUMENT_TYPES = ['Invoice', 'Production Order'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/*
 * Two metadata fields the permission rules are written against.
 *
 * `PRM-8` requires predicates to reference fields *by definition*, never by a
 * free-typed name, so the allowed values live here as closed sets rather than
 * as strings scattered through the rules.
 */
export const DEPARTMENTS = ['Production', 'Finance', 'Maintenance'] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const CLASSIFICATIONS = ['Internal', 'Confidential'] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export type DocumentVersion = {
  version: number;
  date: string;
  size: string;
};

export type ManagedDocument = {
  id: string;
  title: string;
  type: DocumentType;
  linkedRecord: string;
  status: DocumentStatus;
  department: Department;
  classification: Classification;
  /**
   * RET-13: a legal hold suspends expiry without altering the policy or the
   * computed date. It is a property of the document, not of the policy, which
   * is why it lives here and not in retention.ts.
   */
  legalHold?: boolean;
  uploadDate: string;
  uploadedBy: string;
  fileSize: string;
  description: string;
  tags: string[];
  versions: DocumentVersion[];
  auditTrail: string[];
};

export const STORAGE_KEY = 'docuManager_docs';
export const CURRENT_USER = 'Maria López';
export const MAX_TAGS = 20;
export const MAX_FILE_SIZE_MB = 100;

/**
 * `2025-01-15 14:22`, which is what the audit trail has always looked like.
 *
 * Local wall clock, deliberately not `Intl`-formatted and deliberately not UTC.
 *
 * Not UTC because it used to be: `toISOString()` stamped an action a reader had
 * just taken with a time up to a day away from their own clock — the same
 * off-by-one-day this file guards against in `parseStoredDate`, one function
 * below.
 *
 * Not `Intl` because the trail is an append-only log of fixed-width strings.
 * One shape means the entries sort as text and stay aligned, and it means an
 * entry written today still reads the same to a reader whose locale differs
 * from the author's. `XC-5` is qualified for this surface for that reason —
 * see requirements/README.md.
 */
export function stamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    ` ${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}

/**
 * XC-2: every state-changing action writes an audit entry, in one shape.
 *
 * It lives here rather than in the dialog because the trail was previously
 * written at three call sites and skipped at three others: saving a
 * description, adding a tag and removing a tag all changed the document and
 * left no record.
 */
export function auditEntry(action: string): string {
  return `${stamp()} – ${action} by ${CURRENT_USER}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const SEED: ManagedDocument[] = [
  {
    id: 'DOC-20250115-001',
    title: 'Invoice_SUPP-XYZ_Jan2025.pdf',
    type: 'Invoice',
    linkedRecord: 'Invoice #INV-250101',
    status: 'Approved',
    department: 'Finance',
    classification: 'Internal',
    legalHold: true,
    uploadDate: '2025-01-15',
    uploadedBy: 'Maria López',
    fileSize: '3.8',
    description: 'Monthly supplier invoice for raw materials batch A-47',
    tags: ['supplier-xyz', 'urgent', 'q1', 'finance'],
    versions: [{ version: 1, date: '2025-01-15', size: '3.8 MB' }],
    auditTrail: [
      '2025-01-15 14:22 – Uploaded by Maria López',
      '2025-01-16 09:10 – Approved by QA Manager',
    ],
  },
  {
    id: 'DOC-20250120-002',
    title: 'Production_Order_PO-47892.pdf',
    type: 'Production Order',
    linkedRecord: 'Production Order #PO-47892',
    status: 'Pending',
    department: 'Production',
    classification: 'Internal',
    uploadDate: '2025-01-20',
    uploadedBy: 'Maria López',
    fileSize: '1.2',
    description: 'Order for 500 units of brake discs – line 3',
    tags: ['production', 'line-3', 'brake-discs'],
    versions: [
      { version: 1, date: '2025-01-20', size: '1.2 MB' },
      { version: 2, date: '2025-01-21', size: '1.3 MB' },
    ],
    auditTrail: [
      '2025-01-20 10:05 – Uploaded by Maria López',
      '2025-01-21 08:30 – New version uploaded',
    ],
  },
  {
    id: 'DOC-20250122-003',
    title: 'Invoice_SUPP-ABC_Feb2025.pdf',
    type: 'Invoice',
    linkedRecord: 'Invoice #INV-250202',
    status: 'Approved',
    department: 'Finance',
    classification: 'Confidential',
    uploadDate: '2025-01-22',
    uploadedBy: 'Maria López',
    fileSize: '4.1',
    description: '',
    tags: ['supplier-abc', 'q1'],
    versions: [{ version: 1, date: '2025-01-22', size: '4.1 MB' }],
    auditTrail: ['2025-01-22 16:45 – Uploaded', '2025-01-23 11:20 – Approved'],
  },
  {
    id: 'DOC-20250125-004',
    title: 'Production_Order_PO-47915.pdf',
    type: 'Production Order',
    linkedRecord: 'Production Order #PO-47915',
    status: 'Rejected',
    department: 'Production',
    classification: 'Internal',
    uploadDate: '2025-01-25',
    uploadedBy: 'Maria López',
    fileSize: '0.9',
    description: 'Urgent order for 200 gearbox housings',
    tags: ['urgent', 'gearbox', 'line-2'],
    versions: [{ version: 1, date: '2025-01-25', size: '0.9 MB' }],
    auditTrail: ['2025-01-25 09:15 – Uploaded', '2025-01-25 14:30 – Rejected by Production'],
  },
  {
    id: 'DOC-20250128-005',
    title: 'Invoice_SUPP-DEF_Jan2025.pdf',
    type: 'Invoice',
    linkedRecord: 'Invoice #INV-250128',
    status: 'Pending',
    department: 'Finance',
    classification: 'Internal',
    uploadDate: '2025-01-28',
    uploadedBy: 'Maria López',
    fileSize: '2.7',
    description: 'Spare parts delivery invoice',
    tags: ['supplier-def', 'spare-parts'],
    versions: [
      { version: 1, date: '2025-01-28', size: '2.7 MB' },
      { version: 2, date: '2025-01-29', size: '2.8 MB' },
      { version: 3, date: '2025-01-30', size: '2.8 MB' },
    ],
    auditTrail: [
      '2025-01-28 13:10 – Uploaded',
      '2025-01-29 10:00 – New version',
      '2025-01-30 08:45 – New version',
    ],
  },
  {
    id: 'DOC-20250201-006',
    title: 'Production_Order_PO-47988.pdf',
    type: 'Production Order',
    linkedRecord: 'Production Order #PO-47988',
    status: 'Approved',
    department: 'Production',
    classification: 'Internal',
    uploadDate: '2025-02-01',
    uploadedBy: 'Maria López',
    fileSize: '1.5',
    description: 'Order for 1200 sensor housings',
    tags: ['production', 'sensor', 'q1'],
    versions: [{ version: 1, date: '2025-02-01', size: '1.5 MB' }],
    auditTrail: ['2025-02-01 11:20 – Uploaded', '2025-02-02 07:55 – Approved'],
  },
  {
    id: 'DOC-20250203-007',
    title: 'Invoice_SUPP-XYZ_Feb2025.pdf',
    type: 'Invoice',
    linkedRecord: 'Invoice #INV-250203',
    status: 'Approved',
    department: 'Finance',
    classification: 'Confidential',
    uploadDate: '2025-02-03',
    uploadedBy: 'Maria López',
    fileSize: '5.2',
    description: 'Large batch raw steel invoice',
    tags: ['supplier-xyz', 'raw-material'],
    versions: [{ version: 1, date: '2025-02-03', size: '5.2 MB' }],
    auditTrail: ['2025-02-03 15:30 – Uploaded', '2025-02-04 09:15 – Approved'],
  },
  {
    id: 'DOC-20250205-008',
    title: 'Production_Order_PO-48012.pdf',
    type: 'Production Order',
    linkedRecord: 'Production Order #PO-48012',
    status: 'Pending',
    department: 'Production',
    classification: 'Internal',
    uploadDate: '2025-02-05',
    uploadedBy: 'Maria López',
    fileSize: '2.1',
    description: '',
    tags: ['line-1', 'urgent'],
    versions: [{ version: 1, date: '2025-02-05', size: '2.1 MB' }],
    auditTrail: ['2025-02-05 08:40 – Uploaded'],
  },
  {
    id: 'DOC-20250210-009',
    title: 'Invoice_SUPP-ABC_Feb2025.pdf',
    type: 'Invoice',
    linkedRecord: 'Invoice #INV-250210',
    status: 'Approved',
    department: 'Maintenance',
    classification: 'Internal',
    uploadDate: '2025-02-10',
    uploadedBy: 'Maria López',
    fileSize: '3.4',
    description: 'Maintenance service invoice',
    tags: ['supplier-abc', 'maintenance'],
    versions: [{ version: 1, date: '2025-02-10', size: '3.4 MB' }],
    auditTrail: ['2025-02-10 12:00 – Uploaded', '2025-02-11 10:30 – Approved'],
  },
  {
    id: 'DOC-20250212-010',
    title: 'Production_Order_PO-48045.pdf',
    type: 'Production Order',
    linkedRecord: 'Production Order #PO-48045',
    status: 'Approved',
    department: 'Production',
    classification: 'Confidential',
    uploadDate: '2025-02-12',
    uploadedBy: 'Maria López',
    fileSize: '0.8',
    description: 'Small test batch for new product',
    tags: ['test', 'new-product', 'line-3'],
    versions: [
      { version: 1, date: '2025-02-12', size: '0.8 MB' },
      { version: 2, date: '2025-02-13', size: '0.9 MB' },
    ],
    auditTrail: [
      '2025-02-12 14:15 – Uploaded',
      '2025-02-13 09:20 – New version uploaded',
      '2025-02-13 16:45 – Approved',
    ],
  },
];

/**
 * The `as` cast a `JSON.parse` gives you is not a check.
 *
 * `try/catch` only catches *syntactically* invalid JSON. Valid JSON of the
 * wrong shape — `{}`, or an array written by a build before `tags` existed —
 * sails through the cast and then throws inside a render, at
 * `doc.tags.includes(...)` or `doc.versions.length`, pointing the stack at the
 * consumer instead of at the storage read. This turns that white screen into a
 * controlled reseed.
 */
function isStoredLibrary(value: unknown): value is ManagedDocument[] {
  return (
    Array.isArray(value) &&
    value.every(
      (doc) =>
        typeof doc?.id === 'string' &&
        typeof doc.title === 'string' &&
        typeof doc.department === 'string' &&
        typeof doc.classification === 'string' &&
        Array.isArray(doc.tags) &&
        Array.isArray(doc.versions) &&
        Array.isArray(doc.auditTrail),
    )
  );
}

/**
 * Reseeding replaces the reader's library with the sample data, which looks
 * exactly like a first visit. That is a data-loss event, so it says so — both
 * in the console for whoever is debugging and, via the returned flag, to the
 * caller that can tell the reader.
 */
export function loadDocuments(): { documents: ManagedDocument[]; reseeded: boolean } {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[documents] localStorage is unavailable, using the sample data:', error);
    return { documents: SEED, reseeded: false };
  }

  if (!saved) {
    saveDocuments(SEED);
    // Nothing was stored: a genuine first visit, not a loss.
    return { documents: SEED, reseeded: false };
  }

  try {
    const parsed: unknown = JSON.parse(saved);
    if (isStoredLibrary(parsed)) return { documents: parsed, reseeded: false };
    console.warn('[documents] stored library has the wrong shape, reseeding:', parsed);
  } catch (error) {
    console.warn('[documents] stored library is not valid JSON, reseeding:', error);
  }

  saveDocuments(SEED);
  return { documents: SEED, reseeded: true };
}

/**
 * Returns whether the write landed. The caller needs to know: a "Changes
 * saved" toast over a write that threw is the product telling the reader
 * something untrue, and they find out only when the reload is empty.
 */
export function saveDocuments(documents: ManagedDocument[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    return true;
  } catch (error) {
    // Private browsing, quota, a locked-down kiosk. The session still works.
    console.warn('[documents] could not save to localStorage:', error);
    return false;
  }
}

/** Status maps to a `Badge` tone. The label always ships alongside it. */
export function statusTone(status: DocumentStatus): 'success' | 'warning' | 'critical' {
  if (status === 'Approved') return 'success';
  if (status === 'Pending') return 'warning';
  return 'critical';
}

export function uniqueTags(documents: ManagedDocument[]): string[] {
  const tags = new Set<string>();
  for (const doc of documents) for (const tag of doc.tags) tags.add(tag);
  return [...tags].sort();
}

export type Filters = {
  search: string;
  type: '' | DocumentType;
  activeTags: string[];
  /** RET-11: retention state filters like any other attribute. */
  retention: string;
};

export const NO_FILTERS: Filters = { search: '', type: '', activeTags: [], retention: '' };

export function filtersAreActive(filters: Filters): boolean {
  return Boolean(
    filters.search || filters.type || filters.activeTags.length || filters.retention,
  );
}

export function applyFilters(documents: ManagedDocument[], filters: Filters): ManagedDocument[] {
  const needle = filters.search.trim().toLowerCase();
  return documents.filter((doc) => {
    const matchesSearch =
      !needle ||
      doc.title.toLowerCase().includes(needle) ||
      doc.description.toLowerCase().includes(needle);
    const matchesType = !filters.type || doc.type === filters.type;
    /*
     * RET-11: the retention state is computed, not stored, so it filters on the
     * computed value. Filtering on a column that does not exist is how this
     * clause failed silently the first time it was written.
     */
    const matchesRetention = !filters.retention || retentionOf(doc).state === filters.retention;
    /*
     * FLT-2: values inside one facet combine with OR, facets with AND. Tags are
     * one facet, so `some`, not `every` — with `every`, picking two tags asked
     * for documents carrying both and almost always returned nothing.
     */
    const matchesTags =
      filters.activeTags.length === 0 ||
      filters.activeTags.some((tag) => doc.tags.includes(tag));
    return matchesSearch && matchesType && matchesTags && matchesRetention;
  });
}

/* ── Rendering in the reader's locale (XC-5) ──────────────────────────────
 *
 * XC-5 has two halves. This is the half that is done: dates, numbers and file
 * sizes go through `Intl` and follow the reader's locale. The other half —
 * every user-facing string living in a catalogue rather than in the JSX — is
 * not done, and pretending otherwise with a half-built `t()` would be worse
 * than saying so. See requirements/README.md.
 */

/**
 * A stored `YYYY-MM-DD` is a calendar date, so parse it as local.
 * `new Date('2025-01-15')` gives UTC midnight instead — ECMAScript specifies
 * the date-only form as UTC — which renders as the 14th for any reader west of
 * Greenwich. A date wrong by one day is worse than a date nobody formatted.
 *
 * The regex validates the shape; the round-trip validates the value. Without
 * it `new Date(2025, 1, 30)` rolls over and "2025-02-30" renders confidently
 * as 2 March, and sorts there too.
 */
function parseStoredDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const survivedRoundTrip =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return survivedRoundTrip ? date : null;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function formatDate(iso: string): string {
  const date = parseStoredDate(iso);
  if (date) return dateFormat.format(date);

  /*
   * Rendering the raw value beats "Invalid Date", but this fallback is
   * invisible twice over: among rows reading "15 Jan 2025" one reading
   * "2025-01-15T10:00:00Z" looks like a formatting quirk, and `sortValue`
   * returns null for the same document, pinning it to the end of every date
   * sort in both directions. Neither symptom names a cause, so leave a trail.
   */
  console.warn('[documents] stored date is not YYYY-MM-DD, rendering raw:', iso);
  return iso;
}

const sizeFormat = new Intl.NumberFormat(undefined, {
  style: 'unit',
  unit: 'megabyte',
  maximumFractionDigits: 1,
});

/**
 * Two shapes exist in the seed data itself — `"3.8"` on a document and
 * `"3.8 MB"` on a version — so one formatter has to read either. Normalising
 * them would mean migrating saved sessions to buy nothing.
 *
 * What it must not do is guess. The first version used `Number.parseFloat`,
 * which discards the suffix, and then appended `MB` unconditionally: `"820 KB"`
 * rendered as `820 MB` and `"1.2 GB"` as `1.2 MB`, each wrong by a factor of a
 * thousand, with the declared fallback never firing because the parse
 * *succeeded*. Megabytes are the stored contract, so anything else is corrupt
 * data and says so rather than being relabelled.
 */
export function formatSize(size: string | number): string {
  if (typeof size === 'number') {
    return Number.isFinite(size) ? sizeFormat.format(size) : 'Unknown size';
  }

  const match = /^\s*(\d+(?:\.\d+)?)\s*(?:MB)?\s*$/i.exec(size);
  if (match) return sizeFormat.format(Number(match[1]));

  console.warn('[documents] stored size is not megabytes, rendering raw:', size);
  return size.trim() || 'Unknown size';
}

const countFormat = new Intl.NumberFormat();

export function formatCount(value: number): string {
  return countFormat.format(value);
}

/* ── Sorting (SRT-6, SRT-7, SRT-8, SRT-9, SRT-10) ────────────────────────── */

export const SORT_KEYS = [
  'title',
  'type',
  'status',
  'uploadDate',
  'fileSize',
  // RET-11: sortable like any other attribute, and it sorts by the computed
  // state rather than by a stored string, because there is no stored string.
  'retention',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = 'ascending' | 'descending';

/**
 * `key` is `SortKey`, not `string`.
 *
 * It was `string`, and `SortKey` was declared and never used. That is not a
 * tidiness point: `sortValue`'s `default` branch returns null for an unknown
 * key, so renaming a column or mistyping a `SORT_OPTIONS` value made *every*
 * row null, `sortDocuments` fell back to id order for every pair, and the
 * table went on rendering its sort arrow over a list ordered by something
 * else. No type error, no runtime error, no visible symptom. A union makes it
 * a compile failure.
 */
export type Sort = { key: SortKey; direction: SortDirection };

export const DEFAULT_SORT: Sort = { key: 'uploadDate', direction: 'descending' };

/**
 * SRT-3: activating a column sorts it in *that column's* natural default, not
 * always ascending. The newest upload and the largest file are what a reader
 * asking for either is looking for; a status sorts by what needs attention.
 */
export function naturalDirection(key: SortKey): SortDirection {
  return key === 'uploadDate' || key === 'fileSize' ? 'descending' : 'ascending';
}

/**
 * SRT-3 again: "alphabetical order of a status is meaningless". Ordering the
 * raw string gives *Approved, Pending, Rejected* — the requirement asks for
 * the order that needs attention first.
 */
const STATUS_RANK: DocumentStatus[] = ['Pending', 'Rejected', 'Approved'];

/**
 * SRT-10: sort by the underlying value, never the rendered string. A size
 * column sorted as text puts "10" before "3.8", and now that dates render in
 * the reader's locale, sorting their rendered form would order them by whatever
 * the locale happens to put first.
 */
function sortValue(doc: ManagedDocument, key: SortKey): string | number | null {
  switch (key) {
    case 'uploadDate': {
      const date = parseStoredDate(doc.uploadDate);
      return date ? date.getTime() : null;
    }
    case 'fileSize': {
      const mb = Number.parseFloat(doc.fileSize);
      return Number.isFinite(mb) ? mb : null;
    }
    case 'status': {
      const rank = STATUS_RANK.indexOf(doc.status);
      return rank === -1 ? null : rank;
    }
    case 'retention': {
      /*
       * RET-11. Ordered by how much attention the state needs, for the reason
       * SRT-3 gives about status: the alphabetical order of a retention state
       * is meaningless. `RETENTION_STATES` puts "Due for review" first.
       */
      const rank = RETENTION_STATES.indexOf(retentionOf(doc).state);
      return rank === -1 ? null : rank;
    }
    case 'title':
    case 'type': {
      const text = doc[key].trim();
      return text === '' ? null : text;
    }
  }
}

/**
 * SRT-7 and SRT-8 in one option bag.
 *
 * `numeric` compares digit runs as numbers, so a `PO-9` sorts before a
 * `PO-48012` rather than after it. Today's seed data is uniformly five-digit,
 * so this is insurance rather than an observable behaviour — worth having
 * because the first shorter id would otherwise land in the wrong place
 * silently.
 *
 * `sensitivity: 'base'` makes the order case-insensitive. It also treats `ź`
 * and `z` as *equal*, so two Polish titles differing only in diacritics tie
 * and fall through to the `byId` tie-break. SRT-7 asks for diacritics collated
 * by the reader's locale, which `'accent'` would give at the cost of case
 * insensitivity; that half of SRT-7 is therefore unmet, and
 * requirements/README.md counts it as partial rather than met.
 */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function sortDocuments(rows: ManagedDocument[], sort: Sort): ManagedDocument[] {
  const factor = sort.direction === 'ascending' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);

    /*
     * SRT-9: empty values group together and stay at the same end in both
     * directions. Reversing the sort must not march the blanks to the top —
     * they are the absence of an answer, not the smallest answer.
     */
    if (left === null && right === null) return byId(a, b);
    if (left === null) return 1;
    if (right === null) return -1;

    const compared =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : collator.compare(String(left), String(right));

    // SRT-6: a defined secondary key, so equal values never swap order between
    // renders. Ties break on the one field guaranteed unique and stable.
    return compared === 0 ? byId(a, b) : compared * factor;
  });
}

function byId(a: ManagedDocument, b: ManagedDocument): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
