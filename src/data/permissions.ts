/**
 * Content permissions: rule-based, driven by metadata, not by location.
 *
 * The model is `PRM`'s: a rule grants or denies a set of operations to a set of
 * roles, for every document whose metadata satisfies the rule's predicate. No
 * folder tree decides anything here, because `PRM` is explicit that access is
 * decided by what a document *is*.
 *
 * Why this file exists at all: the prototype had an approve button that anybody
 * could press. The service blueprint called that out — "approve has a screen
 * but no authority" — and an action with no rule behind it is the one kind of
 * permission bug that never shows up as a bug.
 */

import type { DocumentStatus, DocumentType, ManagedDocument } from './documents';

/* ── Operations (PRM-7) ──────────────────────────────────────────────────── */

/**
 * A fixed vocabulary, and a set rather than a level. `PRM-7` requires read,
 * upload and logical delete at minimum; `edit` and `approve` are here because
 * this product has both and because a role that may read and file but not
 * approve is the ordinary case, not the exception.
 */
export const OPERATIONS = ['read', 'edit', 'approve', 'upload', 'delete'] as const;
export type Operation = (typeof OPERATIONS)[number];

export const OPERATION_LABELS: Record<Operation, string> = {
  read: 'Read',
  edit: 'Edit metadata',
  approve: 'Approve or reject',
  upload: 'Upload',
  delete: 'Delete (logical)',
};

/* ── Roles (PRM-1, PRM-2) ────────────────────────────────────────────────── */

export type Role = {
  id: string;
  name: string;
  /**
   * PRM-1: roles come from the organisation's identity provider and are
   * read-only here. The source is displayed so the interface never offers a
   * rename or delete control that cannot work.
   */
  source: string;
  /**
   * PRM-2: a role that has disappeared from the identity provider is retained
   * and marked, never silently dropped. This product's decision is that rules
   * referencing it *stop* conferring anything — stated here and in the
   * interface, not left to be discovered.
   */
  missingFromDirectory?: boolean;
};

export const ROLES: Role[] = [
  { id: 'controller', name: 'Document controller', source: 'Corporate directory' },
  { id: 'quality', name: 'Quality manager', source: 'Corporate directory' },
  { id: 'finance', name: 'Finance approver', source: 'Corporate directory' },
  { id: 'auditor', name: 'External auditor', source: 'Corporate directory (guest)' },
  {
    id: 'lineLead',
    name: 'Line lead (retired)',
    source: 'Corporate directory',
    missingFromDirectory: true,
  },
];

export function roleById(id: string): Role | undefined {
  return ROLES.find((role) => role.id === id);
}

/* ── Predicates (PRM-8) ─────────────────────────────────────────────────── */

/**
 * PRM-8: a predicate is a conjunction of metadata comparisons, and it
 * references fields by definition — never by a free-typed name. That is what
 * this union is: the set of fields a rule is allowed to talk about.
 */
export const METADATA_FIELDS = ['type', 'status', 'department', 'classification'] as const;
export type MetadataField = (typeof METADATA_FIELDS)[number];

export const FIELD_LABELS: Record<MetadataField, string> = {
  type: 'type',
  status: 'status',
  department: 'department',
  classification: 'classification',
};

export type Comparison = { field: MetadataField; equals: string };

/** A rule with an empty predicate reaches every document, and says so. */
export function predicateSummary(predicate: Comparison[]): string {
  if (predicate.length === 0) return 'every document';
  return predicate.map(({ field, equals }) => `${FIELD_LABELS[field]} = ${equals}`).join(' AND ');
}

function matches(doc: ManagedDocument, predicate: Comparison[]): boolean {
  return predicate.every(({ field, equals }) => documentField(doc, field) === equals);
}

function documentField(doc: ManagedDocument, field: MetadataField): string {
  switch (field) {
    case 'type':
      return doc.type;
    case 'status':
      return doc.status;
    case 'department':
      return doc.department;
    case 'classification':
      return doc.classification;
  }
}

