/**
 * Calculation layer — docs/ARCHITECTURE.md §Calculation Layer: "UI components
 * must not independently calculate financial/business KPIs." The
 * variance/deviation formulas arriving in later days extend this same
 * convention rather than each page computing its own numbers inline.
 */

import type { Numberable } from "./money";

export interface PlanningLineForTotals {
  quantity: Numberable;
  totalValue: Numberable;
}

export function calculateBaselineTotals(lines: PlanningLineForTotals[]) {
  const totalValue = lines.reduce((sum, line) => sum + Number(line.totalValue), 0);
  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
  return { totalValue, totalQuantity, lineCount: lines.length };
}

export { calculateLineTotal } from "./money";
