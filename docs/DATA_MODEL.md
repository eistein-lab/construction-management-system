# Data Model

Status: PROPOSED — pending Phase 0 approval. This is the single source of truth for entity names used across every other doc. If an entity name changes here, update all referencing docs in the same change.

Conventions:
- All monetary fields are in **IDR** (assumption — see [DECISIONS.md](DECISIONS.md) D-002), stored as integer minor-units-free Rupiah (no decimals) unless confirmed otherwise.
- Every table has `id` (uuid), `createdAt`, `updatedAt`, `createdById`. Tables that can be edited after creation also carry `updatedById`. These audit columns are omitted below for brevity except where a table needs more (e.g. `approvedById`).
- "RAW" = captured as entered. "NORMALIZED" = cleaned/mapped on import. "CALCULATED" = derived, never directly editable. "OVERRIDE" = a calculated value a user may manually replace, with the override reason stored. "CONFIG" = admin-managed setting, not project data.

## 1. Identity & Access

### User
`id, name, email (unique), passwordHash, role (Role enum), isActive, phone`

### Role (enum)
`CEO, FINANCE, PM, PURCHASING, ACCOUNTING, LOGISTIC, SPV, QS, ADMIN`
See [USER_ROLES.md](USER_ROLES.md). `ADMIN` is an added technical role (NEEDS_CONFIRMATION — see OPEN_QUESTIONS Q-01) for user/config management; it is not one of the 8 business roles you listed. **`PM` (Project Manager) corrected 2026-09-09** — "PPIC" is not a role, it's the name of the baseline/budgeting process itself; the role was renamed from the earlier `PPIC` value. See [DECISIONS.md](DECISIONS.md) D-012.

### ProjectAssignment
`id, projectId, userId, role (Role enum at time of assignment)` — scopes which projects a non-CEO/non-ADMIN user can see. CEO and ADMIN implicitly see all projects.

## 2. Project Structure (PPIC)

### Project
`id, code (unique), name, client, location, status (PLANNING | KICKED_OFF | ON_HOLD | COMPLETED | CANCELLED), startDate, targetEndDate, kickoffDate (nullable)`

### SubPhase
`id, projectId, name, sequence` — e.g. "Structure", "Finishing", "MEP".

### Work
`id, subPhaseId, name, unit, sequence` — the lowest planning/progress-tracking node. QS formulas and SPV progress both attach at this level (see [PPIC_LOGIC.md](PPIC_LOGIC.md)).

### PlanningBaseline
`id, projectId, version (int, 1 = original), status (DRAFT | SUBMITTED | APPROVED | SUPERSEDED), isOriginal (bool), approvedById, approvedAt, notes`
CALCULATED total value/qty are rollups of its PlanningLines. Only one baseline per project has status `APPROVED` at a time for "current" purposes, but `version 1` with `isOriginal=true` is never deleted or edited once approved — see [PPIC_LOGIC.md](PPIC_LOGIC.md) §Baseline History. Approver: **CEO** (see [USER_ROLES.md](USER_ROLES.md) §Approval Structure).

### PlanningLine
`id, baselineId, workId, itemDescription, unit, quantity, unitPrice, totalValue (CALCULATED = quantity × unitPrice), source (QS_FORMULA | MANUAL), formulaApplicationId (nullable), sequence`

### BaselineAddendum
`id, projectId, baselineId (the baseline it amends), reason, status (DRAFT | SUBMITTED | APPROVED | REJECTED), financeApprovedById, financeApprovedAt, ceoApprovedById, ceoApprovedAt`
Represents a post-kickoff change. Contains one or more `AddendumLine` rows (same shape as PlanningLine, plus `changeType: ADD | INCREASE | DECREASE | REMOVE` and `planningLineId` when modifying an existing line). Addenda are never merged invisibly into the original baseline — they remain a separately queryable, separately auditable layer. "Current approved scope" for a Work = original baseline lines + all APPROVED addendum lines affecting it. **Approval is dual: both CEO and FINANCE must sign off** (`financeApprovedAt` and `ceoApprovedAt` both set) before status becomes `APPROVED`; either one rejecting sets status to `REJECTED`. See [PPIC_LOGIC.md](PPIC_LOGIC.md) and [USER_ROLES.md](USER_ROLES.md) §Approval Structure.

