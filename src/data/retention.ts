/**
 * Retention: a policy is an object with a lifecycle, not a number typed into a
 * document type.
 *
 * `RET-1` is the load-bearing requirement here and it is easy to get wrong in
 * the cheap direction — a `retainYears` field on the type would satisfy a demo
 * and none of the rest of this file. A policy outlives the documents it governs
 * and usually outlives whoever configured it, which is why it is versioned
 * (`RET-8`), why retiring it does not release what it already holds (`RET-7`),
 * and why a document records the policy *version* that governs it rather than a
 * pointer that changes underneath it.
 */

import type { DocumentType, ManagedDocument } from './documents';

/* ── The policy (RET-1, RET-2, RET-3, RET-5, RET-8) ─────────────────────── */

/** `RET-5`: exactly one of three, and the three mean different things. */
export const POLICY_STATES = ['Draft', 'Active', 'Retired'] as const;
export type PolicyState = (typeof POLICY_STATES)[number];

/** `RET-2`: a value and a unit, never a free-text duration. */
export const PERIOD_UNITS = ['days', 'months', 'years'] as const;
export type PeriodUnit = (typeof PERIOD_UNITS)[number];

/**
 * `RET-3`: a policy names the event its period counts from. These are the three
 * this fiction has, and the difference matters: an approval may never happen,
 * which is what `RET-4` is about.
 */
export const START_EVENTS = ['Upload', 'Approval', 'End of fiscal year'] as const;
export type StartEvent = (typeof START_EVENTS)[number];

export type RetentionPolicy = {
  id: string;
  name: string;
  /** `RET-8`: policies are versioned. */
  version: number;
  state: PolicyState;
  period: { value: number; unit: PeriodUnit };
  startEvent: StartEvent;
  /** Which document type this policy governs. One policy per type here. */
  appliesTo: DocumentType;
  description: string;
  modifiedAt: string;
  modifiedBy: string;
};

export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: 'RP-INV',
    name: 'Statutory invoice retention',
    version: 3,
    state: 'Active',
    period: { value: 7, unit: 'years' },
    startEvent: 'End of fiscal year',
    appliesTo: 'Invoice',
    description: 'Seven years from the close of the fiscal year the invoice falls in.',
    modifiedAt: '2026-01-08',
    modifiedBy: 'A. Lindqvist',
  },
  {
    id: 'RP-PROD',
    name: 'Production order retention',
    version: 2,
    state: 'Active',
    period: { value: 24, unit: 'months' },
    startEvent: 'Approval',
    appliesTo: 'Production Order',
    description:
      'Two years from approval. An order that was never approved has not started its clock.',
    modifiedAt: '2026-03-22',
    modifiedBy: 'A. Lindqvist',
  },
  {
    id: 'RP-PROD-OLD',
    name: 'Production order retention (superseded)',
    version: 1,
    state: 'Retired',
    period: { value: 12, unit: 'months' },
    startEvent: 'Upload',
    appliesTo: 'Production Order',
    description:
      'Retired in favour of RP-PROD v2. Retiring released nothing: documents already governed by it still are.',
    modifiedAt: '2026-03-22',
    modifiedBy: 'A. Lindqvist',
  },
  {
    id: 'RP-INV-DRAFT',
    name: 'Shortened invoice retention',
    version: 1,
    state: 'Draft',
    period: { value: 5, unit: 'years' },
    startEvent: 'End of fiscal year',
    appliesTo: 'Invoice',
    description: 'Draft governs nothing. Awaiting legal sign-off before it can become active.',
    modifiedAt: '2026-08-30',
    modifiedBy: 'A. Lindqvist',
  },
];

export function periodLabel(policy: RetentionPolicy): string {
  const { value, unit } = policy.period;
  return `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}`;
}

/**
 * `RET-7`: retiring a policy does not release the documents it already governs.
 *
 * So "which policy governs this document" is not "the active policy for its
 * type" — a document filed under v1 stays under v1 even after v1 is retired.
 * This fiction records no per-document assignment, so the rule is applied the
 * only honest way available: the policy in force when the document was
 * uploaded. A real product stores the assignment; the prototype derives it and
 * says so.
 */
