/**
 * Calculation layer — docs/ARCHITECTURE.md §Calculation Layer. Shared by the
 * DRAFT-application preview and the actual COMMIT transaction (src/lib/services/
 * qs-formula.ts) so the previewed breakdown is provably the same math that
 * gets written to PlanningLine — never two formulas that could drift apart.
 */

import { calculateLineTotal, type Numberable } from "./money";

export interface FormulaLineForBreakdown {
  id: string;
  qtyPerOutputUnit: Numberable;
  unit: string;
  pricingLibraryItem: { id: string; name: string; defaultUnitPrice: Numberable };
}

export interface FormulaBreakdownRow {
  formulaLineId: string;
  pricingLibraryItemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

/** baseQuantity × each FormulaLine.qtyPerOutputUnit, priced at current PricingLibraryItem prices — docs/QS_FORMULA_LOGIC.md §FormulaApplication. */
export function calculateFormulaBreakdown(
  lines: FormulaLineForBreakdown[],
  baseQuantity: number
): FormulaBreakdownRow[] {
  return lines.map((line) => {
    const quantity = baseQuantity * Number(line.qtyPerOutputUnit);
    const unitPrice = Number(line.pricingLibraryItem.defaultUnitPrice);
    return {
      formulaLineId: line.id,
      pricingLibraryItemId: line.pricingLibraryItem.id,
      itemName: line.pricingLibraryItem.name,
      unit: line.unit,
      quantity,
      unitPrice,
      totalValue: calculateLineTotal(quantity, unitPrice),
    };
  });
}

export function calculateFormulaBreakdownTotal(rows: FormulaBreakdownRow[]): number {
  return rows.reduce((sum, row) => sum + row.totalValue, 0);
}
