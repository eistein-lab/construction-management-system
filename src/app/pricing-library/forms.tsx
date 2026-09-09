"use client";

import { createPricingLibraryItemAction, togglePricingLibraryItemActiveAction } from "./actions";
import { useResettingAction } from "@/hooks/use-resetting-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreatePricingLibraryItemForm() {
  const { formRef, error, formAction, isPending } = useResettingAction(
    createPricingLibraryItemAction
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Code</label>
        <Input name="code" placeholder="BRICK-STD" required />
      </div>
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm font-medium">Name</label>
        <Input name="name" placeholder="Standard red brick" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Unit</label>
        <Input name="unit" placeholder="pcs, m³, hr…" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Category</label>
        <Input name="category" placeholder="Material, Labor…" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Default price (Rp)</label>
        <Input name="defaultUnitPrice" type="number" step="1" min="0" required />
      </div>
      <Button type="submit" disabled={isPending} className="lg:col-span-6 lg:w-fit">
        {isPending ? "Adding…" : "Add item"}
      </Button>
      {error && (
        <p className="text-sm text-destructive lg:col-span-6" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form action={togglePricingLibraryItemActiveAction.bind(null, id, !isActive)}>
      <Button type="submit" size="sm" variant="ghost">
        {isActive ? "Deactivate" : "Activate"}
      </Button>
    </form>
  );
}
