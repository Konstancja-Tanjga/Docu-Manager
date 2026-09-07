# States

Every surface that can be empty, slow, refused or overfull, and what it says
when it is. Collected in one file because states were previously scattered
across six others, which meant nobody could count them or check that a screen
had all of its own.

**The rule that governs this whole file:** a state is not a decoration of the
happy path. It is a screen a person will actually be looking at, usually at the
worst moment, and it has to tell them what happened and what to do next.

## What the design system already decides

`StateBlock` from `@bighatpoland/ui` owns empty, loading and error, and it
already fixes the part that is easy to get wrong — how each one is announced:

| State | Announcement | Why |
| ----- | ------------ | --- |
| loading | `role=status`, polite | Must not interrupt what the user is reading. |
| error | `role=alert`, assertive | The user's action failed; they need to know now. |
| empty | no live region | A successful response with nothing in it is not an event. |

Do not reimplement these. Where a state below names `StateBlock`, it means that
component with that `state` and `density`, not a lookalike.

## Empty is always two states

**`STA-1` Nothing yet and nothing matched are different screens, everywhere.**
The first offers the action that creates the first item. The second offers a way
out of the filter. This restates `FLT-8` as a requirement that applies to every
list, table, register and panel in the product, not only the document library.

- Acceptance: no surface in the product uses one empty state for both causes.

**`STA-2` An empty queue is good news and says so.**
"Needs you" with nothing in it is not a void to apologise for. It reads as
completion — nothing is waiting on you — and offers no action, because there is
nothing to do.

**`STA-3` An empty register inside a dossier is information, not an empty state.**
It renders as a register with a count of zero, because its emptiness says
something is outstanding. Replacing it with `StateBlock` would hide exactly the
fact it exists to carry. See `DOS-U-5`.

**`STA-4` An empty rule set means everything is closed, and the screen says that.**
Per `PRM-25`, no rules means no access. An empty rule list must not read as a
tidy starting point; it reads as a product nobody can use yet, with the action
that fixes it.

**`STA-5` An empty inspector prompts a selection.**
Not a spinner, not a blank panel. One line naming what selecting a row will
show.

## Loading

**`STA-6` `Skeleton` is used only where the shape of the arriving content is already known.**
Table rows, the inspector's fields, a version list: shapes the product can
promise. Everywhere else the wait is a `StateBlock` in its loading state. A
skeleton for content of unknown shape promises a layout that never arrives,
which is worse than an honest spinner.

**`STA-7` A loading state that replaces existing content preserves it instead.**
On a filter or sort change the list dims and updates; it does not empty and
refill. An empty intermediate frame reads as "no results" every single time.
Restates `FLT-15`.

**`STA-8` Anything that can exceed a few seconds reports progress and can be cancelled.**
Per `XC-6`. Cancellation leaves no partial artefact — see `BDL-11`.

**`STA-9` A surface still loading after a long wait says so, and offers a retry.**
Silence past ten seconds is indistinguishable from a hung page.

## Error

**`STA-10` An error names what failed and what to do about it.**
Never "an error occurred", never an apology. Restates `BLK-12` and `UPL-3` as a
product-wide rule.

**`STA-11` An error on one surface does not take down the surfaces around it.**
One failed queue group renders its own error; the other three still work. A page
that fails whole because one panel failed loses the user more than the panel was
worth.

**`STA-12` Technical detail goes in `StateBlock`'s `diagnostics`, collapsed.**
Present for the person who has to report it, absent for everyone else.

**`STA-13` An oversized or rejected upload is a `StateBlock` in the dialog, not a toast.**
The user has to remove the file, so the message has to persist where the action
is. A toast for something requiring action is the design system's named mistake.

## Partial results — the third outcome

**`STA-14` A bulk operation has three outcomes, not two: done, failed, and partly done.**
Partly done is the common one and the one nobody designs. It is not an error
state: 460 documents where 12 fail leaves **448 done** and names the 12.

**`STA-15` A partial result lists the failed items individually, each with its reason.**
As a list the user can act on. "12 documents could not be processed" is a dead
end; naming them is not. Restates `BLK-12`.

**`STA-16` A partial result survives the notification that announced it.**
The toast is gone by the time anyone reads the failures. The list lives in a
panel that outlives it — see `BLK-11`.

**`STA-17` `StateBlock` has no partial state, so this one is product-local and named as such.**
Recorded in [DESIGN-SYSTEM-GAPS.md](../DESIGN-SYSTEM-GAPS.md). It is a
candidate for the system precisely because every product that does bulk work
needs it and invents it.

## Refusal

**`STA-18` Where permissions reduce a result, the surface says how many were withheld and why.**
On every list, not only on export. Restates `XC-1`, which is currently honoured
in one place.

**`STA-19` A refusal names the decisive rule where the user is entitled to know it.**
Per `PRM-26`. "You do not have permission" is not an answer.

**`STA-20` An action the current selection cannot support is absent, with the reason available — not present and failing.**
Restates `BLK-6`.

**`STA-21` A read-only surface is a different screen, not a greyed-out one.**
A closed dossier has no write controls at all and states that it is closed and
by whom. Disabling every control and explaining nothing is the failure
`DOS-U-11` names.

## Overfull

**`STA-22` Text that can outgrow its container wraps or scrolls within it.**
Clipped text is a defect, not a layout choice. Document titles, rule
descriptions and version comments are the three that will do it first.

**`STA-23` Wide content scrolls inside its own container and never sideways-scrolls the page.**
Tables and the rule list, at every width in the config.

**`STA-24` A list with more items than it shows says how many more, and how to reach them.**
A bare truncation with no count is indistinguishable from the end of the data.

**`STA-25` Counts and limits are stated before they are hit.**
Tag limits, selection limits, batch sizes. Restates `UPL-2` and `BLK-5`: a limit
discovered by rejection wastes the work that hit it.

## Coverage

**`STA-26` Every surface is checked in both themes and at every configured width, in every state it can hold.**
The state matrix times themes times widths is the real surface area, and a state
that was only ever seen in one theme at one width has not been checked. This is
what gate 5 of the handoff checks asks for, and the evidence is screenshots, not
assertions.
