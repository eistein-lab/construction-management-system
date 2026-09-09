import Link from "next/link";
import { auth } from "@/auth";
import { listFormulas } from "@/lib/services/qs-formula";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateFormulaForm } from "./forms";

export default async function FormulasPage() {
  const session = await auth();
  const canCreate = session?.user.role === "QS";
  const formulas = await listFormulas();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Formulas</h1>
        <p className="text-sm text-muted-foreground">
          Reusable recipes — 1 output unit of a Formula breaks down into a
          priced material/labor list from the Pricing Library.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Output Unit</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formulas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No formulas yet.
                </TableCell>
              </TableRow>
            )}
            {formulas.map((formula) => (
              <TableRow key={formula.id}>
                <TableCell>
                  <Link
                    href={`/formulas/${formula.id}`}
                    className="font-medium hover:underline"
                  >
                    {formula.name}
                  </Link>
                </TableCell>
                <TableCell>{formula.category}</TableCell>
                <TableCell>{formula.outputUnit}</TableCell>
                <TableCell>{formula._count.lines}</TableCell>
                <TableCell>
                  <Badge variant={formula.isActive ? "success" : "outline"}>
                    {formula.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canCreate && <CreateFormulaForm />}
    </div>
  );
}
