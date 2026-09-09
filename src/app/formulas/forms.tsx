"use client";

import { createFormulaAction, addFormulaLineAction, removeFormulaLineAction } from "./actions";
import { useResettingAction } from "@/hooks/use-resetting-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateFormulaForm() {
  const { formRef, error, formAction, isPending } = useResettingAction(createFormulaAction);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm font-medium">Name</label>
        <Input name="name" placeholder="1 m² brick wall — standard" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Category</label>
        <Input name="category" placeholder="Structure, Finishing…" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Output unit</label>
        <Input name="outputUnit" placeholder="m², m³, ls…" required />
      </div>
      <div className="flex flex-col gap-1.5 lg:col-span-4">
        <label className="text-sm font-medium">Description (optional)</label>
        <Textarea name="description" rows={2} />
      </div>
      <Button type="submit" disabled={isPending} className="lg:col-span-4 lg:w-fit">
        {isPending ? "Creating…" : "Create formula"}
      </Button>
      {error && (
        <p className="text-sm text-destructive lg:col-span-4" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

type PricingItemOption = { id: string; name: string; unit: string; code: string };

export function AddFormulaLineForm({
  formulaId,
  pricingItems,
}: {
  formulaId: string;
  pricingItems: PricingItemOption[];
}) {
  const { formRef, error, formAction, isPending } = useResettingAction(addFormulaLineAction);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <input type="hidden" name="formulaId" value={formulaId} />
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm font-medium">Pricing item</label>
        <Select name="pricingLibraryItemId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a pricing item">
              {(value: string | null) => {
                const item = pricingItems.find((p) => p.id === value);
                return item ? `${item.name} (${item.code})` : "Select a pricing item";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pricingItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} ({item.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Qty per output unit</label>
        <Input name="qtyPerOutputUnit" type="number" step="any" min="0" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Unit</label>
        <Input name="unit" placeholder="pcs, m³, hr…" required />
      </div>
      <Button type="submit" disabled={isPending} className="lg:col-span-4 lg:w-fit">
        {isPending ? "Adding…" : "Add line"}
      </Button>
      {error && (
        <p className="text-sm text-destructive lg:col-span-4" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function RemoveFormulaLineButton({
  formulaLineId,
  formulaId,
}: {
  formulaLineId: string;
  formulaId: string;
}) {
  return (
    <form action={removeFormulaLineAction.bind(null, formulaLineId, formulaId)}>
      <Button type="submit" size="sm" variant="ghost">
        Remove
      </Button>
    </form>
  );
}
