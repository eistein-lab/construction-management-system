# PPIC Planning Baseline Logic

Status: PROPOSED. Entities defined in [DATA_MODEL.md](DATA_MODEL.md).

> **"PPIC" is not a role** (corrected 2026-09-09, see [DECISIONS.md](DECISIONS.md) D-012). PPIC — Production Planning and Inventory Control — is the name of this process/document itself (historically an Excel baseline/budgeting sheet), kept as this doc's title because it names the *process*, not a person. The people who actually do this work are **PM (Project Manager)**, who owns and submits the baseline, and **QS (Quantity Surveyor)**, who prices it via formulas (see [QS_FORMULA_LOGIC.md](QS_FORMULA_LOGIC.md)) — together or separately.

## Hierarchy

```
Project → SubPhase → Work → PlanningLine (attached via PlanningBaseline)
```

- **Project**: the contract/job.
- **SubPhase**: a major grouping (Sub-structure, Structure, Lv2 Structure, Finishing, MEP, etc.). Not just an ordering label — it's the level **Sub-Phase Kickoff** gates (below), so purchasing, progress, and over-budget detection all roll up to it.
- **Work**: the unit that everything else attaches to — planning quantities, QS formula application, PR/PO sourcing, and SPV progress all reference a `Work` (e.g. Column, Beam, Excavation). This is the level at which "planned vs. actual" is meaningful.
- **PlanningLine**: one priced line item under a Work (Labor, Material, etc.), belonging to exactly one `PlanningBaseline` (or `BaselineAddendum`). Generated via a QS Formula, or entered manually — **manual lines are visibly flagged as not sourced from the formula library** (a "Manual" badge in the UI) so a reviewer can tell at a glance which lines to double-check; this is a display distinction only; both are equally valid, no distinct approval flow exists for either as of Day 3.

## Baseline Lifecycle

```
DRAFT → SUBMITTED → APPROVED → (SUPERSEDED if a new baseline replaces it pre-kickoff)
```

- PM builds `PlanningLine`s under a `DRAFT` `PlanningBaseline` — either manually, or QS contributes lines via `FormulaApplication` (see [QS_FORMULA_LOGIC.md](QS_FORMULA_LOGIC.md)) — both write into the same DRAFT baseline.
- PM `SUBMIT`s the baseline for review.
- CEO (or configured approver — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-03 on whether QS/PM also co-sign) `APPROVE`s it, which is a precondition for project-level `Kickoff`.
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
| `PlanningBaseline.version 1` record itself | New addenda, new PRs against it (once that Work's Sub-Phase is separately kicked off — below) |
| — | Work names/sequence (non-financial metadata) may still be edited for clarity — NEEDS_CONFIRMATION whether this should also be locked (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-04) |

## Sub-Phase Kickoff (added 2026-09-09 — see [DECISIONS.md](DECISIONS.md) D-013)

Project-level `Kickoff` (above) is a one-time event that locks the baseline — but it does **not** by itself authorize spending. Real construction mobilizes phase by phase: Foundation starts before Column & Beam, which starts before Finishing. A second, repeatable layer gates that:

```
Project Kickoff (CEO, once)
        ↓ unlocks the ability to request Sub-Phase kickoff at all
PM requests SubPhaseKickoff for a specific SubPhase (with planned start/end dates)
        ↓
CEO APPROVE / REJECT (reject requires a reason; PM may resubmit — new row, old one preserved)
        ↓
APPROVED → PurchaseRequest can now be created against Works in that SubPhase
```

- Each `SubPhase` tracks its own kickoff independently — Foundation can be `APPROVED` while Column & Beam is still `REQUESTED` or not yet requested at all.
- **No `SubPhaseKickoff` row, or a `REJECTED` one, means no Purchase Request can be created against that Sub-Phase's Works** — see [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md).
- This does not change project-level Kickoff's own effect (locking `PlanningBaseline` v1) — the two are independent gates: one locks the *plan*, the other unlocks *spending*, phase by phase.
- Slated for Day 4 alongside project-level Kickoff — not built as of Day 3.

## Manual Adjustments to QS-Generated Lines

A `PlanningLine` sourced from a `FormulaApplication` (`source = QS_FORMULA`) can still be manually overridden before baseline submission (e.g. QS adjusts a generated quantity for a site-specific reason). The override is stored in-line (the `PlanningLine` itself is still DRAFT and editable) but `formulaApplicationId` is retained for traceability — the dashboard/report layer can always show "this line originated from Formula X, base qty Y, and was manually adjusted." After the `FormulaApplication` is committed and the baseline is `SUBMITTED`, further changes require either a new formula application or a direct manual edit with a recorded reason (same DRAFT-baseline edit path, no separate "override" table needed pre-approval).
