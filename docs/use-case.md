# Thirteen chapters

**DocuManager · use case · skeleton**

A document management prototype whose real subject is not document management:
it is what a screen looks like when **every control has to come from a design
system**, and what happens at the places where the system runs out.

| | |
| --- | --- |
| **Role** | Designer and developer |
| **Scope** | 168 requirements, 5 screens, 1 design system |
| **Chapters done** | 8 of 13 |
| **Status** | Prototype. Design system round trip closed |

## How to read this

The chapters are numbered and tell the project in the order it was built:
first what the market already does, then what that made us write down, then the
flow, then the screens. Each one says the same three things — **what it is**,
**why it exists**, and **what to look at**.

A chapter marked `done` has an artefact in this repository, linked from the
chapter. A chapter marked `to write` has the material but not the panel; the
path shown is where it will live. Nothing here is a placeholder for work that
does not exist — where there is no product behind a chapter, the chapter says so.

**If you have time for one thing, read chapter 08.** Drawing the upload dialog
turned one written requirement into three, and two of them changed what the
product is allowed to say. That is the clearest thing this project has to show
about why design happens before implementation rather than after it.

---

### 00 · Cover `to write`

| | |
| --- | --- |
| **What it is** | The use case cover. |
| **Why it exists** | The first thing someone landing on a portfolio index sees; it has to say what the project is about in one frame. |
| **What to look at** | — |

`docs/case-study/00-cover.png`

---

### 01 · Problem and brief `to write`

| | |
| --- | --- |
| **What it is** | The constraint the whole project hangs on: every interactive control comes from `@bighat/ui`, nothing restyled, wrapped or forked. |
| **Why it exists** | Without it this reads as a CRUD app. With it, the interesting output is the list of places the design system had no answer. |
| **What to look at** | That the document management is a plausible fiction and is not the deliverable. The requirements and the design-system integration are. |

`docs/case-study/01-brief.png`

---

### 02 · Research: competition audit `done`

| | |
| --- | --- |
| **What it is** | Four established document management systems, read from administrator documentation and published service limits. |
| **Why it exists** | Vendor marketing pages produced nothing checkable, so they were not used. Every finding links the documented statement behind it. |
| **What to look at** | That **no competitor interface is reproduced anywhere** — the three annotated screens are our own designs. And the section titled *where we are stricter than the market*, which is where our decisions start rather than the market's. |

→ [`Competition audit/`](../Competition%20audit/) · [`design/competition-audit.canvas.html`](design/competition-audit.canvas.html)

---

### 03 · Requirements: 168 of them `done`

