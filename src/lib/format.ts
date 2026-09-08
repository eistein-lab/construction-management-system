/**
 * Shared display formatting — docs/UI_UX_GUIDELINES.md §Tables: "consistent
 * thousands separators ... currency figures always labeled (Rp)". Used by
 * every page that renders money/quantity, not reimplemented per page.
 */

export function formatRupiah(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return "Rp" + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function formatQuantity(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return n.toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
