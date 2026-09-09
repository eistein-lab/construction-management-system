# QS Formula Logic

Status: PROPOSED. Entities defined in [DATA_MODEL.md](DATA_MODEL.md).

## Purpose

QS (Quantity Surveyor) needs to turn "1 unit of a Work" into a priced material/labor breakdown without re-deriving it by hand every time. The `Formula` mechanism is that reusable recipe.

## Hierarchy

```
PricingLibraryItem  (master price list — materials, labor, equipment)
        ↑
FormulaLine  (qty of one PricingLibraryItem needed per 1 output unit of the Formula)
        ↑
Formula  (named recipe, e.g. "1 m² brick wall — standard spec")
        ↑
FormulaApplication  (Formula applied to a specific Work at a specific base quantity)
        ↓
PlanningLine(s)  (generated, one per FormulaLine, feeding the PlanningBaseline)
```

## Pricing Library

`PricingLibraryItem` is the master catalog: code, name, unit, category, `defaultUnitPrice`. Prices are CONFIG data — versioned by effective date (see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Configuration & Effective Dating) so that a price update doesn't retroactively change the value of planning lines generated before the update.

## Formula & FormulaLine

A `Formula` declares what 1 output unit requires: e.g. "1 m² brick wall" = 70 bricks + 0.018 m³ sand + 0.006 m³ cement + 0.5 hr mason labor. Each requirement is a `FormulaLine` (`pricingLibraryItemId`, `qtyPerOutputUnit`, `unit`). A `Formula` is a template — it holds no project data.

## FormulaApplication: Formula → PlanningLine

1. QS selects a `Work`, a `Formula`, and a `baseQuantity` (the Work's planned quantity in the formula's output unit — e.g. 120 m² of wall).
2. QS reviews the generated breakdown (`baseQuantity × qtyPerOutputUnit` for each `FormulaLine`, priced at each `PricingLibraryItem.defaultUnitPrice` **as of application time**) — this is a `DRAFT` `FormulaApplication`, editable/discardable freely.
3. On `COMMIT`, the system creates one `PlanningLine` per `FormulaLine`:
   - `quantity = baseQuantity × qtyPerOutputUnit`
   - `unitPrice` = `PricingLibraryItem.defaultUnitPrice` snapshotted at commit time (never recalculated later even if the library price changes)
   - `source = QS_FORMULA`, `formulaApplicationId` = this application's id
4. A committed `FormulaApplication` is immutable. To change the breakdown (different formula, different base quantity), QS either edits the still-DRAFT `PlanningBaseline` lines directly (with the formula linkage preserved for traceability) or creates a new application and removes/zeroes the old lines — both paths only available while the baseline is still `DRAFT`.

## Traceability

Every `PlanningLine` with `source = QS_FORMULA` can always answer: which Formula, which FormulaApplication, what base quantity, and (via `PricingLibraryItem`) what price was assumed. This is what lets the CEO dashboard or an audit trace a baseline number back to its formula origin instead of trusting a bare figure.

## Manual Override Behavior

A QS or PM user can hand-adjust a generated `PlanningLine`'s quantity or price before the baseline is submitted (site conditions differ from the standard recipe). The line keeps its `formulaApplicationId` link — the UI shows it as "Formula: 1 m² brick wall (adjusted from formula-generated 120 → 115)" rather than silently presenting it as a fresh manual entry. Once the baseline is `APPROVED`, the same rule as any other `PlanningLine` applies: changes only via `BaselineAddendum` (see [PPIC_LOGIC.md](PPIC_LOGIC.md)).

## How QS Quantities Become PPIC Planning Quantities

There is exactly one path: `FormulaApplication.COMMIT` writes `PlanningLine` rows directly into the currently-DRAFT `PlanningBaseline` for the target `Work`. There is no separate "QS quantity" that then needs a second reconciliation step into PPIC — the generated `PlanningLine` **is** the PPIC planning quantity from the moment it's created. This avoids two systems of record disagreeing.
