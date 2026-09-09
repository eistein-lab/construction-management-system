# Workflows

Status: PROPOSED. This is the cross-module process view; each step's detailed rules live in its dedicated doc. Revised for the confirmed approval structure, PR:PO cardinality, Payment/Invoice/Delivery independence, and the stock/progress validation layers.

## 1. Planning → Kickoff

```
QS builds Pricing Library + Formulas
        ↓
PM creates Project → SubPhase → Work
        ↓
QS applies Formula to Work (FormulaApplication) → generates PlanningLine(s)
   (PM can also add PlanningLine(s) manually — flagged as "not from formula library")
        ↓
PM assembles PlanningBaseline (DRAFT) → SUBMIT
        ↓
CEO reviews → APPROVE (or REJECT → back to DRAFT)
        ↓
CEO triggers project-level Kickoff → Project.status = KICKED_OFF, baseline v1 locked forever
   (this alone does not unlock spending — see 1b)
```
Detail: [PPIC_LOGIC.md](PPIC_LOGIC.md), [QS_FORMULA_LOGIC.md](QS_FORMULA_LOGIC.md).

## 1b. Sub-Phase Kickoff (per Sub-Phase, repeats as the project progresses)

```
(requires project-level Kickoff above to already exist)
PM requests SubPhaseKickoff for one SubPhase (planned start/end dates)
        ↓
CEO APPROVE (unlocks PurchaseRequest for that Sub-Phase's Works) / REJECT (reason required, PM may resubmit)
```
Detail: [PPIC_LOGIC.md](PPIC_LOGIC.md) §Sub-Phase Kickoff. Not built until Day 4.

## 2. Post-Kickoff Scope Change

```
PM drafts BaselineAddendum (ADD / INCREASE / DECREASE / REMOVE lines) → SUBMIT
        ↓
CEO AND FINANCE both APPROVE (dual — either rejecting → REJECTED)
        ↓
If approved: "current approved scope" = original baseline + all approved addenda
   (used everywhere variance/deviation is calculated — never re-merged into original baseline rows)
```

## 3. Procurement (Financial Thread)

```
(requires the PRItem's Work's SubPhase to have an APPROVED SubPhaseKickoff — see 1b)
PM/PURCHASING creates PurchaseRequest (project-specific, many PRItems, PRItems reference Work/PlanningLine)
        ↓ SUBMIT → variance snapshot frozen
FINANCE APPROVE (or REJECT) — CEO co-approves only if over the purchasing ceiling %
        ↓
PURCHASING creates one or more PurchaseOrders — each PO draws from exactly ONE approved PR, never combines PRs
        ↓ variance re-checked against that PO's single parent PR
FINANCE APPROVE — CEO co-approves only if over ceiling
        ↓ ISSUE → PO becomes the "Purchase Value (A)" commitment
FINANCE records Invoice against PO (reference document only — no payment gate)
        ↓ (unordered relative to the step above)
FINANCE records Payment(s) — single amount directly against the PO, no item-level allocation,
   independent of Invoice and independent of Delivery status
        ↓
Paid Value (B) accumulates → Debt Value (C) = Purchase Value (A) − Paid Value (B), always current
```
Detail: [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md), [BUSINESS_RULES.md](BUSINESS_RULES.md), [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md).

## 4. Delivery (Physical Thread — independent of #3's payment timing)

```
Supplier delivers against PO → LOGISTIC records SuratJalan
        ↓
System validates (PO match, supplier match, duplicate check, qty vs. ordered)
        ↓
LOGISTIC confirms DeliveryReceipt (or flags DISCREPANCY for resolution)
        ↓
StockMovement (IN, "Delivered") posted → Expected Remaining Stock updated
```
Detail: [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md) §Surat Jalan Validation, [STOCK_LOGIC.md](STOCK_LOGIC.md).

## 5. Site Progress (independent of #3 and #4)

```
SPV submits ProgressSubmission for a Work (cumulative completed qty + evidence) — physical completion only,
   never derived from material consumption
        ↓
PM (Project Manager) APPROVE (only approved counts) / REJECT (with reason, SPV re-submits)
        ↓
Work.progressPercent recalculated (provisional/"unvalidated") → rolls up to Project.progressPercent
        ↓
QS validates weekly/biweekly → ProgressValidation.validatedProgressPercent
        ↓
CEO dashboard always reads the latest VALIDATED progress %, not the raw approved running total
```
Detail: [PROGRESS_LOGIC.md](PROGRESS_LOGIC.md).

## 6. Stock Reconciliation (independent of #5)

```
LOGISTIC records material Used (OUT movements) and Delivered (IN movements) → Expected Remaining Stock (mathematical)
        ↓
LOGISTIC submits PhysicalStockCount weekly/biweekly (actual count on the ground)
        ↓
QS validates: compares Expected vs. Physical → Variance Quantity, Variance % → flag if over configured threshold
   (never auto-labeled as theft — neutral "flagged for investigation" status only)
        ↓
StockValidation.validatedQuantity → CEO dashboard always reads this validated figure
```
Detail: [STOCK_LOGIC.md](STOCK_LOGIC.md), [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md).

## 7. Accounting Expense

```
ACCOUNTING imports data (PARSE→NORMALIZE→VALIDATE→PREVIEW→COMMIT) or enters manually
        ↓
AccountingExpenseEntry rows created, linked to Project (and optionally Invoice/PO for traceability)
        ↓
Feeds "Expensed" figure — distinct from Paid Value (B) — into CEO Dashboard's Expense %
```
Detail: [IMPORT_LOGIC.md](IMPORT_LOGIC.md), [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md).

## 8. CEO Oversight (consumes everything above)

```
CEO Dashboard aggregates: Baseline, Addenda, PR, Purchase Value (A), Paid Value (B), Debt Value (C),
   Invoiced (reference), Expensed, validated Progress %, validated Stock %
        ↓
Deviation 1 = Expense % − Progress %                              → WARNING if > 10%  (fixed, not configurable)
Deviation 2 = Expense % − (Progress % + Stock %)                  → WARNING if ≥ 5%   (fixed, not configurable)
        ↓
Purchasing ceiling: any PR/PO/Payment over the configured % surfaced as a pending CEO co-approval action
        ↓
Drill-down into any figure → underlying rows (AuditLog-backed)
```
Detail: [REPORTING_LOGIC.md](REPORTING_LOGIC.md).

## 9. Notifications (cross-cutting, triggered by every transition above)

See [NOTIFICATION_LOGIC.md](NOTIFICATION_LOGIC.md) for the full event map.
