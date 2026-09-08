# 14-Day Implementation Plan

Status: PROPOSED. Sequencing follows your original day structure; Priority 1 (per [PRODUCT_SPEC.md](PRODUCT_SPEC.md)) is protected — if a day runs over, Priority 3 (Day 13) is what gets trimmed first. Revised for the confirmed Payment/Invoice/Delivery independence, PR:PO 1:N structure, Purchase/Paid/Debt ladder, Finance-led approval chain, and the QS weekly/biweekly validation layer for Progress and Stock.

Each day ends with the Daily Completion Report format from your instructions, and requires your explicit approval before the next day starts. Nothing below begins until Phase 0 itself is approved.

## Pre-Day-1 Blockers

- Git repository initialization + GitHub remote — none exists yet (see [RISKS.md](RISKS.md) R-01).
- Vercel project + PostgreSQL provider choice ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-20).
- Confirm company name/branding ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-21).

## Day 1 — Foundation

**Deliverables**: Next.js/TS/Tailwind/shadcn project scaffold; Prisma schema for Identity & Access + Project Structure ([DATA_MODEL.md](DATA_MODEL.md) §1–2); NextAuth credentials auth; server-side role-based route guards for all 9 roles; seed script (roles + a first ADMIN/CEO user); live Vercel deployment.
**Exit criteria**: login works per role; empty Project/SubPhase/Work CRUD behind role checks; reachable at a live Vercel URL.

## Day 2 — PPIC Baseline

**Deliverables**: `PlanningBaseline`, `PlanningLine` tables; baseline DRAFT→SUBMITTED→APPROVED UI and API; baseline versioning + `isOriginal` guarantee; CEO approval action.
**Exit criteria**: PPIC can build and submit a baseline; CEO can approve/reject; an approved baseline is immutable pre-kickoff-revision rules enforced.

## Day 3 — QS Formula

**Deliverables**: `PricingLibraryItem`, `Formula`, `FormulaLine`, `FormulaApplication` tables + UI; commit flow generating `PlanningLine`s with full traceability.
**Exit criteria**: QS can define a formula, apply it to a Work at a base quantity, commit it, and see the generated lines appear in the DRAFT baseline.

## Day 4 — Kickoff Approval

**Deliverables**: `Kickoff` entity + trigger action; baseline lock enforcement; `BaselineAddendum` DRAFT/SUBMIT/dual-APPROVE (CEO + FINANCE) lifecycle.
**Exit criteria**: kicking off a project locks baseline v1 permanently; an addendum can be created and requires **both** CEO and FINANCE approval before taking effect (either rejecting returns it to `REJECTED`); "current approved scope" updates correctly without touching original rows.

## Day 5 — Purchase Request + Variance

**Deliverables**: `PurchaseRequest`/`PRItem` tables + UI; shared variance calculation function in the calculation layer ([BUSINESS_RULES.md](BUSINESS_RULES.md)); PR submit/approve/reject flow with **FINANCE as approver** and **CEO co-approval when over the configured purchasing ceiling %** (default escalation behavior: hard block until CEO co-signs — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-C).
**Exit criteria**: submitting a PR shows correct baseline-allowance/remaining-allowance/variance figures; approval routes to FINANCE, with CEO escalation firing correctly above the ceiling.

## Day 6 — Purchase Order + Purchasing Ceiling

**Deliverables**: `Supplier`, `PurchaseOrder`/`POItem` tables + UI; PR→PO conversion **enforcing exactly one parent PR per PO** (no cross-PR consolidation); PO-stage variance re-check against that PR's allocation; `PURCHASING_CEILING_PCT` as a CEO/FINANCE-editable `ConfigThreshold`.
**Exit criteria**: an approved PR can generate one or more POs; each PO traces to exactly one PR; attempting to add an item from a different PR to an existing PO is rejected; PO variance and ceiling routing reuse the Day 5 shared function, not a reimplementation.

## Day 7 — Invoice + Supplier Payment

**Deliverables**: `Invoice` (reference-only, no payment-status field) and `Payment` (attaches to `PurchaseOrder` directly, single amount, no item-level allocation) tables + UI; Purchase Value (A) / Paid Value (B) / Debt Value (C) computed and displayed per PO; FINANCE approval on Payment, CEO co-approval over ceiling.
**Exit criteria**: a Payment can be saved against a PO with zero Invoices and zero Deliveries recorded, in any order, with no validation error; the worked example (Purchase Rp100M, Paid Rp60M → Debt Rp40M) reproduces exactly.
**Depends on** tax/PPN confirmation ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-09) if amount handling needs a tax field — if unresolved, ships with `amount` as gross, flagged as a known gap.

