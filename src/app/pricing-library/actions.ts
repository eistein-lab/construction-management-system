"use server";

import { revalidatePath } from "next/cache";
import {
  createPricingLibraryItem,
  setPricingLibraryItemActive,
} from "@/lib/services/qs-formula";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth-guard";

function friendlyError(error: unknown): string {
  if (error instanceof UnauthorizedError) return "You must be signed in.";
  if (error instanceof ForbiddenError) return "Only QS can manage the pricing library.";
  if (error instanceof Error) return error.message;
  throw error;
}

export async function createPricingLibraryItemAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await createPricingLibraryItem({
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      unit: String(formData.get("unit") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      defaultUnitPrice: Number(formData.get("defaultUnitPrice")),
    });
  } catch (error) {
    return friendlyError(error);
  }
  revalidatePath("/pricing-library");
  return undefined;
}

export async function togglePricingLibraryItemActiveAction(
  id: string,
  isActive: boolean
) {
  await setPricingLibraryItemActive(id, isActive);
  revalidatePath("/pricing-library");
}
