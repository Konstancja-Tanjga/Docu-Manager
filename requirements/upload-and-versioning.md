# Upload and versioning

Getting a file in, and keeping every earlier state of it. The two are one
document because the most common upload is not a new document — it is a new
version of one that already exists, and a system that cannot tell the difference
accumulates duplicates until search stops working.

## Upload

**`UPL-1` Upload accepts a single file, many files, and a folder.**
Drag-and-drop and an explicit file picker are both available. The dropzone is
not the only route: a `<div>` with an `onDrop` handler is invisible to keyboard
and screen reader users, so a real `<input type="file">` must be reachable and
labelled.

**`UPL-2` Limits are stated before the user hits them.**
Maximum file size, permitted types and maximum batch size are visible on the
upload surface, not discovered through rejection.

**`UPL-3` A rejected file names itself and the reason.**
"`Invoice_March.pdf` is 142 MB. The limit is 100 MB." — not "file too large".
Where a batch mixes valid and invalid files, the valid ones proceed.

- Acceptance: an oversized file in a batch of five uploads the other four and
  leaves the rejected one on screen with its reason and a way to remove it.
  This is a `StateBlock` in the dialog, not a toast — the user has to act on it.

**`UPL-4` Every limit is enforced server-side regardless of client validation.**
Client validation is a courtesy. The server rejects independently.

**`UPL-5` A batch upload reports per file and survives partial failure.**
Progress per file, a final summary, and no scenario in which a network failure
at file nine discards files one through eight.

**`UPL-6` Uploaded content is scanned before it becomes visible to anyone but the uploader.**
A document that fails scanning is quarantined, its uploader is told, and an
audit entry is written. It is never silently deleted.

**`UPL-7` The system computes a checksum for every stored version.**
Used for duplicate detection, integrity verification, and inclusion in export
manifests.

**`UPL-8` An upload matching an existing document by checksum asks what to do, and never assumes.**
Silently creating a duplicate and silently versioning are both wrong. Before it
asks, the dialog states what it matched: which document, which version, whose,
when, and that version's own comment — the question is unanswerable without
them.

**A checksum match has three cases, and the options differ in each.**

- **It matches the document's current version.** Versioning is **refused**, not
  offered: it would produce a version differing from its predecessor in nothing
  but its number, which `UPL-18` rejects. The refusal is shown with its reason
  rather than the option being silently absent — the user needs to know the
  product understood what they asked for. Discarding becomes the primary action,
  because the content is already stored. Filing as a separate document stays
  available.
- **It matches an earlier version.** This is a restore, so `UPL-12` governs it:
  the new version carries the old content forward and the intervening versions
  stay. A comment saying why is required. Filing as a separate document stays
  available.
- **It matches a document the user is not entitled to see.** No document is
  named, no version path is offered, and nothing hints that a match occurred —
  see `UPL-24`.

Neither remaining option may be preselected, and the confirming action stays
disabled until one is chosen. A default here is the failure mode itself: the
person presses the primary button without reading, and either the repository
gains a duplicate or a document quietly gains a version of something else.

**`UPL-24` Duplicate detection never discloses a document the user may not see.**
Checksum matching is a convenience with a security surface. A naive
implementation tells the uploader that identical content exists, what it is
called, which dossier it is in and who filed it — past whatever rule forbids
them from seeing it, and with no read of the document ever taking place.

Where the matched document is outside the user's permissions, the product
behaves as though no match was found, except that it may still decline to store
the bytes twice. It must not name the document, reveal its location or author,
offer a version path, or vary its wording in a way that distinguishes "no match"
from "a match you cannot see".

- Acceptance: for the same uploaded file, a user with permission and a user
  without see two dialogs that cannot be told apart as evidence of the
  document's existence.
- This is invisible on the happy path, which is why it is stated rather than
  left to an implementer.

## Versioning

**`UPL-9` Versions are immutable.**
A stored version is never modified in place and never renumbered. Version
numbers increase monotonically from 1 and are never reused, including after a
version is deleted under a retention rule.

**`UPL-10` The document id is stable across versions.**
Links, dossier references and audit entries survive versioning. Only the content
changes.

**`UPL-11` Every version records who, when, size, checksum, and a comment.**
Whether the comment is mandatory is configurable per document type. The default
is mandatory, because the field exists to answer "why did this change" and an
optional field answers it in about a third of cases.

**`UPL-12` Restoring an earlier version creates a new version.**
Restoring version 3 over version 7 produces version 8 with the content of 3.
History is never rewritten and never loses the intervening versions.

**`UPL-13` Any two versions of a document can be compared on metadata, and on content where the format allows it.**
Where content comparison is not possible, the interface says so rather than
offering a control that does nothing.

**`UPL-14` Version history is visible from the document without navigation.**
Numbers, dates, authors, sizes and comments, newest first, with each version
individually downloadable subject to permission.

## Concurrency

**`UPL-15` A document can be checked out, and a checked-out document rejects competing check-ins.**
The lock names its holder and the time it was taken. Without this, two people
editing the same contract produce two version 4s and one of them is lost.

**`UPL-16` Locks expire, and expiry is configurable.**
An abandoned lock must not require an administrator. Expiry warns the holder
before it takes effect.

**`UPL-17` An administrator can force-release a lock, and doing so is audited and notified.**
The holder is told their lock was broken and by whom.

**`UPL-18` Check-in without an intervening change is rejected with an explanation.**
It creates a version that differs from its predecessor in nothing but its
number, which makes version history less useful every time it happens.

## Metadata on upload

**`UPL-19` Metadata is proposed, not demanded, at the moment of upload.**
Values derivable from the file — name, type, size, dates found in the content —
are pre-filled and shown as editable proposals. The user corrects rather than
transcribes.

**`UPL-20` Where required metadata is unknown at upload, the document is accepted and flagged incomplete.**
Blocking the upload loses the file. Flagging it keeps the file and keeps the
obligation. Incomplete documents are listed as outstanding work.

## Text extraction

**`UPL-21` The content of every uploaded document is extracted to text where the format allows, and scanned images are put through optical character recognition.**
This is the precondition for `FLT-4`: full-text search that composes with
facets. It is also what makes `UPL-19` honest — metadata proposed from "dates
found in the content" requires there to be extracted content to find them in.

**`UPL-22` A document whose text could not be extracted is marked as such, and remains findable by its metadata.**
Silent failure here produces a document that search cannot reach and nobody
knows is missing. The mark is visible and the failure is countable.

**`UPL-23` Extraction and recognition run asynchronously and never block the upload.**
The document is stored and visible first; its text becomes searchable when
extraction completes. Per `XC-6`.