### Kickoff (project-level)
`id, projectId, baselineId, approvedById, approvedAt` — one row per project, created when the **CEO** approves the baseline for execution. Its existence is what flips `Project.status` to `KICKED_OFF` and locks `PlanningBaseline` (version 1) from further edits. This is the one-time, whole-project event — it does **not** by itself unlock spending; it only unlocks the ability to request kickoff on individual Sub-Phases, below.

### SubPhaseKickoff (NEW, added 2026-09-09 — see [DECISIONS.md](DECISIONS.md) D-013)
`id, subPhaseId, requestedById, requestedAt, plannedStartDate, plannedEndDate, status (REQUESTED | APPROVED | REJECTED), approvedById, approvedAt, rejectionReason`
Real construction projects mobilize phase by phase — Foundation kicks off before Column & Beam, which kicks off before Finishing, etc. — not all at once. Only requestable once the project-level `Kickoff` above exists. **PM** requests it per `SubPhase` (with planned start/end dates); **CEO** approves or rejects (rejection requires a reason, per [BUSINESS_RULES.md](BUSINESS_RULES.md) §Approval & Rejection). **Only an APPROVED `SubPhaseKickoff` unlocks `PurchaseRequest` creation against Works within that SubPhase** — see [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md). A rejected request can be resubmitted — this creates a new row; the rejected one is never overwritten, consistent with [BUSINESS_RULES.md](BUSINESS_RULES.md) §Historical Integrity. `SubPhase.currentKickoffStatus` (CALCULATED, mirrors the latest row's status, defaults to "NOT_REQUESTED" when no row exists yet) is a read convenience, not a second source of truth. Slated for Day 4 alongside project-level Kickoff — not built yet.

## 3. QS Formula (Pricing Library)

### PricingLibraryItem
`id, code (unique), name, unit, category, defaultUnitPrice (CONFIG, versionable — see BUSINESS_RULES §Config Effective Dating), isActive`

### Formula
`id, name, category, outputUnit, description, isActive` — a reusable "recipe", e.g. "1 m² brick wall (standard)".

### FormulaLine
`id, formulaId, pricingLibraryItemId, qtyPerOutputUnit, unit` — e.g. for 1 m² of wall: 70 bricks, 0.02 m³ mortar sand, etc.

### FormulaApplication
`id, workId, formulaId, baseQuantity (the Work's planned qty this formula is applied to), appliedById, appliedAt, status (DRAFT | COMMITTED)`
On COMMIT, generates one `PlanningLine` per `FormulaLine` (qty = `baseQuantity × qtyPerOutputUnit`, unitPrice = `PricingLibraryItem.defaultUnitPrice` at commit time, source=`QS_FORMULA`, `formulaApplicationId` set for traceability). A committed FormulaApplication is immutable; changing quantities requires a new application or a manual `PlanningLine` override (with override reason recorded) — see [QS_FORMULA_LOGIC.md](QS_FORMULA_LOGIC.md).

## 4. Procurement

**Confirmed structural rule: `Project → PurchaseRequest → 1:N PurchaseOrder`. A PR is always project-specific and may contain many items. A PR may generate multiple POs (e.g. split across suppliers). A PO belongs to exactly one PR and can never combine items from more than one PR.** This supersedes the earlier multi-PR-consolidation assumption — see [DECISIONS.md](DECISIONS.md) D-005 (supersedes A-03).

### PurchaseRequest (PR)
`id, projectId, prNumber (unique, sequential), requestedById, status (DRAFT | SUBMITTED | APPROVED | REJECTED | CLOSED), submittedAt, approvedById, approvedAt, notes`
Approver: **FINANCE**; **CEO** co-approves only when the PR's value/variance exceeds the configured purchasing ceiling (see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Purchasing Ceiling).

### PRItem
`id, prId, workId, planningLineId (nullable — link to the baseline/addendum line this draws against), itemDescription, unit, quantity, estimatedUnitPrice, estimatedTotal (CALCULATED)`
`varianceSnapshot` (CALCULATED, frozen at submission time) — see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Variance Methodology for the shared formula.

### Supplier
`id, name, contactName, phone, email, address, paymentTermsDays, isActive`

### PurchaseOrder (PO)
`id, poNumber (unique), projectId, prId (required — the single parent PR; never nullable, never spans more than one PR), supplierId, status (DRAFT | ISSUED | PARTIALLY_RECEIVED | COMPLETED | CANCELLED), issuedById, issuedAt`
Approver: **FINANCE**; **CEO** co-approves only when over the purchasing ceiling. CALCULATED financial ladder (see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md) §Purchase / Paid / Debt):
- `purchaseValue` (A) = `SUM(POItem.totalValue)`
- `paidValue` (B) = `SUM(Payment.amount)` where `Payment.poId` = this PO
- `debtValue` (C) = `purchaseValue − paidValue`

