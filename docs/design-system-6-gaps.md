# What @bighat/ui 6.0.3 does not cover for DocuManager

Built by moving DocuManager from `@bighat/ui` 4.1.0 (the
`chip-textarea-filedropzone` branch) to 6.0.3 (`main` at `9c26ecb`), and adding
a light / dark / system theme. Each entry says what the product reached for,
what it built instead, and what that costs — the argument the system's own
`DS-GAPS.md` asks for. Entries 1–5 follow its shape; 6–8 are short notes.

## Summary

| # | Missing | Where DocuManager needs it | Built locally as | Priority |
| - | ------- | -------------------------- | ---------------- | -------- |
| 1 | **Callout / inline note** | 5 places: Permissions, Retention ×2, Documents (withheld count), bulk export exclusions | `.dm-note` markup | High |
| 2 | **Theme switching** | App-wide light / dark / system choice | `src/theme.ts` + a script in `index.html` + `SegmentedControl` | High |
| 3 | **Bulk selection bar** | Document list, while rows are selected | `.dm-bulk` around a `Toolbar` | Medium |
| 4 | **A list inside an error** | Bulk partial failures (BLK-12) | `StateBlock` + a hand-styled `<ul class="dm-failures">` | Medium |
| 5 | **Page header** | All four pages: title, count, page controls | `.dm-page__header`, `.dm-page__title`, `.dm-count` | Medium |
| 6 | **Ordered `List`** | Version history, audit trail | `List`, which renders `<ul>` — the order is lost | Low |
| 7 | **`Select` `hideLabel`** | "Acting as" role switcher in the app bar | Moved to the side panel footer instead | Low |
| 8 | **Document thumbnail / file preview** | Grid cards | `.dm-doccard__thumb`: a tinted well with the type's glyph and name | Low |
| 9 | **Category colour role** | One hue per document type | Nothing — the type glyphs stay neutral | Low |

Not gaps: `StatTile` is still a local composition of `Card`, and stays local
until a second product wants it. `Tree` (for dossier hierarchies) is already a
standing gap in `DS-GAPS.md`; the prototype does not build dossiers yet, so it
adds no new evidence.

## 1. No callout — prose that has to stay on screen

**Reached for:** `StateBlock`, then `Card`. Both say no, and both are right.
`StateBlock` covers empty, loading and error, and comes with an announcement
policy for each. A note like "Deny outranks Grant" is none of the three. The
`notFor` on `Card` says a paragraph inside a card is "a border with extra
steps". `Toast` disappears, and these notes must stay on screen.

**Built instead:** `.dm-note`, with a title and a body, plus a `--withheld`
variant that adds a `selection.mark` leading bar.

**What it does worse:** it has no role and no tone. The withheld count (XC-1)
reports a restriction, the export exclusion (BDL-4) warns, and the precedence
note only informs. They look almost the same, because the only tokens the
product can reach for without inventing a role are `fill.hover` and
`selection.mark`. A system component could map `tone` to `status.*.bg/fg` the
way `Badge` does, and test the contrast in both themes. The local version is
checked by nobody.

**Correction:** the `.dm-note` comment in `app.css` said this was recorded in
the system's `DS-GAPS.md`. It was not. This entry is the one to
file.

**Proposal:** `Callout` — `tone` (`neutral | info | warning | critical`),
`title`, children, optional `action`. Not a live region: it is part of the
page, like the empty state.

## 2. No theme switching

**Reached for:** a theme provider, a `setTheme` export, or a documented
pattern. The system has none of them. `react.md` says "No theme provider — the
theme is a `data-theme` attribute on `<html>`". That covers reading the theme.
Choosing one is left entirely to the product.

**Built instead:** `src/theme.ts` (a stored choice, plus a `?theme=` override
for screenshot runs) and an inline script in `index.html` that applies the
choice before the first paint. The control is a `SegmentedControl`
(Light / Dark / System) in the `SidePanel` footer.

**What it does worse:** three things every product will get wrong in a
different way:

- **Flash of the wrong theme.** Unless the attribute is set before the first
  paint, a dark choice loads light first. React cannot fix this. It takes a
  blocking script, and that script has to agree with the React code on the
  storage key and the values.
- **"System" is easy to break.** The right way is to remove the attribute.
  The tempting way is to read `prefers-color-scheme` and write its answer into
  the attribute, and then the page stops following the OS.
- **Storage can refuse.** In private browsing `localStorage` can throw, so
  both places need a try/catch.

**Proposal:** a framework-free `applyTheme(choice)` and a
`themeBootstrapScript` string the product puts in `<head>`, plus a React
`useTheme()` built on them. A component is optional. `SegmentedControl` is
already the right control, so the docs only need to say so.

## 3. No bulk selection bar