## Day 8 — Accounting Expense

**Deliverables**: `AccountingExpenseEntry` (manual entry first); project financial summary view showing Baseline / Purchase Value (A) / Paid Value (B) / Debt Value (C) / Invoiced (reference) / Expensed, all independently sourced.
**Exit criteria**: all six figures are independently visible and correct for a test project; none is derived from another; Debt Value always equals Purchase Value minus Paid Value regardless of Invoice/Expense state.

## Day 9 — CEO Dashboard

**Deliverables**: dashboard shell — per-project and portfolio views of Baseline/Addenda/PR/Purchase-Paid-Debt/Invoiced/Expensed/Progress %/Stock %, drill-down to underlying rows; purchasing-ceiling action-item list.
**Exit criteria**: CEO can see every required figure for at least one seeded project and drill into any total.

## Day 10 — Expense vs. Progress Deviation (Calculation 1)

**Deliverables**: Deviation 1 formula (`Expense % − Progress %`), fixed threshold `>10%` (hardcoded, not a `ConfigThreshold` — see [DECISIONS.md](DECISIONS.md) D-008), warning display.
**Exit criteria**: the worked example (Expense 52%, Progress 40% → +12% WARNING) reproduces exactly in a seeded test project. Progress % source note: full correctness depends on Day 11's QS-validated progress; Day 10 ships against provisional (PPIC-approved, pre-validation) progress and is upgraded automatically once Day 11's validation layer exists — flagged, not silently reordered.

## Day 11 — SPV Progress + QS Weekly/Biweekly Validation

**Deliverables**: `ProgressSubmission`, `ProgressCorrection` tables + SPV submission UI; PPIC (Project Manager) approval flow; `ProgressValidation` table + QS weekly/biweekly validation UI; value-weighted (by approved budget) project-level rollup.
**Exit criteria**: SPV submits progress with evidence; only PPIC-approved submissions move the provisional `progressPercent`; QS validation produces the official validated figure; Day 10's dashboard now reads the validated figure, not the raw provisional one.

## Day 12 — Stock, Surat Jalan, Delivery, Reconciliation, Stock-Adjusted Deviation (Calculation 2)

**Deliverables**: `StockMovement`/`StockBalance` ("Expected Stock"), `SuratJalan`/`DeliveryReceipt` (physical thread, independent of Payment); `PhysicalStockCount` (LOGISTIC weekly/biweekly) and `StockValidation` (QS weekly/biweekly) per [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md); Expected-vs-Physical variance calculation and neutral (never "theft") threshold flagging; Deviation 2 formula wired to validated Stock %, **blocked on your confirmation of stock valuation methodology** ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-B) and the variance threshold value (Q-A).
**Exit criteria**: Purchased/Delivered/Used/Expected Remaining Stock/Physical Stock all independently correct for a seeded project; Surat Jalan validation discrepancy types all trigger correctly; if Q-A/Q-B are confirmed by this day, the worked example (Expense 60%, Progress 45%, Stock 7% → +8% WARNING) reproduces exactly. If not confirmed, everything except Deviation 2 itself ships, and Deviation 2 is reported `BLOCKED`, not guessed at.

## Day 13 — Notifications + Reminders

**Deliverables**: `Notification` generation per the [NOTIFICATION_LOGIC.md](NOTIFICATION_LOGIC.md) event map (including the new dual-approval and QS-validation-due events); in-app bell/list UI; stale-approval reminders.
**Exit criteria**: each mapped event produces the correct notification to the correct role/user in a seeded run-through.

## Day 14 — Full UAT + Reconciliation + Production Hardening

**Deliverables**: end-to-end seeded walkthrough of [WORKFLOWS.md](WORKFLOWS.md); reconciliation check (Baseline vs. PR vs. PO vs. Purchase/Paid/Debt vs. Expensed totals tie out); review of all remaining `NEEDS_CONFIRMATION` items and their real impact; performance pass (no N+1, pagination in place); final production smoke test.
**Exit criteria**: full scenario from planning through kickoff, procurement (PR→PO→Payment independent of Invoice/Delivery), delivery, progress (SPV→PPIC→QS validation), stock reconciliation, and CEO dashboard deviation — no data-consistency gaps — on the live production URL.

## Sequencing Flexibility

Exact day order may shift if a real dependency demands it (flagged explicitly for Day 10/11), but Priority 1 scope is never dropped in favor of Priority 2/3 content running late.
