---
name: design-system
description: Use this before writing or editing any UI in DocuManager. This product is built on @bighat/ui; this file says what to reach for, what is deliberately local, and what not to invent.
---

# UI in DocuManager

Every control comes from [`@bighat/ui`](https://github.com/Konstancja-Tanjga/bighat-design-system).
Load its own rules first — they ship in the package at `agent/SKILL.md` and are
the authority on tokens, states and composition. Then load `agent/react.md`,
which is the React expression of them. This file only covers what is specific
to this product.

## Before adding any UI

1. **Check the system first.** `node_modules/@bighat/ui/spec/components/` is the
   machine-readable inventory: one contract per component, each with `purpose`
   and `notFor`. `notFor` is not advice; it is the reason a component will
   refuse. (In 2.0 this was a single `components.json`. That file is gone.)
2. **Then check `DS-GAPS.md` in the system.** It records what the system does
   *not* cover and why. If what you need is in there, the entry says what the
   reason was.
3. **Then check `src/components/`.** One thing lives there, and it is a
   composition rather than a gap — see below.
4. **Only then build something new** — and mark it `LOCAL COMPONENT` in the
   file, add it to the table in the README, and use semantic tokens only.

## There is nothing left to duplicate

This prototype used to keep six local components. **All six are now in the
system**, and building them there was the point of the exercise:

| Was local | Now |
| --------- | --- |
| `Tabs` | `Tabs` / `TabList` / `Tab` / `TabPanel` |
| `ToggleGroup` | `SegmentedControl` |
| `Avatar` | `Avatar` (plus `AvatarGroup`) |
| `Textarea` | `Textarea` |
| `Chip` (`FilterChip`, `RemovableChip`) | `FilterChip`, `RemovableChip` |
| `FileDropzone` | `FileDropzone` |

`StatTile` is the one thing still in `src/components/`, and it is **not** a gap:
it is a local composition of the system's `Card`. Promote it only if a second
product wants the same tile.

## Things that will bite

- **A `Card` with `onClick` is a `<button>`.** Everything inside it must be
  phrasing content — `<span>`, not `<p>` or `<div>`. The spans in `app.css`
  carry explicit `display` for this reason.
- **`Table` has no row click.** Put a named `Button` in a cell. Do not add one.
- **`Select` has no `hideLabel`.** `Input` does. Show the label on selects — and
  `Textarea` has none either, deliberately: a multi-line field cannot borrow its
  name from context.
- **Empty is two states.** First use offers an upload; filtered-to-nothing
  offers a way out of the filter. Both already exist in `pages/Documents.tsx`;
  match them.
- **`StateBlock` takes `scope`, not `density`.** `density` still works and warns
  in development; it is removed in 5.0. Same for `tone="default"`, which is now
  `tone="neutral"` — and since that is the default value, usually just delete
  the prop.
- **No `className` on a system component.** Not on any of the 45. Wrap it in a
  `dm-*` element if the layout needs one, and put the rule in `app.css`.
- **No colour literals in `app.css`.** If no semantic token fits, that is a
  missing role in the design system. Say so and stop — do not reach for a hex.
  A selected or current thing is `--bh-selection-*`, not `--bh-status-info-*`.

## Feedback goes in two places

A `Toast` confirms something happened. A `StateBlock` carries something the user
has to act on where they are. An oversized file is a `StateBlock` in the upload
dialog, not a toast — the user has to remove the file.
