# PPIC Planning Baseline Logic

Status: PROPOSED. Entities defined in [DATA_MODEL.md](DATA_MODEL.md).

## Hierarchy

```
Project → SubPhase → Work → PlanningLine (attached via PlanningBaseline)
```

- **Project**: the contract/job.
- **SubPhase**: a major grouping (Structure, Finishing, MEP, etc.) — ordering only, no independent calculations.
- **Work**: the unit that everything else attaches to — planning quantities, QS formula application, PR/PO sourcing, and SPV progress all reference a `Work`. This is the level at which "planned vs. actual" is meaningful.
- **PlanningLine**: one priced line item under a Work, belonging to exactly one `PlanningBaseline` (or `BaselineAddendum`).

## Baseline Lifecycle

```
DRAFT → SUBMITTED → APPROVED → (SUPERSEDED if a new baseline replaces it pre-kickoff)
```

- PPIC builds `PlanningLine`s under a `DRAFT` `PlanningBaseline` — either manually or via QS `FormulaApplication` (see [QS_FORMULA_LOGIC.md](QS_FORMULA_LOGIC.md)).
- PPIC `SUBMIT`s the baseline for review.
- CEO (or configured approver — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-03 on whether QS/PPIC also co-sign) `APPROVE`s it, which is a precondition for `Kickoff`.
- A baseline can be revised (new `DRAFT`, old one `SUPERSEDED`) **only before Kickoff**. Once Kickoff exists, `version 1` (marked `isOriginal = true`) is permanently locked — no edits, no deletes, ever.

## Baseline History & the "Original Baseline" Guarantee

Per your instruction: *"The original approved baseline must remain identifiable. Do not silently overwrite the original baseline."*

Implementation rule: `PlanningBaseline.version` is monotonically increasing and immutable once `APPROVED`. `isOriginal = true` is set exactly once, on the baseline that was active at `Kickoff` time, and is never reassigned. Any pre-kickoff revision creates version 2, 3, etc. (all `SUPERSEDED` except the last, which becomes the one carried into Kickoff). All versions remain queryable indefinitely — nothing is deleted.

## Post-Kickoff Changes: BaselineAddendum

After Kickoff, the original baseline is frozen. Any scope change (new item, quantity increase/decrease, removal) is captured as a `BaselineAddendum` with its own approval lifecycle (`DRAFT → SUBMITTED → APPROVED/REJECTED`), never as an edit to the original `PlanningLine` rows.

**Approval is dual: confirmed as CEO + FINANCE, both required** (unlike the original PlanningBaseline, which is CEO-only) — see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Approval Structure. Either approver rejecting sets the addendum to `REJECTED`. Exact sequencing (whether Finance must review before CEO, or either may go first) is `NEEDS_CONFIRMATION` — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

- An addendum references the baseline it amends and carries one or more `AddendumLine` rows, each tagged `changeType`: `ADD`, `INCREASE`, `DECREASE`, or `REMOVE`, with `planningLineId` set when modifying an existing line.
- "Current approved scope" for a `Work` = original baseline lines **+** all `APPROVED` addendum lines net effect. This combined figure — not the raw original baseline — is what variance, PR, PO, and CEO dashboard calculations use as "Baseline" (see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Variance Methodology).
- Addenda are always visible as a distinct, separately timestamped layer (e.g. "Original: 500 m² @ Rp X | Addendum #2 (approved 2026-03-01): +50 m²") — never merged invisibly into a number that looks original.

## What Locks at Kickoff

| Locked | Still changeable |
|---|---|
| Original baseline `PlanningLine` quantities/prices | Via `BaselineAddendum` only |
| `PlanningBaseline.version 1` record itself | New addenda, new PRs against it |
| — | Work names/sequence (non-financial metadata) may still be edited for clarity — NEEDS_CONFIRMATION whether this should also be locked (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-04) |

## Manual Adjustments to QS-Generated Lines

A `PlanningLine` sourced from a `FormulaApplication` (`source = QS_FORMULA`) can still be manually overridden before baseline submission (e.g. QS adjusts a generated quantity for a site-specific reason). The override is stored in-line (the `PlanningLine` itself is still DRAFT and editable) but `formulaApplicationId` is retained for traceability — the dashboard/report layer can always show "this line originated from Formula X, base qty Y, and was manually adjusted." After the `FormulaApplication` is committed and the baseline is `SUBMITTED`, further changes require either a new formula application or a direct manual edit with a recorded reason (same DRAFT-baseline edit path, no separate "override" table needed pre-approval).
