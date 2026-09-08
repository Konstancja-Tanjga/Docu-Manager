# The line of visibility

**DocuManager · user journey and service blueprint**

A journey says *what* happens. A blueprint says **what has to work underneath**
for it to happen — and where the boundary sits between what the person filing a
document can see and what the system does out of sight.

Everything below the **line of interaction** is invisible to Maria. Everything
below the **line of visibility** is invisible to everyone; it is infrastructure.
The last lane is the one worth arguing with: each risk is paired with the
concrete design decision that answers it, and several of those decisions are
the reason a requirement got rewritten.

**Read the `not built` cells as the honest part.** Two of the six phases have no
product behind them at all. They are in the blueprint because the requirements
demand them and because a journey that stops where the prototype stops would
describe a smaller problem than the real one.

---

## The actor

**Maria López**, document controller at a manufacturing site. She files
invoices and production orders against business records, and she is the person
who says whether a document is approved. She is not the person who decides what
the retention period is, and she is not an administrator — which matters,
because the prototype currently lets her do things her role should not permit.

---

## The blueprint

| | **P1 · arrive** | **P2 · find** | **P3 · inspect** | **P4 · bring in** | **P5 · decide** | **P6 · hand off** |
| --- | --- | --- | --- | --- | --- | --- |
| **Phase** | Orient | Narrow a set | Establish what a document *is* | Get a file in | Approve or reject | Export and retain |
| **Maria** *action* | Opens the tool. Reads what is waiting | Searches, filters by type, tag and retention state, orders the result | Opens a document. Reads its facts, its versions, its retention, its trail | Drops files, or picks them. Names the type. Resolves a checksum match | Marks a **production order** approved. An invoice is not hers to approve | Selects a set, sees what it will and will not export, takes the metadata and the manifest |
| **Front-stage** *screen and evidence* | `S1 Dashboard` — four counts, five most recent | `S2 Library grid` ⇄ `S3 Library table` — count, what permissions withheld, retention per row | `S4 Info` · `S6 Versions` · `S7 Audit trail` — retention in place | `S8 Upload` — limits stated *before* they are hit | `S4 Info` — status badge, two named actions, and *your access* in words | `S10 Bulk bar` — count against total, what will be excluded and why · `S9 Permissions` · `S11 Retention` |
| ↓ | **LINE OF INTERACTION** — below this, Maria sees nothing | | | | | |
| **Back-stage** *system and other people* | Reads the stored library; reseeds and says so if unreadable | Resolves read permission first, then filters and orders | Computes retention from the governing policy version | Accepts the file, assigns an id, writes version 1 | Resolves `approve` against the rules; grants union, denies subtract | Resolves `download` per document, excludes legal holds, writes one audit entry |
| ↓ | **LINE OF VISIBILITY** — below this, nobody sees; this is infrastructure | | | | | |
| **Support** *data and rules* | `localStorage`, one key. No server, no account | `Intl.Collator`, natural and case-insensitive; blanks pinned to one end | Four versioned policies; a hold suspends expiry without moving the date | No checksum, no virus scan, no text extraction | Eight rules over four metadata fields; roles read-only from the directory | Manifest and metadata only — no archive writer, no async job |
| **Risk** *and the answer* | An unreadable library looks exactly like a first visit. **→** it says so, in a toast and in the console | Two tags returned nothing at all. **→** values inside one facet combine with **OR**, not AND (`FLT-2`) | Expiry quietly destroying something. **→** expiry is a review queue and nothing else; a hold suspends it without moving the date (`RET-12`, `RET-13`) | The type was assumed to be *Invoice*. **→** proposed at upload, editable after (`UPL-19`) | Anyone could approve anything. **→** resolved against the rules for this document's metadata, and a refusal names the rule (`PRM-6`) | An export that ships less than was asked for, silently. **→** the count, the size and every exclusion are stated *before* the request (`BDL-2`, `BDL-4`, `BDL-16`) |

---

## The two phases with nothing behind them

`P5` and `P6` are where the blueprint stops describing the prototype and starts
describing the requirement set.

**`P5` now has authority — this is the gap this blueprint closed.** It used to
say "a screen but no authority", and that was accurate: anybody could press
approve. Twelve of `PRM`'s twenty-four requirements are now implemented, and
the operation is resolved against the rules for the document's own metadata.

Maria may approve a production order and may not approve an invoice, because
segregation of duties is a rule and not a hard-coded branch. Where the answer
is no, the interface says which rule said so — a refusal without a reason is a
support ticket. What is still missing is administration: there is no rule
editor, so `PRM-12` through `PRM-16` and `PRM-20` through `PRM-24` remain open,
and nothing in the product deletes anything, so logical deletion (`PRM-18`,
`PRM-19`) has no state to recover.

**`P6` now has both, within the limits of having no server.** Retention is a versioned policy object with a lifecycle, and retiring one releases
nothing it already governs. Selection is the design system's own checkbox
column, with *select all filtered* as a separate action — the requirement set
is explicit about why that distinction gets specified once: the
misunderstanding that exports 50 of 460 documents also deletes 50 of 460.

What is still missing here is infrastructure rather than design. There is no
archive writer, so what downloads is the metadata and the manifest and not the
files; and there is no server, so `BDL-10` through `BDL-14` — an asynchronous
job with progress, cancellation, notification and an expiring link — stay open.
Bulk delete stays open too, because nothing in this product deletes anything.

---

## The step that changed a requirement

`P4` is the phase worth reading twice, because drawing it corrected the
specification.

`UPL-8` was written as one case: an upload whose checksum matches an existing
document offers to version it. Drawing the dialog turned up **three**, and two of
them change what the product is allowed to say:

| The upload matches | What the dialog may offer |
| --- | --- |
| the **current** version | Versioning must be **refused**. A new version would differ from the current one in nothing but its number (`UPL-18`) |
| an **earlier** version | This is a restore, not a duplicate (`UPL-12`) |
| a **different** document | Versioning is meaningless. This is a filing decision |

None of the three is implemented — there is no checksum in the prototype
(`UPL-7`). The design exists and the requirement is now correct, which is the
useful half.

See [`design/upload-flow.canvas.html`](design/upload-flow.canvas.html) for the
four boards this came from.

---

## What this blueprint does not settle

- **Where a document comes from.** Every phase here starts with a file already
  on Maria's machine. Scanning, email ingestion and system-to-system delivery
  are out of scope and unspecified.
- **What happens when two people file at once.** There is one user and no
  concurrency, so check-out and locking (`UPL-15`…`UPL-18`) have no journey.
- **The administrator's journey.** `DOS-A` describes 24 requirements for dossier
  types and a file plan. That is a second actor with a second blueprint, and it
  is not written.

---

Konstancja Tanjga · DocuManager · [requirements](../requirements/) · [process walkthrough](README.md)
