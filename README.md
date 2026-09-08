# DocuManager

A document management prototype — dashboard, document library, upload,
versioning, audit trail — **built entirely with the
[Big Hat design system](https://github.com/Konstancja-Tanjga/bighat-design-system)**.

The point of this repository is not the document management. It is what a real
screen looks like when every control comes from a design system, and what
happens at the places where the system runs out.

**New here? Start with [the use case](docs/use-case.md).** Thirteen chapters in
the order the project was built — what the market already does, what that made
us write down, the flow drawn before it was built, and the design-system round
trip. Each chapter says what it is, why it exists, and what to look at.

From there: [the user journey and service blueprint](docs/user-journey.md) for
how a document actually moves through this, and [docs/](docs/) for the process
walkthrough with the design canvases and screenshots.

Four things live here:

- **[docs/](docs/)** — the process: research, concept, the design canvases, and
  screenshots of the result.
- **[requirements/](requirements/)** — 168 functional requirements for a
  document management system.
- **[Competition audit/](Competition%20audit/)** — what four established DMS
  products do about those requirements, and what that changed.
- **[src/](src/)** — a working prototype implementing a slice of them, with
  every control taken from `@bighat/ui`.

## Requirements

Written to be read by someone specifying the system, not by someone admiring the
prototype. Each requirement has a stable id and acceptance criteria that can be
checked.

| Area | Requirements | File |
| ---- | ------------ | ---- |
| Dossier management — user | 20 | [dossier-management-user.md](requirements/dossier-management-user.md) |
| Dossier management — admin | 24 | [dossier-management-admin.md](requirements/dossier-management-admin.md) |
| Permissions and roles | 24 | [permissions-and-roles.md](requirements/permissions-and-roles.md) |
| Upload and versioning | 23 | [upload-and-versioning.md](requirements/upload-and-versioning.md) |
| Bulk download | 16 | [bulk-download.md](requirements/bulk-download.md) |
| Bulk operations | 13 | [bulk-operations.md](requirements/bulk-operations.md) |
| Retention policies | 13 | [retention-policies.md](requirements/retention-policies.md) |
| Filter | 15 | [filter.md](requirements/filter.md) |
| Sort | 14 | [sort.md](requirements/sort.md) |
| Cross-cutting | 6 | [README.md](requirements/README.md) |

They describe the target system. The prototype implements a slice —
[the status table](requirements/README.md#status-in-this-prototype) says exactly
which, and does not overstate it.

## Built with @bighat/ui

Every interactive control on every screen is a component from
[`@bighat/ui`](https://github.com/Konstancja-Tanjga/bighat-design-system) —
[Storybook](https://konstancja-tanjga.github.io/bighat-design-system/). Nothing
is restyled, wrapped, or forked.

```json
"dependencies": {
  "@bighat/ui": "github:Konstancja-Tanjga/bighat-design-system"
}
```

Setup is three lines, once, in [main.tsx](src/main.tsx):

```tsx
import '@bighat/ui/styles.css';

<div className="bh-root">
  <ToastProvider>
    <App />
  </ToastProvider>
</div>;
```

### The rules this codebase holds itself to

The design system ships its own rules for consumers in
[`agent/SKILL.md`](https://github.com/Konstancja-Tanjga/bighat-design-system/blob/main/agent/SKILL.md).
The ones with teeth here:

| Rule | How it shows up in this repo |
| ---- | ---------------------------- |
| Semantic tokens only — never a primitive or a hex | [app.css](src/app.css) contains no colour literal. Every value is a `--bh-*` semantic token or a layout property. |
| Spacing comes from the 4px scale | Gaps and padding are `--bh-gap-*` / `--bh-padding-*`. There is no `13px` anywhere. |
| Empty, loading and error are `StateBlock` | No bespoke "no results" markup. And "empty" is written twice — see below. |
| Colour is never the only carrier of meaning | Every `Badge` carries its status as text. The `Card` accent on "Pending approval" is decorative; the label does the work. |
| Never remove a focus outline | There are no local interactive elements left to get this wrong. Every control is the system's, and every ring is its own. |
| Labels are required; placeholders are not labels | Every `Input`, `Select`, `Textarea` and `FileDropzone` has a real label. `hideLabel` is used once, on the app bar's search field. |
| Prefer a new component over a new prop | Six gaps were local components. All six are now in the system — see below. No system component was widened to get there. |

**"Empty" is two screens, and this one writes both.** A library with nothing in
it offers an upload; a library filtered to nothing offers a way out of the
filter ([Documents.tsx](src/pages/Documents.tsx)). The design system calls
conflating these its most common mistake, so it seemed worth not making. The
rule is generalised in [`FLT-8`](requirements/filter.md).

### Where each component is used

| Screen element | Component |
| -------------- | --------- |
| Page frame, landmarks, skip link | `AppShell`, `SkipLink` |
| Top bar, brand, search | `AppBar` + `Input` |
| Section navigation | `SidePanel` + `NavList` / `NavItem` |
| Filter and view controls | `Toolbar` + `Select` + `SegmentedControl` |
| Dashboard stat tiles | `Card` (via local `StatTile`) |
| Recent activity rows | `Card` + `Badge` |
| Document cards | `Card` + `Badge` |
| Document table, sorting | `Table` |
| Document status | `Badge` |
| Type filter | `Select` |
| Tag filters | `FilterChip` |
| Tags on a document, queued files | `RemovableChip` |
| Document detail sections | `Tabs` + `DescriptionList` |
| Description editing | `Textarea` |
| Choosing files | `FileDropzone` |
| Identity in the app bar | `Avatar` |
| Every action | `Button` |
| Upload, document detail | `Dialog` |
| Save, approve, upload confirmation | `Toast` via `useToast()` |
| Empty states, oversized-file error | `StateBlock` |

## The six gaps, and where they went

This was the useful output of the exercise. Building a real screen under the
rule that *every* control comes from the system found six places where the
system had no answer. Each one was built locally, marked `LOCAL COMPONENT`, and
argued for as a candidate to move into the system.

**All six are now in the system.** Nothing in this table is local any more:

| Gap | Why the system had no answer | Now |
| --- | ---------------------------- | --- |
| **`Tabs`** | Nothing came close. It is a keyboard widget — arrows move, Home/End jump, one tab stop for the group. | `Tabs` / `TabList` / `Tab` / `TabPanel`, 3.2.0 |
| **`ToggleGroup`** | A segmented control is one choice with a current value, so it is a radio group. Rendered as buttons it loses that value. | `SegmentedControl`, 3.2.0 |
| **`Avatar`** | No answer for identity. Small, but every product invents it and half read "ML" aloud. | `Avatar` + `AvatarGroup`, 3.2.0 |
| **`Textarea`** | `Input` is single-line by contract; `Composer` is a prompt that owns the Enter key. Multi-line text had nowhere to go. | `Textarea`, 4.2.0 |
| **`Chip`** | `Badge` explicitly refuses to be clickable, correctly. Filter chips and removable tag chips are two different components. | `FilterChip` + `RemovableChip`, 4.2.0 |
| **`FileDropzone`** | No file input of any kind. The usual `<div onDrop>` is invisible to keyboard and screen reader users — see [`UPL-1`](requirements/upload-and-versioning.md). | `FileDropzone`, 4.2.0 |

The evidence for each — what was reached for, what got hand-rolled, and what
the hand-rolled version did worse — is in the system's
[`DS-GAPS.md`](https://github.com/Konstancja-Tanjga/bighat-design-system/blob/main/DS-GAPS.md),
kept there rather than here so it sits next to the code it is about.

Three of them were closed by 3.2.0 independently of this prototype. The other
three were closed *because* of it, and two details changed on the way in:

- **`FileDropzone` came out better than the local version.** The local one had a
  visually hidden `<input type="file">` plus a `Button` calling `input.click()` —
  two tab stops for one control, one of them invisible. The system's version
  stretches the real input across the surface at zero opacity, so there is one
  tab stop, the platform picker opens on Enter, and dropped files are handled by
  the input itself. Every drag handler can be deleted and it still works.
- **`Textarea` lost a prop on the way in.** It has no `hideLabel`, though `Input`
  does. A single-line field can borrow its name from context; a four-line box
  cannot.

Two findings that were **not** missing components, and are still true:

- **`Select` has no `hideLabel`, but `Input` does.** An inconsistency rather
  than a gap. The label is visible in the toolbar here as a result, which is
  arguably the better default — but the asymmetry should be a decision, not an
  accident. (`Textarea`'s omission is now a decision, with the argument
  written down. `Select`'s is still an accident.)
- **`Table` has no row-activation model.** Also right: a clickable row has no
  accessible name and no keyboard story. But the alternative needs to be
  stated, or every product invents `onRowClick`. This repo puts an explicit
  named button in a cell.

`StatTile` is still in `src/components/` and is **not** a gap — it is a local
composition of the system's `Card`. Worth promoting only if a second product
wants the same tile.

## Fixed in the design system along the way

Things this integration surfaced, all fixed upstream:

- The package advertised `types: ./dist/index.d.ts` and never shipped one —
  `vite-plugin-dts` honoured `noEmit` from the app tsconfig and silently emitted
  nothing. Every TypeScript consumer was getting an implicit `any`.
- No `prepare` script, so installing it as a git dependency produced a package
  with no build output at all.
- Three missing components, above.
- **A filter chip's pressed state was carried by colour alone.** The local
  version relied on the tint plus `aria-pressed`, which is a WCAG 1.4.1 failure
  for anyone who can see but cannot distinguish the tint. The system's
  `FilterChip` adds a check mark, and reserves its box when the chip is off so
  a wrapped row of chips does not reflow when one is pressed.

## Upgrading from 2.0.0 to 4.x

Worth recording, because the package changed identity as well as version:

| What changed | 2.0.0 | 4.x |
| ------------ | ----- | --- |
| Package name | `@bighatpoland/ui` | `@bighat/ui` |
| Inventory | `components.json`, 17 components | `spec/components/*.json`, one contract each, 45 components |
| Tone scale | `tone="default"` | `tone="neutral"`, which is the default — usually just delete the prop |
| `StateBlock` | `density="inline"` | `scope="inline"` |
| Font family token | `--bh-font-family` | `--bh-font-family-sans` |
| `className` | accepted on seven components | accepted on none |
| Selected / current state | `--bh-status-info-*` | `--bh-selection-*` |

The deprecated forms all still work and warn in development; they are removed
in 5.0. This repo uses none of them.

The upgrade also **deleted 259 lines of `app.css`** (544 to 285) — every rule that existed to
style a local component. What is left is page layout and the inside of a `Card`,
which is what a product stylesheet should be.

## Tech

- React 19 + TypeScript + Vite
- `@bighat/ui` for every control
- `localStorage` as a fake backend, with the same shape the original prototype
  used

The previous version of this prototype was a single 734-line HTML file using
Tailwind via CDN. The design system is a React component library, so applying it
properly meant becoming a React app. Restyling the old file with the system's
tokens would have looked the same and been a copy, not a dependency.

## Local run

```bash
npm install
npm run dev -- --port 5185 --strictPort
```

`npm install` builds the design system from source, since it is a git dependency
rather than a published package.

The port is pinned on purpose. Vite falls back to the next free port when its
default is taken, silently, which makes "open the dev URL" point at whatever
else happens to be running.

## Status

Prototype. Not production software. The document management is a plausible
fiction; the design system integration and the requirements are the real
content.
