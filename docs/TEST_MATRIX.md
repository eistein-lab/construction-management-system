# Test Matrix

Status: PROPOSED. Each row is a test case category to implement before the corresponding implementation day is considered done. Revised for the confirmed PR:PO structure, Payment/Invoice/Delivery independence, Purchase/Paid/Debt ladder, Finance-led approvals, and QS weekly/biweekly validation of Progress and Stock.

| Area | Test Case | Type | Day |
|---|---|---|---|
| Auth | Login succeeds/fails correctly per credential validity | Integration | 1 |
| Auth | Each role can only access routes/actions granted in [USER_ROLES.md](USER_ROLES.md) matrix (deny-by-default check) | Integration | 1 |
| Roles | SPV cannot view a project they're not assigned to | Integration | 1 |
| PPIC Baseline | Baseline totals = SUM(PlanningLine); DRAFT is editable, APPROVED is not | Unit+Integration | 2 |
| PPIC Baseline | Original baseline (`isOriginal=true`) is never mutated after Kickoff, even via direct edit attempt | Integration | 4 |
| QS Formula | FormulaApplication generates correct qty (`baseQuantity × qtyPerOutputUnit`) and price snapshot per line | Unit | 3 |
| QS Formula | Committed FormulaApplication is immutable; library price change afterward does not alter already-generated PlanningLines | Integration | 3 |
| Kickoff | Kickoff sets Project.status and locks baseline v1 | Integration | 4 |
| Kickoff | Post-kickoff scope change is rejected unless routed through BaselineAddendum | Integration | 4 |
| Addendum | Addendum requires BOTH CEO and FINANCE approval to reach APPROVED; either party's rejection sets REJECTED regardless of the other's prior approval | Integration | 4 |
| PR / Variance | Variance calculation matches hand-computed value across: under baseline, exactly at baseline, over baseline, zero baseline (N/A, no divide-by-zero) | Unit | 5 |
| PR / Variance | Same variance function output is used by PR service and PO service (regression test asserting single code path) | Unit | 5–6 |
| PR Approval | PR approval routes to FINANCE; CEO co-approval fires only when value/variance exceeds `PURCHASING_CEILING_PCT`, and does not replace Finance's approval | Integration | 5 |
| PO Structure | A PurchaseOrder can only draw items from a single parent PurchaseRequest; attempting to add an item sourced from a different PR is rejected | Integration | 6 |
| PO Structure | One PR generates multiple POs correctly (split across suppliers); each PO independently traces back to the same one parent PR | Integration | 6 |
| Purchasing Ceiling | `PURCHASING_CEILING_PCT` is editable only by CEO/FINANCE roles (rejected for all others); PR/PO/Payment above it is blocked pending CEO co-approval | Integration | 5–7 |
| Debt Ladder | `debtValue = purchaseValue − paidValue` for a PO, reproducing the worked example (Rp100M / Rp60M → Rp40M) exactly | Unit | 7 |
| Payment Independence | A Payment can be saved against a PO with zero Invoices and zero DeliveryReceipts, in any order, with no validation error | Integration | 7 |
| Payment Independence | Invoice can be recorded regardless of delivery status; Payment amount is never allocated to specific PO items (no item-level payment record exists anywhere) | Integration | 7 |
| Accounting Expense | Baseline/Purchase Value/Paid Value/Debt Value/Invoiced/Expensed are independently stored and never derived from one another in a shared query path | Integration | 8 |
| Progress | Only APPROVED ProgressSubmission affects the provisional Work.progressPercent; SUBMITTED/REJECTED do not | Unit | 11 |
| Progress | ProgressCorrection requires its own PPIC approval before affecting progressPercent; original submission stays queryable unchanged | Integration | 11 |
| Progress Validation | ProgressValidation defaults `validatedProgressPercent` to the reported figure; QS can adjust it; CEO dashboard reads only the validated figure, never the raw provisional one | Integration | 11 |
| Stock | StockBalance ("Expected Stock") always equals Delivered − Used net of Adjustments/Transfers for its project/item/location (no direct-write path exists) | Unit | 12 |
| Surat Jalan | Each discrepancy type (WRONG_PO, WRONG_SUPPLIER, DUPLICATE_SJ, UNEXPECTED_ITEM, UNDER_DELIVERY, OVER_DELIVERY) triggers correctly from crafted input | Unit | 12 |
| Delivery | Surat Jalan validated/committed posts correct StockMovement(s); OVER_DELIVERY/mismatch blocks auto-confirm | Integration | 12 |
| Stock Reconciliation | PhysicalStockCount vs. Expected Stock produces correct varianceQuantity/variancePercent; `thresholdExceeded` correctly reflects `STOCK_VARIANCE_THRESHOLD_PCT` | Unit | 12 |
| Stock Reconciliation | A flagged discrepancy never gets an automatic cause label (status stays a neutral "FLAGGED_FOR_INVESTIGATION" string, no "theft"/"loss" auto-assignment anywhere in code or copy) | Integration | 12 |
| Stock Reconciliation | Both `reportedQuantity` and `validatedQuantity` are preserved permanently and independently after a QS adjustment | Integration | 12 |
| CEO Dashboard | All required figures render for a seeded project; drill-down reaches underlying rows | Integration | 9 |
| Deviation 1 | Worked example (52% expense, 40% progress → +12%, WARNING) reproduces exactly | Unit | 10 |
| Deviation 1 | Threshold boundary: exactly 10.0% does not warn (strict `>`), 10.01% does | Unit | 10 |
| Deviation 1 | Zero-baseline and zero-progress edge cases display correctly (no divide-by-zero, no false 0%) | Unit | 10 |
| Deviation 1 | Threshold `>10%` is a hardcoded constant, not editable via any ConfigThreshold/admin UI | Unit | 10 |
| Deviation 2 | Worked example (60% expense, 45% progress, 7% stock → +8%, WARNING) reproduces exactly, once stock valuation is confirmed | Unit | 12 |
| Deviation 2 | Threshold boundary: exactly 5.0% warns (inclusive `≥`); `≥5%` is a hardcoded constant, not editable | Unit | 12 |
| Deviation 2 | No double counting: a unit of material already `Used` (validated into Progress %) is excluded from Stock % in the same period | Unit | 12 |
| Import | PARSE→NORMALIZE→VALIDATE→PREVIEW→COMMIT with a mixed file (valid/new/error rows) produces correct counts at each stage | Integration | 8 |
| Import | Re-importing the same batch is idempotent (no duplicate AccountingExpenseEntry rows) | Integration | 8 |
| Import | Unmatched project code is never auto-assigned; surfaces for manual resolution | Integration | 8 |
| Notifications | Each event in the [NOTIFICATION_LOGIC.md](NOTIFICATION_LOGIC.md) map produces exactly one notification to the correct recipient, including dual-approval and QS-validation-due events | Integration | 13 |
| Notifications | Stale-approval reminder fires after the configured threshold and not before | Integration | 13 |
| Reconciliation (UAT) | Full seeded scenario: baseline → addendum (dual-approved) → PR → multiple POs from one PR → payment (pre-invoice) → delivery → progress (SPV→PPIC→QS) → stock reconciliation → dashboard, all totals tie out to hand-calculated expected values | End-to-end | 14 |
| Performance | Dashboard and list views issue a bounded, small number of queries regardless of row count (no N+1) under a seeded large dataset | Integration | 14 |

## Out of Scope for Automated Testing (manual only)

- Visual/UX conformance to [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) — checked manually each day.
- Cross-browser/responsive behavior — manual spot-check, not part of this matrix unless issues are found.
