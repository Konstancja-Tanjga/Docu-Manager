# DocuManager

A document management prototype — dashboard, document library, upload,
versioning, audit trail — **built entirely with the
[BigHat design system](https://github.com/bighatpoland/bighat-design-system)**.

The point of this repository is not the document management. It is what a real
screen looks like when every control comes from a design system, and what
happens at the places where the system runs out.

Design work in progress:

- **[First concept](https://claude.ai/code/artifact/8208d568-914c-4547-b608-9c9b347a1f11)** —
  a queue-first front door over a dossier-first workspace.
- **[Second concept](https://claude.ai/code/artifact/ef77cea0-a9ad-49d9-b660-f8f4a2e4f1c0)** —
  one corpus with saved views as the navigation, and a dossier as a facet rather
  than a container.
- **[States](https://claude.ai/code/artifact/f588ebcf-ef95-4928-8d4d-3ca97280f8c6)** —
  empty, loading, partly done and refused, organised by state rather than by
  screen.
- **[Third concept](https://claude.ai/code/artifact/6e640d25-4cb2-4ad9-a1a5-6a3e9c9962fb)** —
  the merge, and the current candidate. Concept 1's spine with the inspector,
  addressable views and the export screen absorbed from concept 2. **Built on
  the design system's own classes**, so the ratio of `bh-` to `dm-` markup on
  each screen measures what the system still cannot do.
- **[Competition audit](https://claude.ai/code/artifact/e8c5130f-940e-4d8e-a6da-a7523a36af3f)** —
  the same findings as the folder below, illustrated and annotated by
  requirement.

Three things live here:

- **[requirements/](requirements/)** — 198 functional requirements for a
  document management system.
- **[Competition audit/](Competition%20audit/)** — what four established DMS
  products do about those requirements, and what that changed.
- **[src/](src/)** — a working prototype implementing a slice of them, with
  every control taken from `@bighatpoland/ui`.

## Requirements

Written to be read by someone specifying the system, not by someone admiring the
prototype. Each requirement has a stable id and acceptance criteria that can be
checked.

| Area | Requirements | File |
| ---- | ------------ | ---- |
| Dossier management — user | 20 | [dossier-management-user.md](requirements/dossier-management-user.md) |
| Dossier management — admin | 24 | [dossier-management-admin.md](requirements/dossier-management-admin.md) |
| Permissions and roles | 28 | [permissions-and-roles.md](requirements/permissions-and-roles.md) |
| Upload and versioning | 23 | [upload-and-versioning.md](requirements/upload-and-versioning.md) |
| Bulk download | 16 | [bulk-download.md](requirements/bulk-download.md) |
| Bulk operations | 13 | [bulk-operations.md](requirements/bulk-operations.md) |
| Retention policies | 13 | [retention-policies.md](requirements/retention-policies.md) |
| Filter | 15 | [filter.md](requirements/filter.md) |
| Sort | 14 | [sort.md](requirements/sort.md) |
| States | 26 | [states.md](requirements/states.md) |
| Cross-cutting | 6 | [README.md](requirements/README.md) |

They describe the target system. The prototype implements a slice —
[the status table](requirements/README.md#status-in-this-prototype) says exactly
which, and does not overstate it.

## Built with @bighatpoland/ui

Every interactive control on every screen is a component from
[`@bighatpoland/ui`](https://github.com/bighatpoland/bighat-design-system) —
[Storybook](https://bighatpoland.github.io/bighat-design-system/). Nothing is
restyled, wrapped, or forked.

```json
"dependencies": {
  "@bighatpoland/ui": "github:bighatpoland/bighat-design-system"
}
```

Setup is three lines, once, in [main.tsx](src/main.tsx):

```tsx
import '@bighatpoland/ui/styles.css';

<div className="bh-root">
  <ToastProvider>
    <App />
  </ToastProvider>
</div>;
```

### The rules this codebase holds itself to

The design system ships its own rules for consumers in
[`agent/SKILL.md`](https://github.com/bighatpoland/bighat-design-system/blob/main/agent/SKILL.md).
The ones with teeth here:

| Rule | How it shows up in this repo |
| ---- | ---------------------------- |
| Semantic tokens only — never a primitive or a hex | [app.css](src/app.css) contains no colour literal. Every value is a `--bh-*` semantic token or a layout property. |
| Spacing comes from the 4px scale | Gaps and padding are `--bh-gap-*` / `--bh-padding-*`. There is no `13px` anywhere. |
| Empty, loading and error are `StateBlock` | No bespoke "no results" markup. And "empty" is written twice — see below. |
| Colour is never the only carrier of meaning | Every `Badge` carries its status as text. The `Card` accent on "Pending approval" is decorative; the label does the work. |
| Never remove a focus outline | Local interactive elements take `bh-focusable`. The one custom ring ([ToggleGroup](src/components/ToggleGroup.tsx)) adds, not replaces. |
| Labels are required; placeholders are not labels | Every `Input`, `Select` and local `Textarea` has a real label, hidden with `hideLabel` where the layout needs it. |
| Prefer a new component over a new prop | Six gaps are local components, named as such, listed below. No system component was widened. |

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
| Dashboard stat tiles | `Card` (via local `StatTile`) |
| Recent activity rows | `Card` + `Badge` |
| Document cards | `Card` + `Badge` |
| Document table, sorting | `Table` |
| Document status | `Badge` |
| Type filter | `Select` |
| Every action | `Button` |
| Upload, document detail | `Dialog` |
| Save, approve, upload confirmation | `Toast` via `useToast()` |
| Empty states, oversized-file error | `StateBlock` |

## Components the design system is missing

The running list lives in **[DESIGN-SYSTEM-GAPS.md](DESIGN-SYSTEM-GAPS.md)** —
eight open gaps, each filled locally in [src/components/](src/components/),
marked `LOCAL COMPONENT` in its own source, and each a candidate to move into
the system. Two of them now have a second occurrence in another product, which
is the bar this repository set for proposing promotion.

That file also records two findings that are not missing components but
decisions the system should make, and the components left deliberately unused.


## Fixed in the design system along the way

Two things this integration surfaced, both fixed upstream:

- The package advertised `types: ./dist/index.d.ts` and never shipped one —
  `vite-plugin-dts` honoured `noEmit` from the app tsconfig and silently emitted
  nothing. Every TypeScript consumer was getting an implicit `any`.
- No `prepare` script, so installing it as a git dependency produced a package
  with no build output at all.

## Tech

- React 19 + TypeScript + Vite
- `@bighatpoland/ui` for every control
- `localStorage` as a fake backend, with the same shape the original prototype
  used

The previous version of this prototype was a single 734-line HTML file using
Tailwind via CDN. The design system is a React component library, so applying it
properly meant becoming a React app. Restyling the old file with the system's
tokens would have looked the same and been a copy, not a dependency.

## Local run

```bash
npm install
npm run dev
```

`npm install` builds the design system from source, since it is a git dependency
rather than a published package.

## Status

Prototype. Not production software. The document management is a plausible
fiction; the design system integration and the requirements are the real
content.
