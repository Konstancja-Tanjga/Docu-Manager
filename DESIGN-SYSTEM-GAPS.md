# Design system gaps

The running list of what [`@bighatpoland/ui`](https://github.com/bighatpoland/bighat-design-system)
does not cover, found by building this product against it.

**One file, kept current.** Every gap below is filled locally in
[src/components/](src/components/), marked `LOCAL COMPONENT` in its own source,
and is a candidate to move into the system. When a gap is closed upstream, the
row moves to [Closed](#closed) rather than disappearing — the history is the
argument for the next proposal.

Checked against **`@bighatpoland/ui@2.0.0`**, whose
[`components.json`](https://github.com/bighatpoland/bighat-design-system/blob/main/components.json)
inventories 17 components.

## Open

| Gap | Why the system has no answer | Priority | Second occurrence? |
| --- | ---------------------------- | -------- | ------------------ |
| **`Tabs`** | Nothing comes close. It is a keyboard widget — arrows move, Home/End jump, one tab stop for the group. Every hand-rolled version omits this. | **High** | — |
| **`Textarea`** | `Input` is single-line by contract. `Composer` is a prompt with a submit handler and declares `notFor: ["Ordinary multi-line form fields"]`, so it is not the answer. Multi-line text has nowhere to go. | **High** | — |
| **`Chip`** | `Badge` explicitly refuses to be clickable, correctly. Filter chips and removable tag chips are two different components, and both are used here. | **High** | — |
| **`Timeline`** | An append-only list of dated entries. Used three times in this product — document audit trail, version history, merged dossier activity (`XC-2`, `UPL-14`, `DOS-U-7`) — and each would otherwise be invented separately. | **High** | **Yes** — three surfaces |
| **`DescriptionList`** | An aligned label/value grid. Document metadata, dossier attributes, permission-rule summary. Alignment is the point: the same field sits in the same place on every card, so a row of cards is comparable down the column instead of being re-parsed one by one. | **High** | **Yes** — also built independently in a second product |
| **`ToggleGroup`** | A segmented control is one choice with a current value, so it is a radio group. Rendered as buttons it loses that. `Composer` already contains this logic internally, unexported. | Medium | — |
| **`FileDropzone`** | No file input of any kind. The usual `<div onDrop>` is invisible to keyboard and screen reader users — see `UPL-1`. Needs a real `<input type="file">` underneath. | Medium | — |
| **`PartialResult`** | `StateBlock` has three states — empty, loading, error — and a bulk operation has a fourth: partly done. 460 documents where 12 fail is not an error; it is 448 successes and 12 named failures, and it needs a surface that lists the failures individually with a reason each (`STA-14`–`STA-17`). Every product doing bulk work needs this and invents it. | **High** | — |
| **`Avatar`** | No answer for identity. Small, but every product invents it and half of them read "ML" aloud to a screen reader. | Low | — |

`Timeline` and `DescriptionList` were added after the
[first concept](https://claude.ai/code/artifact/8208d568-914c-4547-b608-9c9b347a1f11)
showed each of them carrying three separate surfaces.

**Two of these now have a second occurrence**, which is the bar this repository
set for promotion: the first is a local component, the second is evidence it
should be in the system.

## Not gaps, but decisions the system should make

| Finding | Why it is not a missing component |
| ------- | --------------------------------- |
| `Select` has no `hideLabel`, `Input` does | An inconsistency, not a gap. The visible label is arguably the better default for selects — but the asymmetry should be a decision the system states, not an accident a consumer discovers. |
| `Table` has no row-activation model | Correct as it stands: a clickable row has no accessible name and no keyboard story. But the alternative has to be stated, or every product invents `onRowClick`. This repository puts an explicit named button in a cell. |
| No typography tokens | Font sizes end up set per-product. Kept in one place here, but a gap that stays open becomes permanent. |

## Local but not a gap

`StatTile` is in `src/components/` and is **not** a gap — it is a local
composition of the system's `Card`. Worth promoting only if a second product
wants the same tile.

## Unused, deliberately

`Board`, `NavRail`, `Skeleton` and `Composer` are not used by this product yet.
`Board` — "columns of cards — kanban, pipeline, review queue" — is the intended
component for the work queue and is unused only because that screen is not
built. It is not a gap.

## Closed

Nothing yet.

## Fixed upstream while building this

Two packaging defects this integration surfaced, both fixed in the design
system:

- The package advertised `types: ./dist/index.d.ts` and shipped none —
  `vite-plugin-dts` honoured `noEmit` from the app tsconfig and silently emitted
  nothing. Every TypeScript consumer was getting an implicit `any`.
- No `prepare` script, so installing it as a git dependency produced a package
  with no build output at all.