### POItem
`id, poId, prItemId (nullable — normally set, since every item on a PO should trace back to an item on its one parent PR; null is an explicit exception flagged for review, not a supported default path), itemDescription, unit, quantity, unitPrice, totalValue (CALCULATED)`

### Invoice
`id, invoiceNumber, poId (required), supplierId, invoiceDate, dueDate, amount, receivedAt, notes`
A supporting/reference document only — **it does not gate Payment and carries no payment-status field of its own.** What suppliers have billed (INVOICED) is tracked here for reference and reconciliation; the authoritative Purchase/Paid/Debt figures live on the `PurchaseOrder`, independent of whether an Invoice has even been recorded yet. Recorded/owned by **FINANCE**.

### Payment
`id, poId (required), amount, paymentDate, method, reference, paidById, invoiceId (nullable — optional reconciliation link only, never required or gating)`
**Confirmed: Payment attaches to the PO as a single amount — there is no item-level payment allocation.** A Payment can be recorded with zero Invoices and zero Deliveries yet existing for its PO ("Rp500,000 paid against PO PO-0142"). See [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md) §Payment / Invoice / Delivery Independence. Approver: **FINANCE**; **CEO** co-approves only when over the purchasing ceiling.

## 5. Delivery & Stock

### SuratJalan (Delivery Note)
`id, sjNumber, poId, supplierId, deliveryDate, status (PENDING_RECEIVING | VALIDATED | DISCREPANCY | REJECTED)`

### SuratJalanItem
`id, suratJalanId, poItemId, deliveredQty`

### DeliveryReceipt (Goods Receipt)
`id, suratJalanId, receivedById, receivedAt, notes`

### DeliveryReceiptItem
`id, deliveryReceiptId, suratJalanItemId, acceptedQty, discrepancyType (nullable: WRONG_PO | WRONG_SUPPLIER | DUPLICATE_SJ | UNEXPECTED_ITEM | UNDER_DELIVERY | OVER_DELIVERY), discrepancyNotes`
Validation rules generating `discrepancyType` are in [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md) §Surat Jalan Validation. Owner: **LOGISTIC**.

### StockMovement
`id, projectId, poItemId, location (SITE | WAREHOUSE | SUPPLIER), direction (IN | OUT | TRANSFER), quantity, movementDate, sourceType (DELIVERY_RECEIPT | USAGE | ADJUSTMENT | TRANSFER), sourceId`
The mathematical/ledger source for the four physical-position dimensions in [STOCK_LOGIC.md](STOCK_LOGIC.md): Purchased (from PO), Delivered (`DELIVERY_RECEIPT` IN movements), Used (`USAGE` OUT movements), Expected Remaining Stock (CALCULATED rollup, below).

