/**
 * Calculation layer — docs/ARCHITECTURE.md §Calculation Layer. Shared money
 * primitives used by every other calculation module (baseline totals today,
 * formula breakdowns, and the variance/deviation formulas arriving in later
 * days) — one rounding rule, defined once.
 */

/** Accepts a plain number/string or anything stringifiable (e.g. Prisma's Decimal). */
export type Numberable = number | string | { toString(): string };

/** quantity × unitPrice, rounded to the nearest whole Rupiah (docs/DECISIONS.md D-002). */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice);
}