| | |
| --- | --- |
| **What it is** | Ten areas, each requirement with a stable id and acceptance criteria that can be checked. |
| **Why it exists** | Written to be read by someone specifying the system, not by someone admiring the prototype. |
| **What to look at** | The [status table](../requirements/README.md#status-in-this-prototype): 26 met, 7 partial, 135 not implemented — with the verdict published **per requirement id**, because an area-level count is a claim a reader cannot check. |

→ [`requirements/`](../requirements/)

---

### 04 · User journey and service blueprint `done`

| | |
| --- | --- |
| **What it is** | Six phases across five lanes, with the line of interaction and the line of visibility drawn in. |
| **Why it exists** | The journey says what happens; the blueprint says what has to work underneath, and where the boundary of what the user can see actually falls. |
| **What to look at** | The two phases with **nothing behind them**. Approve has a screen but no authority — no roles exist — and hand-off has neither screen nor system. A journey that stopped where the prototype stops would describe a smaller problem than the real one. |

→ [`user-journey.md`](user-journey.md)

---

### 05 · Roles and content permissions `done`

| | |
| --- | --- |
| **What it is** | Five roles, seven rules, and the screen that makes them reviewable. Access is decided by a document's metadata, never by where it sits. |
| **Why it exists** | The blueprint said *approve has a screen but no authority*, and it was right — anybody could press it. A permission model fails silently, so it needs a screen before it needs features. |
| **What to look at** | That **deny outranks grant** and the interface says so rather than leaving it in the source. That a disabled rule stays visible and is marked as not enforced. That a role which left the directory is retained, marked, confers nothing — and the rules naming it are named back. And that a list shortened by permissions says how many documents it withheld. |

→ [`screens/permissions-rules-light.png`](screens/permissions-rules-light.png) · [`permissions-roles.png`](screens/permissions-roles.png) · [`permissions-withheld.png`](screens/permissions-withheld.png)

---

### 06 · Information architecture and the data model `to write`

| | |
| --- | --- |
| **What it is** | Document, version, dossier, reference, retention policy, permission rule — the vocabulary, and which of it exists in code. |
| **Why it exists** | The words are used precisely in the requirements, and four of the six have no equivalent in the prototype at all. |
| **What to look at** | That a document id is stable across versions and a version is immutable — the two properties everything else in upload depends on. |

`docs/case-study/06-model.png` · vocabulary in [`requirements/README.md`](../requirements/README.md)

---

### 07 · Concept: getting files in `done`

| | |
| --- | --- |
| **What it is** | The first board of the upload canvas: limits visible before anyone hits them, a rejected file that names itself and its reason, and a bad file in a batch that never costs you the good ones. |
| **Why it exists** | `UPL-1` and `UPL-2` are cheap to write and easy to get wrong in a way nobody notices until a batch fails halfway. |
| **What to look at** | That *Choose files* is a real labelled `<input type="file">`, not decoration. A bare drop target is invisible to keyboard and screen-reader users. |

→ [`design/upload-flow-artboards/Batch.dc.html`](design/upload-flow-artboards/Batch.dc.html)

---

### 08 · Concept: the choice, and its three cases `done`

| | |
| --- | --- |
| **What it is** | What the product says when an uploaded file is already here — and the finding that this is three situations, not one. |
| **Why it exists** | `UPL-8` was written as a single case: a checksum match offers to version. Drawing the dialog turned up three, and two of them change what the dialog is *allowed* to offer. |
| **What to look at** | The case where the upload matches the **current** version. Versioning must be **refused**, not offered — a new version would differ from the current one in nothing but its number. A requirement that reads as complete prose can still describe one third of its own problem. |

→ [`design/upload-flow-artboards/Cases.dc.html`](design/upload-flow-artboards/Cases.dc.html) · [`Main.dc.html`](design/upload-flow-artboards/Main.dc.html)

---

### 09 · Design system: the round trip `done`

| | |
| --- | --- |
| **What it is** | Six controls the system had no answer for, built locally, argued for, and then built **into** the system. |
| **Why it exists** | This is the useful output of the constraint. Building a product against a design system finds holes that reviewing the design system does not. |
| **What to look at** | That three of the six were closed **because of this project** — `Textarea`, `FilterChip` + `RemovableChip`, `FileDropzone` — and that `src/components/` now holds one file. The evidence for each, including what the hand-rolled version did worse, is in the system's own gap record. |

→ [`DS-GAPS.md`](https://github.com/Konstancja-Tanjga/bighat-design-system/blob/chip-textarea-filedropzone/DS-GAPS.md) · [walkthrough §4](README.md)

---

### 10 · Screens: library and detail `done`

| | |
| --- | --- |
| **What it is** | The built screens, both themes, at 1400px and 430px. |
| **Why it exists** | The claim is that every control is the system's. Screenshots are how that gets checked rather than asserted. |
| **What to look at** | The document dialog: one height across all four tabs, because it used to be sized by whichever tab was open and resized the window under the pointer. And below 900px, navigation as an overlay — without it the Documents screen was unreachable on a phone. |

→ [`screens/`](screens/)

---

### 11 · Screens that do not exist `to write`

| | |
| --- | --- |
| **What it is** | Permission rules, retention policies and bulk operations — designed as reference screens in the audit, built nowhere. |
| **Why it exists** | 110 of the 168 requirements live in areas with no implementation at all. Drawing three of them was how the audit's findings got tested against a real layout. |
| **What to look at** | That access is decided by metadata and not by folder, that a retention policy is an object with a lifecycle rather than a number typed into a document type, and that *select all filtered results* is a separate action from *select all on this page*. |

→ [`design/competition-audit-artboards/`](design/competition-audit-artboards/) · `docs/case-study/11-unbuilt.png`

---

### 12 · What this does not settle `to write`

| | |
| --- | --- |
| **What it is** | The open questions, kept rather than tidied away. |
| **Why it exists** | A case study that ends at *and then it shipped* teaches nothing about how the decisions were made. |
| **What to look at** | Where a document comes from is unspecified — no scanning, no email ingestion. There is one user and no concurrency, so check-out has no journey. And the administrator is a second actor with a second blueprint that is not written. |

`docs/case-study/12-open.png`

---

Konstancja Tanjga · DocuManager · [process walkthrough](README.md) · [requirements](../requirements/)