/* ── Rules (PRM-4, PRM-5, PRM-9, PRM-11) ────────────────────────────────── */

export type RuleType = 'Grant' | 'Deny';

/**
 * PRM-4: name, description, enabled flag, type, operation scope, assigned roles
 * and predicate — all seven visible in the list without opening the rule,
 * because a rule whose effect can only be learned by opening it will not be
 * reviewed. PRM-11 adds who last changed it and when.
 */
export type PermissionRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: RuleType;
  operations: Operation[];
  roles: string[];
  predicate: Comparison[];
  modifiedAt: string;
  modifiedBy: string;
};

export const PERMISSION_RULES: PermissionRule[] = [
  {
    id: 'PR-001',
    name: 'Staff may read the document library',
    description: 'Baseline read access for everyone who files or reviews documents.',
    enabled: true,
    type: 'Grant',
    operations: ['read'],
    roles: ['controller', 'quality', 'finance', 'auditor'],
    predicate: [],
    modifiedAt: '2026-04-02',
    modifiedBy: 'M. Okonkwo',
  },
  {
    id: 'PR-002',
    name: 'Controllers file and correct metadata',
    description: 'Filing is the controller’s job, including fixing a type that arrived wrong.',
    enabled: true,
    type: 'Grant',
    operations: ['edit', 'upload'],
    roles: ['controller'],
    predicate: [],
    modifiedAt: '2026-04-02',
    modifiedBy: 'M. Okonkwo',
  },
  {
    id: 'PR-003',
    name: 'Quality managers approve production orders',
    description: 'Production output is signed off on the line, not in finance.',
    enabled: true,
    type: 'Grant',
    operations: ['approve'],
    roles: ['quality', 'controller'],
    predicate: [{ field: 'type', equals: 'Production Order' }],
    modifiedAt: '2026-05-19',
    modifiedBy: 'M. Okonkwo',
  },
  {
    id: 'PR-004',
    name: 'Finance approves invoices',
    description: 'Segregation of duties: whoever files an invoice does not approve it.',
    enabled: true,
    type: 'Grant',
    operations: ['approve'],
    roles: ['finance'],
    predicate: [{ field: 'type', equals: 'Invoice' }],
    modifiedAt: '2026-05-19',
    modifiedBy: 'A. Lindqvist',
  },
  {
    id: 'PR-005',
    name: 'Confidential content is withheld from guests',
    description:
      'Deny outranks grant, so this removes read from the baseline rule for one classification.',
    enabled: true,
    type: 'Deny',
    operations: ['read'],
    roles: ['auditor'],
    predicate: [{ field: 'classification', equals: 'Confidential' }],
    modifiedAt: '2026-06-01',
    modifiedBy: 'A. Lindqvist',
  },
  {
    id: 'PR-006',
    name: 'Controllers may retire superseded documents',
    description: 'Disabled while the retention policy that replaces it is drafted.',
    enabled: false,
    type: 'Grant',
    operations: ['delete'],
    roles: ['controller'],
    predicate: [{ field: 'status', equals: 'Rejected' }],
    modifiedAt: '2026-07-14',
    modifiedBy: 'M. Okonkwo',
  },
  {
    id: 'PR-007',
    name: 'Line leads approve their own line',
    description: 'Left in place deliberately: the role it names no longer exists.',
    enabled: true,
    type: 'Grant',
    operations: ['approve', 'edit'],
    roles: ['lineLead'],
    predicate: [{ field: 'department', equals: 'Production' }],
    modifiedAt: '2026-02-28',
    modifiedBy: 'M. Okonkwo',
  },
];

/* ── Resolution (PRM-6) ─────────────────────────────────────────────────── */

/**
 * PRM-2 applied at evaluation: a role missing from the directory confers
 * nothing. PRM-17's sibling case — a rule that silently evaluates to nothing is
 * indistinguishable from a rule that works — is why `invalidRules` exists
 * below, so the interface can show it rather than skip it.
 */
