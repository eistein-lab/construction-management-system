# Stock Reconciliation

Status: PROPOSED — new document, created per your instruction to have a dedicated reconciliation doc. Entities: `PhysicalStockCount`, `StockValidation` — see [DATA_MODEL.md](DATA_MODEL.md) §5. Builds on the physical-position dimensions in [STOCK_LOGIC.md](STOCK_LOGIC.md).

## Purpose

Detect discrepancies between what the system mathematically expects is on hand and what is actually counted on the ground — for investigation, not accusation. Discrepancies can come from recording errors, damage, loss, or (rarely) theft; the system's job is to surface the number and let a human investigate, never to label a cause automatically.

## Two Layers

### A. Mathematical Baseline — Expected Stock

Calculated entirely from the `StockMovement` ledger, as defined in [STOCK_LOGIC.md](STOCK_LOGIC.md):

```
Expected Stock (per project × item × location) = Delivered − Used  (net of Adjustments/Transfers)
```

This is the `StockBalance` aggregate. It is never entered by a person — it is always a live derivation from movements.

### B. Physical Validation — Logistic's Weekly/Biweekly Count

**LOGISTIC** submits a `PhysicalStockCount` on a weekly or biweekly cadence: `reportedQuantity` per project × item × location, for the period. This is RAW, as-counted data, kept exactly as submitted — never silently overwritten by a later correction (see §Historical Retention below).

## The Comparison (per PhysicalStockCount, computed at submission)

```
expectedQuantity   = StockBalance.quantityOnHand as of the count date (snapshotted onto the StockValidation record)
varianceQuantity   = reportedQuantity − expectedQuantity
variancePercent    = varianceQuantity / expectedQuantity × 100
                     (if expectedQuantity = 0: display "No expected baseline" rather than divide by zero;
                      if reportedQuantity > 0 in this case, flag for review regardless of percent)
thresholdExceeded  = |variancePercent| ≥ ConfigThreshold(STOCK_VARIANCE_THRESHOLD_PCT)
```

- The exact threshold value is `NEEDS_CONFIRMATION` — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md). A commonly-used starting point for inventory count materiality is in the low single digits (e.g. 2–3%); this is a recommendation, not a decision.
- Both **quantity** and **percent** variance are always shown together — a small percent on a high-value item can matter more than a large percent on a low-value one, so neither figure alone is treated as sufficient context on the dashboard.

## Step B → QS Validation (Step 6 of your instructions)

**QS** reviews each `PhysicalStockCount` weekly/biweekly and produces a `StockValidation`:

- `status = VALIDATED` if within threshold (or if a discrepancy was investigated and explained) — `validatedQuantity` defaults to `reportedQuantity`.
- `status = FLAGGED_FOR_INVESTIGATION` if `thresholdExceeded` and not yet explained. **Never auto-labeled as theft, loss, or any specific cause** — the status name and any UI copy stay neutral ("flagged for investigation"), and a free-text `investigationNotes` field records whatever the human investigation finds once resolved (`status → RESOLVED`).
- QS may set `validatedQuantity` different from `reportedQuantity` if the investigation determines the physical count itself was wrong (miscount, missed location) — in which case both the original `reportedQuantity` and the QS-adjusted `validatedQuantity` remain visible, side by side, permanently. If the investigation instead confirms real loss/damage, the correction flows into the mathematical ledger as a `StockMovement` (`sourceType = ADJUSTMENT`) with a reason, which is what changes future `Expected Stock` — the `StockValidation` record itself is never used to silently rewrite past ledger entries.

## CEO-Level Calculations Use Validated Stock

Per your explicit instruction: **CEO-level calculations (including the Stock % term in Deviation Calculation 2) always read the latest `StockValidation.validatedQuantity`/value, never the raw `PhysicalStockCount.reportedQuantity` directly**, and never the pure mathematical `StockBalance` figure alone once a physical count has been validated for that period. Before the first validation of a period, the mathematical `StockBalance` is used as a provisional figure (clearly labeled "unvalidated" on the dashboard).

## Preserve Reported Value and Validated/Official Value

Both `PhysicalStockCount.reportedQuantity` (what Logistic actually counted) and `StockValidation.validatedQuantity` (QS's confirmed/official figure) are stored permanently, on separate rows, neither overwriting the other. This is required so that later audit can always answer both "what did Logistic report on {date}" and "what did QS certify as official."

## Historical Retention

Every `PhysicalStockCount` and its corresponding `StockValidation` is kept indefinitely, queryable by project/item/location/period — this is what lets a trend of recurring small discrepancies on one item/location become visible over time, even if any single week's variance is below the flagging threshold.

## What Remains Open

- Exact `STOCK_VARIANCE_THRESHOLD_PCT` value — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- Exact stock valuation methodology (quantity → value → Stock % conversion) — see [STOCK_LOGIC.md](STOCK_LOGIC.md) §Valuation Methodology and [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- Whether `USAGE` movements (the "Used" dimension feeding Expected Stock) are recorded explicitly by LOGISTIC or need a different mechanism — see [STOCK_LOGIC.md](STOCK_LOGIC.md) and [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
