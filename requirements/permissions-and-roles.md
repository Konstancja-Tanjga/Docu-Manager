# Permissions and roles

How access to content is decided. The model is **rule-based and driven by
metadata**, not by where a document sits: a rule grants or denies a set of
operations to a set of roles, for every document whose metadata satisfies the
rule's predicate.

This is the part of the system most likely to be got subtly wrong, because a
permission model fails silently. A rule that is too narrow produces a support
ticket; a rule that is too broad produces nothing at all until an audit.

## Roles

**`PRM-1` Roles come from the organisation's identity provider and are read-only in this product.**
The product consumes roles; it does not create, rename or delete them. Every
role displays its source, and the interface states that it is managed
externally rather than presenting controls that cannot work.

- Acceptance: a role's detail view shows its origin and offers no rename or
  delete affordance.

**`PRM-2` A role that has disappeared from the identity provider is retained, marked, and never silently dropped.**
Rules referencing it keep working or stop working — whichever the product
decides — but the interface must say which, and name the affected rules. A
role vanishing from a rule without notice is how access quietly widens.

**`PRM-3` Every role can be listed with the rules that reference it and the operations those rules confer.**
This is the "what can this person see?" direction of `DOS-A-9`, resolved
against the rule set rather than against a folder tree.

## Rules

**`PRM-4` A content permission rule is a named object with a description, an enabled flag, a type, an operation scope, a set of assigned roles, and a predicate.**
All six are visible in the rule list without opening the rule. A rule whose
effect can only be learned by opening it will not be reviewed.

**`PRM-5` A rule is either `Grant` or `Deny`, and the type is visible at a glance.**
Both directions must be expressible. Deny exists because some content has to be
withheld from roles that a broader grant would otherwise reach.

**`PRM-6` Deny wins. Decided.**
When a document is matched by an enabled Deny rule and an enabled Grant rule at
once, access is refused. There is no case in which a Grant overrides a Deny.

The interface states this where the rules are managed, in these words or their
translation: *"A Deny always wins. If any enabled Deny rule matches, access is
refused — whatever a Grant says."* Documentation alone does not satisfy this.

- **Why this and not the alternatives.** Grant-overrides is fail-open: one
  over-broad Grant makes every Deny decorative, which is worse than having none,
  because it looks like control. First-match-by-order turns rule order into
  hidden state — at several hundred rules, "which matched first" stops being
  answerable by looking, and reordering one rule changes access to documents
  nobody was considering. Most-specific-predicate-wins fails because specificity
  is not well-ordered: `department = HR` and `classification = Confidential` are
  incomparable, so it needs a tiebreak and collapses into one of the others with
  an extra layer nobody can predict.
- **What it costs.** One broad Deny can quietly disable many Grants. That cost
  is real and is paid down by `PRM-26` and `PRM-27`, which exist for this
  reason.
- Acceptance: the outcome of any rule set is the same whatever order the rules
  are stored or displayed in.

**`PRM-25` No rule means no access.**
A document matched by no enabled rule is not readable by anyone except roles
holding system administration. Absence of a rule is a refusal, never a
permission.

This is the more consequential half of `PRM-6`, because it governs most
documents rather than the overlap. Without it the rule set is advisory: content
would be reachable until someone remembered to forbid it, which is the opposite
of the model.

- Acceptance: a newly created document type with no rules referencing it is
  invisible to every ordinary role until a Grant is written.

**`PRM-26` For any document and any user, the product can name the rule that decided it.**
Both directions: why this person can see it, and why they cannot. Because Deny
wins and order is irrelevant, a refusal always has a single decisive rule, which
makes a precise answer cheap to produce.

Without this, `PRM-6` is correct and undiagnosable. "You do not have permission"
tells a user nothing and tells an administrator less.

- Acceptance: the answer names the rule, its type, and the part of its predicate
  the document satisfied.

**`PRM-27` Saving a Deny rule states what it takes away.**
Beyond `PRM-12`'s match count: how many currently-permitted accesses the rule
would revoke, broken down by role. A Deny is the only rule type that removes
capability from a working system, so it is the only one whose blast radius has
to be a number on screen before it is saved.