### StockBalance ("Expected Stock" — CALCULATED, materialized view or on-read aggregate)
`projectId, poItemId, location, quantityOnHand, unitValue (CALCULATED — see STOCK_LOGIC.md §Valuation), totalValue`
This is the **mathematical baseline** layer — always derived from `StockMovement`, never entered directly. Compared weekly/biweekly against the physically-counted layer below; see [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md).

### PhysicalStockCount (NEW — Logistic's periodic physical count)
`id, projectId, poItemId, location, reportedQuantity, periodStart, periodEnd, reportedById, reportedAt, notes`
Owner: **LOGISTIC**, submitted weekly/biweekly. This is RAW, as-counted data — never adjusted in place (see `StockValidation` below).

### StockValidation (NEW — QS's periodic reconciliation)
`id, physicalStockCountId, expectedQuantity (CALCULATED snapshot of StockBalance as of the count date), varianceQuantity (CALCULATED = reportedQuantity − expectedQuantity), variancePercent (CALCULATED), thresholdExceeded (CALCULATED bool, see ConfigThreshold key `STOCK_VARIANCE_THRESHOLD_PCT`), validatedQuantity (QS's confirmed/official figure — defaults to `reportedQuantity`, may be adjusted after investigation), status (PENDING | VALIDATED | FLAGGED_FOR_INVESTIGATION | RESOLVED), validatedById, validatedAt, investigationNotes`
Owner: **QS**, weekly/biweekly. **CEO-level calculations always read `validatedQuantity`/the validated stock position, never the raw `reportedQuantity` directly.** Both the reported and validated values are preserved — validation never overwrites the original report. See [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md) for the full comparison workflow. A flagged discrepancy is never auto-labeled as theft or loss — `status = FLAGGED_FOR_INVESTIGATION` is a neutral trigger for manual investigation; `investigationNotes` records the outcome once resolved.

## 6. Progress

### ProgressSubmission
`id, workId, projectId, submittedById, submissionDate, completedQtyCumulative, evidenceFiles[], status (SUBMITTED | APPROVED | REJECTED), approvedById, approvedAt, rejectionReason`
Submitted by **SPV** at the Work level (physical completion only — **never** derived from material consumption, see [PROGRESS_LOGIC.md](PROGRESS_LOGIC.md)). Approver: **PM (Project Manager)** — "Progress → Project Manager" per your confirmed approval structure. Only `APPROVED` submissions count toward `Work.progressPercent`.

### ProgressCorrection
`id, originalSubmissionId, correctedById, reason, previousQty, correctedQty, approvedById, approvedAt`
Corrections never mutate history in place — they are a new linked row so the original submitted value stays auditable.

### ProgressValidation (NEW — QS's periodic validation)
`id, workId, periodStart, periodEnd, reportedProgressPercent (CALCULATED snapshot of Work.progressPercent as of period end, from approved submissions), validatedProgressPercent (QS's confirmed/official figure — defaults to reported, may be adjusted), validatedById, validatedAt, notes`
Owner: **QS**, weekly/biweekly — "Progress Validation → QS weekly/biweekly". **CEO dashboard's Progress % always reads the latest `validatedProgressPercent` per Work** (rolled up project-wide per [PROGRESS_LOGIC.md](PROGRESS_LOGIC.md) §Project-Level Rollup), not the raw PM-approved running total directly — mirroring the same reported-vs-validated pattern as stock.

## 7. Accounting

### AccountingExpenseEntry
`id, projectId, category, description, amount, expenseDate, source (IMPORTED | MANUAL), importBatchId (nullable), matchedInvoiceId (nullable), matchedPOId (nullable)`
This is the "actual" EXPENSED figure used in CEO deviation (`Expense % = Accounting Actual Expense / Approved Project Baseline × 100`) — distinct from PAID and DEBT (see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md)).

