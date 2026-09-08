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
| **Maria** *action* | Opens the tool. Reads what is waiting | Searches, filters by type and tag, orders the result | Opens a document. Reads its facts, its versions, its trail | Drops files, or picks them. Names the type. Resolves a checksum match | Marks approved, pending or rejected. Writes why | *Not her decision* — she asks an administrator |
| **Front-stage** *screen and evidence* | `S1 Dashboard` — four counts, five most recent | `S2 Library grid` ⇄ `S3 Library table` — count reads "3 of 10" | `S4 Info` · `S6 Versions` · `S7 Audit trail` | `S8 Upload` — limits stated *before* they are hit | `S4 Info` — status badge plus two named actions | *no screen* |
| ↓ | **LINE OF INTERACTION** — below this, Maria sees nothing | | | | | |
| **Back-stage** *system and other people* | Reads the stored library; reseeds and says so if unreadable | Filters and orders client-side over the whole set | Reads the version chain and the append-only trail | Accepts the file, assigns an id, writes version 1 | Writes an audit entry naming who and when | *nobody* — no approval routing exists |
| ↓ | **LINE OF VISIBILITY** — below this, nobody sees; this is infrastructure | | | | | |
| **Support** *data and rules* | `localStorage`, one key. No server, no account | `Intl.Collator`, natural and case-insensitive; blanks pinned to one end | Version chain is append-only; ids stable across versions | No checksum, no virus scan, no text extraction | Status is one of three values; no state machine | No retention object, no permission rule, no ZIP writer |
| **Risk** *and the answer* | An unreadable library looks exactly like a first visit. **→** it says so, in a toast and in the console | Two tags returned nothing at all. **→** values inside one facet combine with **OR**, not AND (`FLT-2`) | A description edit changed the document and left no record. **→** every state change writes a trail entry (`XC-2`) | The type was assumed to be *Invoice*. **→** proposed at upload, editable after (`UPL-19`) | Anyone can approve anything. **→** *unanswered*: no roles exist (`PRM-1`…`PRM-24`) | An export that also deletes. **→** *unanswered*: no selection model (`BLK-1`) |

---

## The two phases with nothing behind them

`P5` and `P6` are where the blueprint stops describing the prototype and starts
describing the requirement set.

**`P5` has a screen but no authority.** Maria can mark any document approved,
rejected or pending, and the trail records that she did. What is missing is
whether she *may*: `PRM` specifies content permission rules that grant or deny
operations to roles, decided by what a document is rather than where it sits.
Twenty-four requirements, none implemented. Until they are, the approve action
is a button with no rule behind it.

**`P6` has neither.** Retention (`RET`, 13 requirements) needs a policy object
with a lifecycle — draft, active, retired — that outlives the documents it
governs. Bulk download and bulk operations (`BDL` and `BLK`, 29 between them)
need a selection model, and the requirement set is explicit about why that gets
specified once: the misunderstanding that exports 50 of 460 documents also
deletes 50 of 460.

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
