/**
 * Calculation layer — docs/ARCHITECTURE.md §Calculation Layer: "UI components
 * must not independently calculate financial/business KPIs." This is the
 * first (small) module in that shared layer; the variance/deviation formulas
 * arriving in later days extend this same convention rather than each page
 * computing its own numbers inline.
 */

/** Accepts a plain number/string or anything stringifiable (e.g. Prisma's Decimal). */
type Numberable = number | string | { toString(): string };

export interface PlanningLineForTotals {
  quantity: Numberable;
  totalValue: Numberable;
}

export function calculateBaselineTotals(lines: PlanningLineForTotals[]) {
  const totalValue = lines.reduce((sum, line) => sum + Number(line.totalValue), 0);
  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
  return { totalValue, totalQuantity, lineCount: lines.length };
}

/** quantity × unitPrice, rounded to the nearest whole Rupiah (docs/DECISIONS.md D-002). */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice);
}