### ImportBatch
`id, source (e.g. "Accounting Export"), fileName, uploadedById, status (PREVIEW | COMMITTED | FAILED | DISCARDED), mappingConfigJson, totalRows, matchedRows, unmatchedRows, committedAt`

### ImportRow (RAW, kept for audit even after commit)
`id, importBatchId, rawDataJson, normalizedDataJson (nullable), validationErrors[], matchStatus (MATCHED | NEW | ERROR), resultingEntryId (nullable)`

## 8. Config (CONFIG — admin-managed, effective-dated)

### ConfigThreshold
`id, key, value, effectiveFrom, effectiveTo (nullable), setById`
Keys:
- `PURCHASING_CEILING_PCT` — the purchasing approval ceiling, a **percentage**, configurable by **CEO or FINANCE** only (per your confirmed decision — not ADMIN, not hardcoded). See [BUSINESS_RULES.md](BUSINESS_RULES.md) §Purchasing Ceiling.
- `STOCK_VARIANCE_THRESHOLD_PCT` — the discrepancy-flagging threshold for stock reconciliation. Value is `NEEDS_CONFIRMATION` (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)); settable by CEO/FINANCE/ADMIN (assumption, not explicitly assigned — see [DECISIONS.md](DECISIONS.md)).

**The CEO deviation thresholds (`>10%` for Deviation 1, `≥5%` for Deviation 2) are NOT `ConfigThreshold` rows.** Per your explicit instruction not to change them, they are fixed constants in the calculation layer, not admin-editable — see [DECISIONS.md](DECISIONS.md) D-008.

See [BUSINESS_RULES.md](BUSINESS_RULES.md) §Configuration & Effective Dating for how a mid-project threshold change affects historical reports.

## 9. Notifications & Audit

### Notification
`id, userId, type, refEntityType, refEntityId, message, isRead, createdAt`

### AuditLog
`id, entityType, entityId, action, actorId, beforeJson, afterJson, createdAt`
Written for every state-changing action on: PlanningBaseline, BaselineAddendum, Kickoff, PurchaseRequest, PurchaseOrder, Invoice, Payment, DeliveryReceipt, ProgressSubmission, ProgressValidation, PhysicalStockCount, StockValidation, ConfigThreshold. Not optional — this is what makes the CEO dashboard's drill-down and the financial-safety guarantees in your instructions verifiable after the fact.

## 10. Cross-cutting relationship diagram (textual)

```
Project → SubPhase → Work
Work → PlanningLine (via PlanningBaseline, optionally via FormulaApplication)
Work → BaselineAddendum lines (post-kickoff, CEO+FINANCE dual-approved)
Work → ProgressSubmission (SPV, PM-approved) → ProgressValidation (QS, weekly/biweekly) → Work.progressPercent (as CEO sees it)
Project → Kickoff (CEO, one-time) → SubPhase → SubPhaseKickoff (PM requests, CEO approves, per Sub-Phase) → unlocks PurchaseRequest for that Sub-Phase's Works
PlanningLine ← PRItem (reference for variance) ← PurchaseRequest (project-specific, FINANCE-approved)
PurchaseRequest → 1:N PurchaseOrder (each PO belongs to exactly one PR) → Supplier
PurchaseOrder → purchaseValue/paidValue/debtValue (A/B/C ladder)
PurchaseOrder → Invoice (reference only, FINANCE-recorded)
PurchaseOrder → Payment (FINANCE-approved, single amount, no item allocation, independent of Invoice/Delivery)
PurchaseOrder → SuratJalan → DeliveryReceipt → StockMovement → StockBalance ("Expected Stock")
StockBalance ⨉ PhysicalStockCount (LOGISTIC, weekly/biweekly) → StockValidation (QS) → validated stock (as CEO sees it)
AccountingExpenseEntry → Project (its own source of truth for "Expensed")
Project → CEO Dashboard: rolls up Baseline, PR, PO (Purchase/Paid/Debt), Invoiced, Expensed, validated Progress %, validated Stock %
```
