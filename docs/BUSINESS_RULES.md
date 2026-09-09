# Cross-Cutting Business Rules

Status: PROPOSED. This is the canonical home for rules used by more than one module. Per your instructions: *"The same business logic must be used by PR, PO, dashboard, reports, warnings. Do not create different formulas in different modules."* Anything below must be implemented as a single shared function/service (see [ARCHITECTURE.md](ARCHITECTURE.md) §Calculation Layer) — never re-implemented per module.

## Variance Methodology (single source of truth)

Used by: PR creation/warning, PO creation/warning, CEO dashboard, reports.

For a given `Work` (or `PlanningLine`, when comparing at line-item grain):

```
Baseline Allowance   = SUM(original approved PlanningLine qty/value)
                      + SUM(APPROVED BaselineAddendum line net effect)
                      — i.e. "current approved scope" as defined in PPIC_LOGIC.md

Cumulative Requested (prior) = SUM(quantity/value of all PRItems on APPROVED PRs
                                referencing this Work/PlanningLine, EXCLUDING the PR
                                currently being evaluated)

Cumulative Requested (incl. current) = Cumulative Requested (prior) + this PR's quantity/value

Remaining Allowance  = Baseline Allowance − Cumulative Requested (prior)

Variance             = Cumulative Requested (incl. current) − Baseline Allowance
Variance %            = Variance / Baseline Allowance × 100   (if Baseline Allowance = 0, Variance % is undefined/N/A — display "No baseline", do not divide by zero)
```

- Both **quantity variance** and **value variance** are computed; a PR can be within quantity allowance but over value allowance (e.g. price escalation) or vice versa. Both are shown.
- **PO-stage variance** (confirmed): since a `PurchaseOrder` now always belongs to exactly one `PurchaseRequest` (see [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md) §PR → PO), the same formula runs at PO time using PO quantities/values, checked unambiguously against that PO's single parent PR's already-approved allocation. This resolves the previously open question about PO-stage variance scope — the structural 1-PR-per-PO rule removes the ambiguity.
- Negative variance (under baseline) is not a warning; it's simply displayed. Positive variance beyond the configured purchasing ceiling routes for CEO co-approval — see below.

## Purchasing Ceiling

Confirmed structure:

- The purchasing ceiling is a **percentage**, stored as `ConfigThreshold` key `PURCHASING_CEILING_PCT`, and is applied to the same variance calculation above (never a separate formula).
- **Configurable only by CEO or FINANCE** — never hardcoded, never editable by any other role (see [USER_ROLES.md](USER_ROLES.md)).
- Below the ceiling: **FINANCE** approves the PR/PO/Payment on its own. At or above the ceiling: **CEO** co-approves in addition to FINANCE — Finance's approval role is never replaced by the ceiling breach, CEO approval is additive.
- **`NEEDS_CONFIRMATION`** (the one remaining open item here, per your instruction): the exact **escalation/blocking behavior** once the ceiling is exceeded — e.g., does the PR/PO simply route to CEO for a decision (block until CEO acts), or does it show a warning that CEO can override after the fact, or is there a multi-tier structure (e.g. a second, higher ceiling that hard-blocks even CEO override without a documented reason)? See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md). The mechanism (configurable %, shared variance function, CEO+Finance dual involvement above threshold) is fully designed regardless of how this resolves.

## Configuration & Effective Dating

Every `ConfigThreshold` (purchasing ceiling %, stock variance threshold %, pricing library prices) is effective-dated (`effectiveFrom`/`effectiveTo`). Rule: **changing a threshold or price only affects records created or evaluated after the change**; historical reports and already-committed `PlanningLine`/`FormulaApplication` values are recalculated using the threshold/price that was in effect at the time they were committed, not the current one.

**Exception — CEO deviation thresholds are not configurable at all.** Per your explicit instruction not to change the `>10%` (Deviation 1) and `≥5%` (Deviation 2) thresholds, these are fixed constants in the calculation layer, not `ConfigThreshold` rows — see [DECISIONS.md](DECISIONS.md) D-008 and [REPORTING_LOGIC.md](REPORTING_LOGIC.md).

## Approval Structure (confirmed)

| Action | Approver | Escalation |
|---|---|---|
| PPIC Baseline (project-wide plan) | CEO | — |
| Project Kickoff (one-time, unlocks Sub-Phase kickoff requests) | CEO | — |
| Sub-Phase Kickoff (per Sub-Phase, unlocks PR for that Sub-Phase) | CEO | — |
| Purchase Request | FINANCE | + CEO if over purchasing ceiling |
| Purchase Order | FINANCE | + CEO if over purchasing ceiling |
| Invoice | FINANCE (records, reference only) | — |
| Payment | FINANCE | + CEO if over purchasing ceiling |
| Progress (submission) | PM (Project Manager) | — |
| Progress Validation | QS, weekly/biweekly | — |
| Stock (report) | LOGISTIC | — |
| Stock Validation | QS, weekly/biweekly | — |
| Addendum | **CEO + FINANCE (dual — both required)** | — |

Full role/module permission matrix in [USER_ROLES.md](USER_ROLES.md).

## Approval & Rejection

- Every `APPROVE`/`REJECT` action is server-side authorized by role (see [USER_ROLES.md](USER_ROLES.md)) and recorded in `AuditLog` with actor, timestamp, before/after state.
- `REJECT` always requires a reason (free text minimum), and triggers a `Notification` back to the submitter.
- **Dual approval (Addendum only)**: both `financeApprovedAt` and `ceoApprovedAt` must be set for status to become `APPROVED`. Either approver rejecting sets status to `REJECTED` immediately (does not wait on the other). Exact sequencing (must Finance review before CEO, or can either go first) is `NEEDS_CONFIRMATION` — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md); the default assumption used in the plan is that either may approve first, in any order.
- No entity can be both self-submitted and self-approved by the same user, even if their role technically has both permissions — `NEEDS_CONFIRMATION` whether this segregation-of-duties rule is required (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).

## Historical Integrity

None of the following are ever hard-deleted through normal application flows: `PlanningBaseline` versions, `BaselineAddendum`, `PurchaseRequest`, `PurchaseOrder`, `Invoice`, `Payment`, `ProgressSubmission`, `ProgressValidation`, `StockMovement`, `PhysicalStockCount`, `StockValidation`, `AccountingExpenseEntry`. Corrections are additive (new row referencing the old one). This is required for the CEO dashboard's drill-down and for financial audit to be trustworthy.
