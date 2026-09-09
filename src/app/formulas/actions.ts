"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createFormula,
  addFormulaLine,
  removeFormulaLine,
} from "@/lib/services/qs-formula";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth-guard";

function friendlyError(error: unknown): string {
  if (error instanceof UnauthorizedError) return "You must be signed in.";
  if (error instanceof ForbiddenError) return "Only QS can manage formulas.";
  if (error instanceof Error) return error.message;
  throw error;
}

export async function createFormulaAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  let formula;
  try {
    formula = await createFormula({
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      outputUnit: String(formData.get("outputUnit") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
    });
  } catch (error) {
    return friendlyError(error);
  }
  revalidatePath("/formulas");
  redirect(`/formulas/${formula.id}`);
}

export async function addFormulaLineAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const formulaId = String(formData.get("formulaId"));
  try {
    await addFormulaLine({
      formulaId,
      pricingLibraryItemId: String(formData.get("pricingLibraryItemId")),
      qtyPerOutputUnit: Number(formData.get("qtyPerOutputUnit")),
      unit: String(formData.get("unit") ?? "").trim(),
    });
  } catch (error) {
    return friendlyError(error);
  }
  revalidatePath(`/formulas/${formulaId}`);
  return undefined;
}

export async function removeFormulaLineAction(formulaLineId: string, formulaId: string) {
  await removeFormulaLine(formulaLineId);
  revalidatePath(`/formulas/${formulaId}`);
}