export function governingPolicy(doc: ManagedDocument): RetentionPolicy | undefined {
  const candidates = RETENTION_POLICIES.filter(
    (policy) => policy.appliesTo === doc.type && policy.state !== 'Draft',
  );
  // The most recent policy that already existed when this document arrived.
  const inForce = candidates
    .filter((policy) => policy.modifiedAt <= doc.uploadDate)
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  return inForce[0] ?? candidates.sort((a, b) => a.version - b.version)[0];
}

/* ── The computed state (RET-4, RET-10, RET-12, RET-13) ─────────────────── */

export type RetentionState =
  | 'Not started'
  | 'Retained'
  | 'Due for review'
  | 'On legal hold'
  | 'No policy';

export type Retention = {
  state: RetentionState;
  policy?: RetentionPolicy;
  /** `RET-13`: the computed date is unchanged by a hold, only its effect is. */
  expiresOn?: string;
  /** Why the clock has not started, when it has not. */
  reason?: string;
};

function addPeriod(from: Date, { value, unit }: RetentionPolicy['period']): Date {
  const date = new Date(from);
  if (unit === 'days') date.setDate(date.getDate() + value);
  if (unit === 'months') date.setMonth(date.getMonth() + value);
  if (unit === 'years') date.setFullYear(date.getFullYear() + value);
  return date;
}

function parseDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** The trail is the only record of when an approval happened. */
function approvalDate(doc: ManagedDocument): string | null {
  const entry = doc.auditTrail.find((line) => /Status changed to Approved|Approved/.test(line));
  const match = entry && /^(\d{4}-\d{2}-\d{2})/.exec(entry);
  return match ? match[1]! : null;
}

function startDate(doc: ManagedDocument, policy: RetentionPolicy): Date | null {
  switch (policy.startEvent) {
    case 'Upload':
      return parseDate(doc.uploadDate);
    case 'Approval': {
      if (doc.status !== 'Approved') return null;
      const approved = approvalDate(doc) ?? doc.uploadDate;
      return parseDate(approved);
    }
    case 'End of fiscal year': {
      const uploaded = parseDate(doc.uploadDate);
      return uploaded ? new Date(uploaded.getFullYear(), 11, 31) : null;
    }
  }
}

function iso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * `RET-4`: a start event that cannot yet have occurred leaves the document with
 * retention **not yet started**, and the interface says so. A production order
 * that was never approved has no clock running, and reporting that as "retained
 * until —" would be a lie the reader cannot detect.
 */
export function retentionOf(doc: ManagedDocument, today = new Date()): Retention {
  const policy = governingPolicy(doc);
  if (!policy) return { state: 'No policy' };

  const start = startDate(doc, policy);
  if (!start) {
    return {
      state: 'Not started',
      policy,
      reason: `Counts from ${policy.startEvent.toLowerCase()}, which has not happened yet.`,
    };
  }

  const expires = addPeriod(start, policy.period);
  const expiresOn = iso(expires);

  // RET-13: a hold suspends expiry without altering the policy or the date.
  if (doc.legalHold) return { state: 'On legal hold', policy, expiresOn };

  // RET-12: expiry moves it into a review queue and does nothing else. It does
  // not delete, and it does not stop being retained.
  if (expires <= today) return { state: 'Due for review', policy, expiresOn };

  return { state: 'Retained', policy, expiresOn };
}

/** `RET-12`: the disposition review queue is a queue, not a deletion. */
export function dueForReview(documents: ManagedDocument[], today = new Date()): ManagedDocument[] {
  return documents.filter((doc) => retentionOf(doc, today).state === 'Due for review');
}

/**
 * Ordered by how much attention the state needs, not alphabetically — the sort
 * key uses this index. `Due for review` is a person's decision waiting to be
 * made, so it comes first.
 */
export const RETENTION_STATES: RetentionState[] = [
  'Due for review',
  'On legal hold',
  'Not started',
  'Retained',
  'No policy',
];
