# Requirements

Functional requirements for DocuManager, written against general document
management practice rather than any one vendor's product. They describe the
target system, not the prototype in `src/` — see the status table below for
what actually exists today.

## Areas

| Area | Requirements | File |
| ---- | ------------ | ---- |
| Dossier management — user | 20 | [dossier-management-user.md](dossier-management-user.md) |
| Dossier management — admin | 24 | [dossier-management-admin.md](dossier-management-admin.md) |
| Permissions and roles | 28 | [permissions-and-roles.md](permissions-and-roles.md) |
| Upload and versioning | 23 | [upload-and-versioning.md](upload-and-versioning.md) |
| Bulk download | 16 | [bulk-download.md](bulk-download.md) |
| Bulk operations | 13 | [bulk-operations.md](bulk-operations.md) |
| Retention policies | 13 | [retention-policies.md](retention-policies.md) |
| Filter | 15 | [filter.md](filter.md) |
| Sort | 14 | [sort.md](sort.md) |
| States | 26 | [states.md](states.md) |
| Cross-cutting | 6 | this file |

## How to read a requirement

Each has a stable ID, a single statement of intent, and acceptance criteria that
can be checked. IDs never get reused; a withdrawn requirement keeps its number
and is marked withdrawn.

| Prefix | Area |
| ------ | ---- |
| `DOS-U` | Dossier management, user-facing |
| `DOS-A` | Dossier management, administration |
| `PRM` | Permissions, roles and metadata fields |
| `UPL` | Upload and versioning |
| `BDL` | Bulk download |
| `BLK` | Bulk operations and selection |
| `RET` | Retention policies |
| `FLT` | Filter |
| `SRT` | Sort |
| `STA` | States — empty, loading, error, partial, refused, overfull |
| `XC` | Cross-cutting |

**Must / should / may** carry their RFC 2119 meanings. "Must" is a release gate.

## Vocabulary

These terms are used precisely and match the type names in
[src/data/documents.ts](../src/data/documents.ts) where the prototype has an
equivalent.

| Term | Meaning |
| ---- | ------- |
| **Document** | One logical record. Owns metadata, a status, an audit trail, and one or more versions. Identified by a stable id that never changes across versions. |
| **Version** | One immutable file revision of a document. Numbered from 1, monotonically increasing, never overwritten and never renumbered. |
| **Dossier** | A container grouping documents that belong to one business object — a supplier, an order, a case. Carries its own metadata and its own retention. |
| **Dossier type** | The template a dossier is created from. Fixes the metadata schema, the folder structure, and the lifecycle rules for every dossier of that type. |
| **Reference** | A document appearing in a dossier without being copied into it. One stored document, many dossiers. |
| **Retention** | The period a document or dossier must be kept, and what happens when it expires. |
| **Content permission rule** | A named rule granting or denying a set of operations to a set of roles, for every document whose metadata satisfies its predicate. Access is decided by metadata, never by storage location. |
| **Role** | A named group of users, sourced read-only from the organisation's identity provider. |
| **File plan** | The organisation-wide classification scheme above dossier types — the instrument for filing a new dossier in the right place and finding an existing one. |
| **Retention policy** | A named, versioned object carrying a period, a start event and a lifecycle state, attached to document types. |
| **Audit entry** | An append-only record of who did what, when. Never editable, never deletable by any role. |

## Cross-cutting requirements

These apply to every area and are not repeated in the individual files.

- **`XC-1` Permission filtering is silent to no one.** Where a user's permissions
  reduce a result set, the interface must say how many items were withheld. A
  silently shortened list is a correctness bug, not a security feature.
- **`XC-2` Every state-changing action writes an audit entry.** Including reads
  where the document is classified as sensitive. Audit entries are append-only.
- **`XC-3` Destructive actions are confirmed, and say what they affect.** The
  confirmation names the object and the count. "Delete 14 documents from
  *Supplier XYZ*", not "Are you sure?".
- **`XC-4` Every screen meets WCAG 2.1 AA.** Keyboard reachable, visible focus,
  status never carried by colour alone, live regions for asynchronous results.
- **`XC-5` No user-facing string is hard-coded.** Dates, numbers and file sizes
  render in the user's locale.
- **`XC-6` Long operations are asynchronous and interruptible.** Anything that
  can exceed a few seconds reports progress and can be cancelled without
  corrupting partial state.

## Status in this prototype

Honest accounting. The prototype implements a slice, and these requirements
describe considerably more than it does.

| Area | State |
| ---- | ----- |
| Upload and versioning | Partial — single and multi-file upload, a version chain, an audit trail. No check-out, no checksums, no virus scanning. |
| Filter | Partial — search, type, and tag filters, with both empty states written. No facet counts, no saved views, no URL state. |
| Sort | Partial — sortable table columns with a single active sort. No secondary sort, no natural sort, no persistence. |
| Dossier management | Not implemented. No dossier concept exists in the data model. |
| Bulk download | Not implemented. |
| Bulk operations | Not implemented. No selection model exists. |
| Permissions and roles | Not implemented. The prototype has one user and no access control. |
| States | Partial — both empty states and the oversized-file error exist. No loading, no partial-result, no refusal states. |
| Retention policies | Not implemented. |
