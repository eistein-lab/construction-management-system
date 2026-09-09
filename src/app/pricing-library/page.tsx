import { auth } from "@/auth";
import { listPricingLibraryItems } from "@/lib/services/qs-formula";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreatePricingLibraryItemForm, ToggleActiveButton } from "./forms";

export default async function PricingLibraryPage() {
  const session = await auth();
  const canEdit = session?.user.role === "QS";
  const items = await listPricingLibraryItems();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Pricing Library</h1>
        <p className="text-sm text-muted-foreground">
          Master price list for materials, labor, and equipment — used by QS
          Formulas to price planning lines automatically.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Default Price</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No pricing items yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right">
                  {formatRupiah(item.defaultUnitPrice.toString())}
                </TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "outline"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <ToggleActiveButton id={item.id} isActive={item.isActive} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canEdit && <CreatePricingLibraryItemForm />}
    </div>
  );
}
