# CEO Dashboard & Deviation Logic

Status: PROPOSED. Calculation 1 is fully specified and implementable now. Calculation 2 depends on [STOCK_LOGIC.md](STOCK_LOGIC.md) §Valuation Methodology (`NEEDS_CONFIRMATION`). Thresholds and formulas below are confirmed and must not be changed.

## What the CEO Dashboard Shows (per project, with a portfolio rollup)

- Baseline (current approved scope — original + addenda)
- Addenda (called out separately, never merged into Baseline silently)
- PR total (submitted/approved)
- **Purchase Value (A), Paid Value (B), Debt Value (C)** — the confirmed financial ladder, see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md)
- Invoiced total (reference/reconciliation only)
- Expensed total (accounting actual)
- Progress % — **validated** (QS, weekly/biweekly), with an "unvalidated" provisional figure shown distinctly if no validation exists yet for the current period
- Stock % / value — **validated** (QS, weekly/biweekly), same provisional-labeling rule
- Deviation 1 and Deviation 2 (below), with warning state
- Purchasing ceiling status (any PR/PO/Payment currently awaiting CEO co-approval because it's over the configured ceiling %)

Every summary figure is drill-down capable to its underlying rows (`AuditLog`-backed per [DATA_MODEL.md](DATA_MODEL.md)) — a CEO clicking "Expensed: Rp X" reaches the actual list of `AccountingExpenseEntry` rows that sum to it.

## Calculation 1 — Expense vs. Project Progress

Confirmed formula:

```
Expense %  = Accounting Actual Expense / Approved Project Baseline × 100
Progress % = validated Project.progressPercent (see PROGRESS_LOGIC.md §Validation)

Deviation 1 = Expense % − Progress %
```

- **Threshold: `Deviation 1 > 10%` → WARNING.** Do not change this threshold. Strict `>` (exactly 10% is not a warning), per the worked example (52% − 40% = 12% → WARNING).
- **Denominator**: "Approved Project Baseline" = current approved Baseline Allowance (original + approved addenda), the same figure [BUSINESS_RULES.md](BUSINESS_RULES.md) uses for PR/PO variance — never a second, dashboard-only definition of "baseline."
- **Rounding**: computed at full precision, displayed to 1 decimal place; the threshold comparison runs on the unrounded value.
- **Negative deviation**: not a warning, displayed as-is.
- **Zero values**: if Approved Project Baseline = 0, Expense % is undefined — display "No baseline", never divide by zero. If Progress % = 0 and Expense % > 0, Deviation 1 legitimately warns (money spent, nothing built yet) — surfaced honestly, not suppressed.

## Calculation 2 — Expense vs. Project Progress + Stock

Confirmed formula:

```
Deviation 2 = Expense % − (Progress % + applicable Stock %)
```

- **Threshold: `Deviation 2 ≥ 5%` → WARNING.** Do not change this threshold. Inclusive `≥` (exactly 5% does warn) — distinct from Calculation 1's strict `>`.
- **Stock % is the validated figure** (QS, weekly/biweekly — see [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md)), computed from Expected/Validated Remaining Stock (Delivered minus Used), valued per [STOCK_LOGIC.md](STOCK_LOGIC.md) §Valuation Methodology.
- **No double counting (confirmed)**: material already consumed into validated Progress (i.e. already `Used`) is excluded from Stock % by construction — a unit of material contributes to either Progress % or Stock %, never both.
- Depends entirely on the stock valuation methodology confirmation — until resolved, Calculation 2 cannot be implemented; Calculation 1 ships independently. This is a Priority 2 item (per [PRODUCT_SPEC.md](PRODUCT_SPEC.md)), not a Priority 1 blocker.
- Same denominator, rounding, and zero-handling conventions as Calculation 1.

## Display

Both deviations shown side by side per project (and rolled up portfolio-wide as "N projects in warning state"), color-coded per [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) using the shared semantic color convention.

## Purchasing Ceiling Visibility

Any PR/PO/Payment currently sitting at or above the configured `PURCHASING_CEILING_PCT` and awaiting CEO co-approval is surfaced directly on the dashboard as an action item, not buried in the PR/PO list.
