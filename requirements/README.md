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
| Permissions and roles | 24 | [permissions-and-roles.md](permissions-and-roles.md) |
| Upload and versioning | 23 | [upload-and-versioning.md](upload-and-versioning.md) |
| Bulk download | 16 | [bulk-download.md](bulk-download.md) |
| Bulk operations | 13 | [bulk-operations.md](bulk-operations.md) |
| Retention policies | 13 | [retention-policies.md](retention-policies.md) |
| Filter | 15 | [filter.md](filter.md) |
| Sort | 14 | [sort.md](sort.md) |
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

Honest accounting, recounted against the code rather than remembered. Of 168
requirements: **26 met, 7 partial, 135 not implemented.**

| Area | Met | Partial | Not | State |
| ---- | --- | ------- | --- | ----- |
| Filter (15) | 7 | 1 | 7 | Facets are type, tags and free text; they compose correctly and both empty states exist. No date facet, no facet counts, no saved views, no URL state. |
| Sort (14) | 11 | 1 | 2 | Sorts the underlying value, naturally, case-insensitively, with a defined secondary key and blanks pinned to one end. Available in both the table and the grid. Not server-side, not in the URL. |
| Upload and versioning (23) | 6 | 3 | 14 | Single and multi-file upload, an immutable version chain, an audit trail, and the type proposed at upload rather than assumed. No folder upload, no checksums, no virus scanning, no check-out. |
| Cross-cutting (6) | 2 | 2 | 2 | Every state change is audited. Dates, sizes and counts render in the reader's locale — except audit-trail timestamps, see below. Strings are still hard-coded English; nothing is cancellable. |
| Dossier management — user (20) | 0 | 0 | 20 | No dossier concept in the data model. |
| Dossier management — admin (24) | 0 | 0 | 24 | No dossier types, no file plan. |
| Permissions and roles (24) | 0 | 0 | 24 | One user, no access control. |
| Bulk download (16) | 0 | 0 | 16 | — |
| Bulk operations (13) | 0 | 0 | 13 | No selection model. |
| Retention policies (13) | 0 | 0 | 13 | — |

### What the prototype deliberately cannot reach

Some requirements are not oversights, and it is worth separating them from the
ones that are. `UPL-4`, `FLT-14` and `SRT-12` all require enforcement or
evaluation on a server, and there is no server — `localStorage` is the whole
backend. `FLT-10` and `SRT-13` require encoding state in the URL, and there is
no router: navigation is React state, which
[`.claude/handoff.json`](../.claude/handoff.json) records as a deliberate limit.
These stay open rather than being quietly reclassified as done.

`XC-5` is half done, and the halves are worth naming. Dates, numbers and file
sizes go through `Intl` and follow the reader's locale. Every user-facing string
is still hard-coded English in the JSX. A `t()` wrapper over hard-coded English
would have made the requirement *look* met while changing nothing, so the
requirement stays partial.

One deliberate exception inside the half that *is* done: **audit-trail
timestamps are not `Intl`-formatted.** The trail is an append-only log, so its
entries keep one fixed `YYYY-MM-DD HH:MM` shape — they stay aligned, they sort
as text, and an entry reads the same to every reader. They are local wall clock,
not UTC; they used to be UTC, which stamped an action with a time up to a day
away from the reader's own clock. See `stamp()` in
[src/data/documents.ts](../src/data/documents.ts).

### Per requirement, so the recount can be checked

An area-level count cannot be verified by a reader, which makes "recounted
against the code" an assertion rather than a claim. Here is the mapping behind
it for the four areas with any implementation. The other six areas are
uniformly *not implemented* and are not repeated here.

**Filter — 7 met, 1 partial, 7 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `FLT-2` `FLT-4` `FLT-6` `FLT-7` `FLT-8` `FLT-11` `FLT-12` | `FLT-1` (type, tags and free text only — no status, owner, date or dossier facet) | `FLT-3` `FLT-5` `FLT-9` `FLT-10` `FLT-13` `FLT-14` `FLT-15` |

`FLT-9` is worth naming because it looks like it might be met and is not:
nothing manages scroll position or focus when a filter changes.

**Sort — 11 met, 1 partial, 2 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `SRT-1` `SRT-2` `SRT-3` `SRT-4` `SRT-5` `SRT-6` `SRT-8` `SRT-9` `SRT-10` `SRT-11` `SRT-14` | `SRT-7` | `SRT-12` `SRT-13` |

`SRT-7` is partial for a reason that matters to a team writing Polish. The
collator uses `sensitivity: 'base'`, which delivers the case-insensitive half —
but it also makes `ź` and `z` *equal*, so two titles differing only in
diacritics tie and fall through to the id tie-break. `SRT-7` asks for diacritics
collated by the reader's locale; `'accent'` would give that, at the cost of case
insensitivity. Neither setting satisfies the whole requirement.

`SRT-3` and `SRT-4` were both unmet until this pass, and both were counted as
met before they were. `SRT-3` now applies each column's own default direction
instead of the design system `Table`'s blanket ascending, and ranks status
*Pending, Rejected, Approved* rather than alphabetically — the requirement calls
the alphabetical order of a status meaningless. `SRT-4` now announces a sort
change in the grid, which has no column headers to carry `aria-sort`.

**Upload and versioning — 6 met, 3 partial, 14 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `UPL-2` `UPL-3` `UPL-9` `UPL-10` `UPL-14` `UPL-19` | `UPL-1` (single and many, no folder) · `UPL-5` (oversized files are separated, but there is no real failure path) · `UPL-11` (a version records number, date and size — no author, checksum or comment) | `UPL-4` `UPL-6` `UPL-7` `UPL-8` `UPL-12` `UPL-13` `UPL-15` `UPL-16` `UPL-17` `UPL-18` `UPL-20` `UPL-21` `UPL-22` `UPL-23` |

**Cross-cutting — 2 met, 2 partial, 2 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `XC-2` `XC-4` | `XC-3` (no destructive action exists to confirm; removing a tag is immediate) · `XC-5` (locale rendering done, string externalisation not) | `XC-1` `XC-6` |

### Corrected here, having been wrong rather than absent

An earlier version of this table said "Filter — Partial", which read as a
missing feature. Four of the entries above were not missing features but defects
against requirements already written down, and the table was hiding them:

| Was | Requirement |
| --- | ----------- |
| Tag values combined with AND, so picking two tags returned nothing | [`FLT-2`](filter.md) |
| The document type was fixed to *Invoice* at upload and could never be changed | [`UPL-19`](upload-and-versioning.md) |
| Editing a description or a tag changed the document and wrote no audit entry | [`XC-2`](README.md) |
| The grid view offered no way to order it at all | [`SRT-14`](sort.md) |

The lesson kept here rather than in a commit message: a status table that
summarises by area cannot distinguish "not built yet" from "built wrong", and
the second is the one worth acting on.
