import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getFormulaDetail } from "@/lib/services/qs-formula";
import { listPricingLibraryItems } from "@/lib/services/qs-formula";
import { calculateFormulaBreakdown, calculateFormulaBreakdownTotal } from "@/lib/calculations/formula";
import { formatRupiah, formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddFormulaLineForm, RemoveFormulaLineButton } from "../forms";

export default async function FormulaDetailPage({
  params,
}: {
  params: Promise<{ formulaId: string }>;
}) {
  const { formulaId } = await params;
  const session = await auth();
  const canEdit = session?.user.role === "QS";

  const formula = await getFormulaDetail(formulaId);
  const pricingItems = canEdit ? await listPricingLibraryItems() : [];

  // Preview at 1 output unit so the table reads as "per {outputUnit}" — the
  // same calculation function FormulaApplication uses at commit time, just
  // with baseQuantity = 1 (docs/QS_FORMULA_LOGIC.md §FormulaLine example).
  const breakdown = calculateFormulaBreakdown(formula.lines, 1);
  const total = calculateFormulaBreakdownTotal(breakdown);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/formulas"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Formulas
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{formula.name}</h1>
          <Badge variant="secondary">{formula.category}</Badge>
          <Badge>per {formula.outputUnit}</Badge>
        </div>
        {formula.description && (
          <p className="text-sm text-muted-foreground">{formula.description}</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty per {formula.outputUnit}</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {formula.lines.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No lines yet.
                </TableCell>
              </TableRow>
            )}
            {formula.lines.map((line, i) => (
              <TableRow key={line.id}>
                <TableCell>{line.pricingLibraryItem.name}</TableCell>
                <TableCell className="text-right">
                  {formatQuantity(breakdown[i].quantity)}
                </TableCell>
                <TableCell>{line.unit}</TableCell>
                <TableCell className="text-right">
                  {formatRupiah(breakdown[i].unitPrice)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatRupiah(breakdown[i].totalValue)}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <RemoveFormulaLineButton formulaLineId={line.id} formulaId={formula.id} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end border-t bg-muted/30 px-4 py-2 text-sm">
          <span className="font-semibold">
            Total per {formula.outputUnit}: {formatRupiah(total)}
          </span>
        </div>
      </div>

      {canEdit && (
        <AddFormulaLineForm
          formulaId={formula.id}
          pricingItems={pricingItems.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            code: p.code,
          }))}
        />
      )}
    </div>
  );
}