**Reached for:** `Toolbar`, inside the selection state of `Table`. `Table`
gives the checkboxes and the select-all checkbox (with its mixed state) but
nothing to show while rows are selected. `Toolbar` gives the keyboard model,
but no surface, no count and no way to clear the selection.

**Built instead:** `.dm-bulk` — `selection.bg` with a `selection.mark` leading
bar, around a flush `Toolbar`, with a hand-set "n of m selected".

**What it does worse:** the count is not announced when it changes, and
nothing ties the bar to the table it acts on. The toolbar has a name, but the
table does not point to it and it does not point to the table. The system
already owns selection, so it should own the bar that appears with it.

**Proposal:** a `bulkActions` slot on `Table` that renders only while
`selection.selected.size > 0`, states the count against the total, and
announces changes politely.

## 4. `StateBlock` cannot hold a list

**Reached for:** `StateBlock state="error"` for a bulk action that partly
failed. BLK-12 requires every failed document to be named, with its reason.

**Built instead:** the `StateBlock`, and a `<ul class="dm-failures">` after it.
`description` renders inside a `<p>`, so a list is invalid there.
`diagnostics` is collapsed by default, which suits a correlation id but not
the content the requirement is about.

**What it does worse:** the list sits outside the error's live region, so
assistive technology announces "3 of 8 did not change" without the three
names.

**Proposal:** a `details` slot (block content, visible, inside the region), or
a `description` that accepts block content.

## 5. No page header

**Reached for:** `AppBar` `title`. But the app bar holds the screen name, and
each page also needs its own visible `<h1>` with a count and page-level
controls beside it.

**Built instead:** `.dm-page__header`, `.dm-page__title`, `.dm-count`, the same
on four pages.

**What it does worse:** before 6.0 these titles used rem literals (1.75rem,
1.125rem) that were not on the type scale. The rebuild moved them onto
`textSize.title` and `textSize.heading`. A product could only get that wrong
because nothing in the system says what a page heading is.

**Proposal:** `PageHeader` — `title`, `meta` (a count or a status), `actions`,
wrapping below a container width.

## 6. `List` has no ordered form

Version history and the audit trail are ordered: newest first, and the order
is the point. `List` always renders `<ul>`. The rebuild uses it anyway, sorts
both newest first, and states the order in the `ariaLabel` ("Versions, newest
first", "Audit entries, newest first"). An `ordered` prop that
renders `<ol>` would be enough.

## 7. `Select` still has no `hideLabel`

This was already noted for 4.x. In 6.0 it has a visible cost: the "Acting as"
label in the app bar touched the bar's top edge, because the bar is 56px tall
and a labelled Select is about 58px (a label line plus `control.md`). The rebuild moves the
switcher to the side panel footer, which is a better place for it anyway (it
is now reachable below 900px too). The difference from `Input` still needs a
written decision.

## 8. No file thumbnail

The grid cards show a tinted well with the document type's glyph and name
where a preview would go. This relates to `Frame` (gap 4 in `DS-GAPS.md`): an aspect-locked
frame with a fit setting. It also needs a fallback for files that have no
preview, which is the case DocuManager actually hits.

## 9. No role for category colour

**Reached for:** a hue per document type, so an invoice and a production order
can be told apart across a grid at a glance.

**What exists:** `status.*`, which means something about state, so an invoice
in green would read as "approved"; and `avatar.{violet,teal,plum,olive}`, four
non-status hues already held to 4.5:1 in both themes, which are exactly the
right values but belong to the avatar role. Borrowing them would be rule 1's
"reach for whatever fits" by another name.

**Built instead:** nothing. The glyphs are `text-primary` on a neutral tile,
and the two types are told apart by silhouette. That is enough at two types
and will not be at six.

**Proposal:** promote the avatar hues to a general `category.{1..n}.{bg,fg}`
role, with `avatar.*` pointing at it — the values and the contrast tests
already exist.

## What the upgrade replaced with system components

| Was | Now | Why |
| --- | --- | --- |
| `Avatar` + name in a local `.dm-user` | `UserProfile` (role as the secondary line) | The system's identity slot; its secondary line tells two sessions apart |
| Column of clickable `Card`s on the dashboard | `List variant="inset"` + `ListItem` | The card's `ariaLabel` replaced its content, so the status was never announced. `trailing` sits outside the button |
| Hand-styled `<ol class="dm-trail">` ×2 | `List` + `ListItem` | Record rows with title and supporting line, with hairlines |
| `<button class="dm-link-button">` in Retention | `Button variant="ghost"` | It opens a dialog, so it is an action |
| Eleven rem font sizes in `app.css` | `--bh-text-size-*` and `--bh-text-weight-*` | Rule 2 |
| Grey 1–2px rules, `surface.sunken` wells, tracked capitals | `border.hairline`, `fill.hover`, sentence case | The 4.2–4.13 visual direction |
| Audit trail in stored order (mixed) | Sorted newest first | The seed data is oldest first and new entries are prepended |