**`PRM-28` Rules are never ordered, and the product offers no way to order them.**
Order-independence is what keeps a set of several hundred rules reviewable, and
it is a property that has to be defended: the first request after launch will be
to move a rule up. The answer is to narrow a predicate or add a Deny, never to
reorder.

**`PRM-7` Operation scope is a set, drawn from a fixed vocabulary of operations.**
At minimum: read, upload, and logical delete. The scope is a set because a role
that may read and upload but not delete is the ordinary case, not the exception.

**`PRM-8` A predicate is a conjunction of metadata comparisons, and its plain-language summary appears in the rule list.**
`department = Executive AND classification = Confidential`, rendered as text a
reviewer can check against intent. Predicates reference metadata fields by
definition, never by free-typed name.

**`PRM-9` A rule can be disabled without being deleted, and a disabled rule is visibly not enforced.**
Disabling is how a rule is taken out of effect while its intent is preserved for
review. The list must be filterable to enabled and disabled separately.

**`PRM-10` The rule list is filterable by enabled state and by type, and searchable by name and description.**
With several hundred rules — the reference design shows 354 — an unfiltered list
is not reviewable.

**`PRM-11` Every rule records when it was last modified and by whom.**
Changes to the rule set are the highest-consequence configuration changes in the
product and fall under `XC-2`.

**`PRM-12` Creating or editing a rule shows its effect before it is saved.**
How many documents the predicate currently matches, and which roles would gain
or lose which operations. A rule saved blind is a rule nobody can review.

## Safeguards

**`PRM-13` The product prevents an administrator from removing their own ability to administer it.**
A change that would leave no role holding administration rights, or would strip
them from the acting user, is refused with an explanation. Lock-out is
unrecoverable without vendor intervention, which makes prevention the only
acceptable design.

**`PRM-14` A metadata field referenced by any content permission rule cannot be deleted.**
The attempt names the rules that block it. Deleting the field out from under a
predicate silently changes who can see what.

**`PRM-15` A metadata field used in any document type definition cannot be deleted.**
Same reasoning, different dependency. Both blocks are stated as counts with the
dependants named, not as a generic refusal.

**`PRM-16` A document type in use cannot be reclassified in a way that invalidates an existing rule.**
Where reclassification would leave a predicate referencing a field the type no
longer carries, the operation is refused and the affected rules are named.

**`PRM-17` A rule referencing a definition that no longer resolves is surfaced as invalid in the interface, not skipped at evaluation time.**
An invalid rule must be visible as invalid. A rule that silently evaluates to
nothing is indistinguishable from a rule that is working.

**`PRM-18` Deletion of content is logical by default.**
A logically deleted document leaves the working views, remains recoverable, and
remains subject to retention and legal hold. Permanent destruction is a separate,
separately-permissioned operation — see `DOS-A-13`.

**`PRM-19` Deleted content has its own view, reachable only by roles entitled to it.**
Recovery is a normal operation, not a support request.

## Metadata fields as the substrate

**`PRM-20` A metadata field has exactly one data type, fixed at creation.**
Changing the type of a field in use is not an edit; it is a migration, and the
product does not pretend otherwise.

**`PRM-21` An enumerated field's allowed values are managed in a dedicated editor, and removing a value states what it affects.**
This is `DOS-A-3` applied to the field level: values are deprecated rather than
deleted where any document carries them.

**`PRM-22` A field's mandatory flag can be changed, and the change reports how many existing documents it would make incomplete.**
Those documents become incomplete rather than inaccessible — the same rule as
`DOS-U-10`.

**`PRM-23` A field may be marked sensitive or immutable, and those marks constrain what rules and edits may do to it.**
An immutable field cannot be edited after creation; a sensitive field's reads
are audited under `XC-2`.

**`PRM-24` System metadata is not configurable, and is presented as such.**
Fields the product owns are visible and clearly not editable, rather than absent
or editable-then-refused.
