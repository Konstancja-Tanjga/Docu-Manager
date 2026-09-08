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
requirements: **69 met, 10 partial, 89 not implemented.**

| Area | Met | Partial | Not | State |
| ---- | --- | ------- | --- | ----- |
| Filter (15) | 7 | 1 | 7 | Facets are type, tags and free text; they compose correctly and both empty states exist. No date facet, no facet counts, no saved views, no URL state. |
| Sort (14) | 11 | 1 | 2 | Sorts the underlying value, naturally, case-insensitively, with a defined secondary key and blanks pinned to one end. Available in both the table and the grid. Not server-side, not in the URL. |
| Upload and versioning (23) | 6 | 3 | 14 | Single and multi-file upload, an immutable version chain, an audit trail, and the type proposed at upload rather than assumed. No folder upload, no checksums, no virus scanning, no check-out. |
| Cross-cutting (6) | 3 | 2 | 1 | Every state change is audited, and a permission-reduced list states how many items it withheld. Dates, sizes and counts render in the reader's locale — except audit-trail timestamps, see below. Strings are still hard-coded English; nothing is cancellable. |
| Dossier management — user (20) | 0 | 0 | 20 | No dossier concept in the data model. |
| Dossier management — admin (24) | 0 | 0 | 24 | No dossier types, no file plan. |
| Permissions and roles (24) | 12 | 0 | 12 | Rule-based and driven by metadata: grants and denies over predicates, deny outranks grant, roles read-only from the directory. Approve, edit and upload are all resolved against the rules. No rule editor, no logical delete, no metadata-field administration. |
| Bulk download (16) | 9 | 1 | 6 | The design half: what the manifest says, which documents are excluded and why, and filenames that stay safe. There is no archive writer and no server, so no file content, no dossier structure and no asynchronous job. |
| Bulk operations (13) | 11 | 1 | 1 | Selection, a bar that appears only when there is one, bulk tagging validated per document, and results reported per item in two places. No bulk delete, because nothing deletes. |
| Retention policies (13) | 10 | 1 | 2 | A policy is a versioned object with a lifecycle. Retiring one releases nothing, a legal hold suspends expiry without moving the date, and expiry is a review queue rather than a deletion. No policy editor. |

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

**Permissions and roles — 12 met, 0 partial, 12 not**

| Met | Not |
| --- | --- |
| `PRM-1` `PRM-2` `PRM-3` `PRM-4` `PRM-5` `PRM-6` `PRM-7` `PRM-8` `PRM-9` `PRM-10` `PRM-11` `PRM-17` | `PRM-12` `PRM-13` `PRM-14` `PRM-15` `PRM-16` `PRM-18` `PRM-19` `PRM-20` `PRM-21` `PRM-22` `PRM-23` `PRM-24` |

What is met is the evaluation model and its reviewability: a rule is a named
object with a description, an enabled flag, a type, an operation scope, roles
and a predicate, and all seven are visible in the list without opening it
(`PRM-4`). Deny outranks grant, and the interface says so rather than leaving
it in the source (`PRM-6`). A disabled rule is visibly not enforced and stays
in the list for review (`PRM-9`). A role that has left the directory is
retained, marked, confers nothing, and the rules naming it are named back
(`PRM-2`, `PRM-17`).

What is not met divides in two. **`PRM-12` through `PRM-16` and `PRM-20`
through `PRM-24` are administration** — a rule editor that shows a predicate's
effect before saving, and the metadata-field management the predicates stand
on. **`PRM-18` and `PRM-19` are logical deletion**: the `delete` operation
exists in the vocabulary and one rule confers it, but nothing in the product
deletes anything, so there is no recoverable state and no deleted view.

One honest caveat about the role switcher in the app bar: `PRM-1` says roles
come from the identity provider and are read-only here, so a product has no
business changing one. It is openly a stand-in for signing in as somebody
else, because a rule-based permission model that cannot be seen from more than
one role cannot be reviewed at all.

**Cross-cutting — 3 met, 2 partial, 1 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `XC-1` `XC-2` `XC-4` | `XC-3` (no destructive action exists to confirm; removing a tag is immediate) · `XC-5` (locale rendering done, string externalisation not) | `XC-6` |

`XC-1` moved with the permission model: a list shortened by permissions now
states how many documents were withheld and points at the screen that says
which rule decided. It is deliberately a note above the list rather than an
empty state — the list is not empty, and a reader whose result set silently
shrank concludes the document is gone.

**Retention — 10 met, 1 partial, 2 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `RET-1` `RET-2` `RET-3` `RET-4` `RET-5` `RET-7` `RET-10` `RET-11` `RET-12` `RET-13` | `RET-8` | `RET-6` `RET-9` |

`RET-8` is partial for a reason worth stating: policies are versioned, but a
document does not *record* the version governing it — the prototype derives it
from the policy in force when the document arrived. A real product stores the
assignment, because deriving it means a change to history changes the answer.
The derivation is commented as the compromise it is.

`RET-6` and `RET-9` both need an editor: the constraint that an active policy
cannot have its period shortened, and the report of how many documents a change
would affect. There is no editor, so neither is built.

The three that are easiest to fake and are not faked: **retiring a policy
releases nothing** — the retired policy still shows a count of what it governs;
**a legal hold suspends expiry without altering the computed date**, so the
document says "would expire" and keeps the date; and **expiry is a queue**, so
a document whose period elapsed appears for review and is otherwise untouched.

**Bulk operations — 11 met, 1 partial, 1 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `BLK-1` `BLK-3` `BLK-4` `BLK-5` `BLK-6` `BLK-8` `BLK-9` `BLK-10` `BLK-11` `BLK-12` `BLK-13` | `BLK-2` | `BLK-7` |

`BLK-2` wants selecting the loaded page and selecting the whole filtered result
to be two distinct actions. Both exist, but there is no paging in this
prototype, so the two sets coincide and the distinction cannot be observed —
which is the thing `BLK-2` is actually about. Implemented, unobservable, so:
partial.

`BLK-7` is bulk logical delete, and nothing in this product deletes anything
(see `PRM-18`). A confirm dialog over an operation that does not exist would be
theatre.

`BLK-12` is the one worth clicking. Add the same tag twice: the second attempt
reports **per document** why each one did not change, not "3 of 8 failed".

**Bulk download — 9 met, 1 partial, 6 not**

| Met | Partial | Not |
| --- | ------- | --- |
| `BDL-2` `BDL-3` `BDL-4` `BDL-5` `BDL-7` `BDL-8` `BDL-9` `BDL-15` `BDL-16` | `BDL-1` | `BDL-6` `BDL-10` `BDL-11` `BDL-12` `BDL-13` `BDL-14` |

What is met is the half that is a design problem: what the manifest has to say,
which documents are left out and why, and how a filename stays deterministic,
collision-free and safe. Two documents in the seed data share a title, so the
id carries the uniqueness rather than the title — that is `BDL-7` earning its
place rather than being asserted.

`BDL-5` is the requirement this needed the permission model for: **download is
a distinct operation from read.** Being allowed to see a document on screen is
not being allowed to take a copy away, and the auditor role holds read without
download.

What is not met needs a backend. `BDL-6` mirrors a dossier structure that does
not exist here; `BDL-10` through `BDL-14` are an asynchronous job with progress,
cancellation, notification and an expiring link. There is no archive writer
either, so what downloads is the metadata and the manifest — not the files.
That limit is in the export module's own doc comment, not only here.

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