function conferring(rule: PermissionRule, roleId: string): boolean {
  if (!rule.enabled) return false;
  if (!rule.roles.includes(roleId)) return false;
  return !rule.roles.some((id) => roleById(id)?.missingFromDirectory && id === roleId);
}

/**
 * PRM-6: **deny outranks grant.** Grants union, then denies subtract. Any other
 * precedence would be defensible only if it were equally explicit; what is not
 * defensible is leaving it to be discovered, which is why the rules screen
 * states this in the interface and not only here.
 */
export function effectiveOperations(
  doc: ManagedDocument,
  roleId: string,
  rules: PermissionRule[] = PERMISSION_RULES,
): Set<Operation> {
  const granted = new Set<Operation>();
  const denied = new Set<Operation>();

  for (const rule of rules) {
    if (!conferring(rule, roleId)) continue;
    if (!matches(doc, rule.predicate)) continue;
    const target = rule.type === 'Grant' ? granted : denied;
    for (const operation of rule.operations) target.add(operation);
  }

  for (const operation of denied) granted.delete(operation);
  return granted;
}

export function can(
  doc: ManagedDocument,
  roleId: string,
  operation: Operation,
  rules: PermissionRule[] = PERMISSION_RULES,
): boolean {
  return effectiveOperations(doc, roleId, rules).has(operation);
}

/**
 * The rule that actually decided a refusal, so the interface can name it.
 *
 * An interface that says "you cannot do this" without saying which rule said so
 * produces a support ticket. This returns the deny that removed the operation,
 * or undefined when the operation was simply never granted.
 */
export function denyingRule(
  doc: ManagedDocument,
  roleId: string,
  operation: Operation,
  rules: PermissionRule[] = PERMISSION_RULES,
): PermissionRule | undefined {
  return rules.find(
    (rule) =>
      rule.type === 'Deny' &&
      conferring(rule, roleId) &&
      rule.operations.includes(operation) &&
      matches(doc, rule.predicate),
  );
}

/** PRM-3: the "what can this role see?" direction, resolved against the rules. */
export function rulesForRole(
  roleId: string,
  rules: PermissionRule[] = PERMISSION_RULES,
): PermissionRule[] {
  return rules.filter((rule) => rule.roles.includes(roleId));
}

export function operationsForRole(
  roleId: string,
  rules: PermissionRule[] = PERMISSION_RULES,
): Operation[] {
  const granted = new Set<Operation>();
  for (const rule of rules) {
    if (rule.type !== 'Grant' || !conferring(rule, roleId)) continue;
    for (const operation of rule.operations) granted.add(operation);
  }
  return OPERATIONS.filter((operation) => granted.has(operation));
}

/**
 * PRM-2 / PRM-17: rules whose definitions no longer resolve. Surfaced as
 * invalid rather than skipped, because a rule that evaluates to nothing looks
 * exactly like a rule that is working.
 */
export function invalidRules(rules: PermissionRule[] = PERMISSION_RULES): PermissionRule[] {
  return rules.filter((rule) =>
    rule.roles.some((id) => {
      const role = roleById(id);
      return !role || role.missingFromDirectory;
    }),
  );
}

/* ── XC-1 ───────────────────────────────────────────────────────────────── */

/**
 * XC-1: where permissions reduce a result set, the interface must say how many
 * items were withheld. A silently shortened list is a correctness bug, not a
 * security feature — the reader concludes the document is gone.
 */
export function partitionByRead(
  documents: ManagedDocument[],
  roleId: string,
  rules: PermissionRule[] = PERMISSION_RULES,
): { visible: ManagedDocument[]; withheld: number } {
  const visible = documents.filter((doc) => can(doc, roleId, 'read', rules));
  return { visible, withheld: documents.length - visible.length };
}

export type { DocumentStatus, DocumentType };
