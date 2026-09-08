# Logistic Stock Logic

Status: PROPOSED. Covers the physical-position data model and movement ledger. The weekly/biweekly comparison against physically-counted stock (the reconciliation workflow) is in the dedicated [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md) — this doc defines what's being compared. Entities in [DATA_MODEL.md](DATA_MODEL.md) §5.

## Financial Position vs. Physical Position — Kept Separate

Confirmed principle: **financial position and physical position are never merged into one figure.**

```
FINANCIAL (see FINANCIAL_LOGIC.md):   Purchase Value (A) — Paid Value (B) — Debt Value (C)
PHYSICAL (this doc):                   Purchased — Delivered — Used — Expected Remaining Stock — Physical Stock
```

Partial payment is never treated as "payment for specific items" (see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md) §No Item-Level Payment Allocation), and conversely, physical quantities are never inferred from payment amounts. The two ladders are computed from entirely separate source data (Payments vs. StockMovements) and are only ever compared side by side (e.g. on the CEO dashboard, or in reconciliation), never collapsed into each other.

## The Five Physical-Position Dimensions

All mathematically derived from `StockMovement` and `PurchaseOrder`/`POItem` — the system determines remaining/undelivered material from the approved material transaction ledger, not from manual entry:

| Dimension | Source | Definition |
|---|---|---|
| **Purchased** | `POItem.quantity` on `ISSUED`+ POs | What has been ordered |
| **Delivered** | `StockMovement` where `sourceType = DELIVERY_RECEIPT`, `direction = IN` | What has physically arrived (site or warehouse) |
| **Used** | `StockMovement` where `sourceType = USAGE`, `direction = OUT` | What has been consumed into installed work |
| **Expected Remaining Stock** | CALCULATED = `Delivered − Used` (net of `ADJUSTMENT`/`TRANSFER` movements) | The system's mathematical prediction of what should be on hand |
| **Physical Stock** | `PhysicalStockCount.reportedQuantity` / `StockValidation.validatedQuantity` | What Logistic actually counts on the ground, weekly/biweekly, QS-validated |

"Expected Remaining Stock" is exactly the `StockBalance` aggregate already defined in [DATA_MODEL.md](DATA_MODEL.md) §5 — same figure, named here to match your terminology. "Physical Stock" is the new counted layer described in [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md).

## Dimensions (location)

Stock is tracked by `project × item × location`. Locations: `SITE`, `WAREHOUSE`, `SUPPLIER` ("with supplier" = committed/ordered but not yet delivered — derived from Purchased minus Delivered on the financial/order thread, not from a physical movement).

## Movements

Every change to `StockBalance` (Expected Remaining Stock) is driven by an immutable `StockMovement` row (`direction: IN | OUT | TRANSFER`, `sourceType`, `sourceId`). `StockBalance` is a materialized/derived aggregate, never edited directly. Sources:

- `DELIVERY_RECEIPT`: goods accepted at a `DeliveryReceipt` post an `IN` movement at `SITE` or `WAREHOUSE` — feeds "Delivered".
- `USAGE`: material consumed into installed work posts an `OUT` movement — feeds "Used". Recorded explicitly by **LOGISTIC**, not auto-inferred from `ProgressSubmission` — QS Formulas describe a materials *plan*, not an actual *consumption* record, and your instructions are explicit that **progress must not be calculated from material consumption** (see [PROGRESS_LOGIC.md](PROGRESS_LOGIC.md)); the same separation applies in reverse — material usage is not auto-derived from progress either. This remains an assumption pending confirmation (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)), not contradicted by your latest decisions but not explicitly settled either.
- `ADJUSTMENT`: manual correction (count correction after investigation, damage, loss), always requires a reason, logged to `AuditLog`. This is where a `StockValidation` investigation outcome gets reflected back into the mathematical ledger, if warranted — see [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md).
- `TRANSFER`: moves quantity between locations (e.g. WAREHOUSE → SITE) — implemented as a paired `OUT`/`IN` at the same `movementDate`.

## "Stock With Supplier"

Represents value that has been ordered/committed but not yet physically received — i.e. it is derived from the financial/order thread (Purchased minus Delivered), not from a physical movement someone recorded. Different in kind from `SITE`/`WAREHOUSE` stock (movement-sourced) and must be clearly labeled as such wherever shown, so it's never confused with counted physical inventory.

## Valuation Methodology — `NEEDS_CONFIRMATION`

Stock value feeds the CEO deviation calculation (`Expense % − (Progress % + Stock %)`), so the valuation/%-conversion method is financially load-bearing and **must not be invented**. Marked `NEEDS_CONFIRMATION` — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

Given the now-confirmed Purchase Value (A) ladder, the cleanest available default is:

1. **PO unit price valuation** (recommended default): `StockBalance.unitValue = POItem.unitPrice` at the time of receipt. Ties directly to the same `purchaseValue` figure already used elsewhere, so "Stock Value" and "Purchase Value" are on a consistent basis. Still needs a costing convention where a single item type carries different unit prices across multiple deliveries — FIFO, weighted average, or last-price (also open).
2. **Weighted-average cost**: rolling weighted-average unit cost per project/item as receipts come in. More accurate, more complex.
3. **Baseline (planning) price valuation**: value stock at the `PlanningLine.unitPrice` it was planned against, keeping all three deviation-formula terms on the same Baseline denominator basis — but requires a reliable PO-item → PlanningLine mapping that isn't always 1:1.

**How "Stock %" is computed once valuation is settled**, structurally:

```
Stock Value (Project) = SUM(validated StockBalance.totalValue across SITE + WAREHOUSE + SUPPLIER locations)
Stock %                = Stock Value / Baseline Allowance (Project total) × 100
```

**No double counting (confirmed requirement):** "Stock" in the deviation formula is Expected/Validated Remaining Stock — i.e. Delivered minus Used. Material that has already been `Used` (consumed into approved, validated progress) is excluded from Stock Value by construction, since it has already moved into the Progress % term instead. A unit of material is never counted in both Progress % and Stock % simultaneously.

Implementation of the deviation warning ([REPORTING_LOGIC.md](REPORTING_LOGIC.md) §Calculation 2) is blocked on this confirmation; other stock features (movements, balances, Surat Jalan validation, reconciliation) are not.
