"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createBaseline,
  addPlanningLine,
  deletePlanningLine,
  submitBaseline,
  approveBaseline,
  rejectBaseline,
} from "@/lib/services/ppic-baseline";
import {
  createFormulaApplicationDraft,
  commitFormulaApplication,
  discardFormulaApplicationDraft,
} from "@/lib/services/qs-formula";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth-guard";

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof UnauthorizedError) return "You must be signed in.";
  if (error instanceof ForbiddenError) return fallback;
  if (error instanceof Error) return error.message;
  throw error;
}

export async function createBaselineAction(projectId: string) {
  const baseline = await createBaseline(projectId);
  revalidatePath(`/projects/${projectId}/baseline`);
  redirect(`/projects/${projectId}/baseline/${baseline.id}`);
}

export async function addPlanningLineAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const baselineId = String(formData.get("baselineId"));
  const projectId = String(formData.get("projectId"));
  try {
    await addPlanningLine({
      baselineId,
      workId: String(formData.get("workId")),
      itemDescription: String(formData.get("itemDescription") ?? "").trim(),
      unit: String(formData.get("unit") ?? "").trim(),
      quantity: Number(formData.get("quantity")),
      unitPrice: Number(formData.get("unitPrice")),
      sequence: Number(formData.get("sequence") ?? 0),
    });
  } catch (error) {
    return friendlyError(error, "Only PPIC can add planning lines.");
  }
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
  return undefined;
}

export async function deletePlanningLineAction(
  lineId: string,
  projectId: string,
  baselineId: string
) {
  await deletePlanningLine(lineId);
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
}

export async function submitBaselineAction(
  projectId: string,
  baselineId: string
) {
  await submitBaseline(baselineId);
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
}

export async function approveBaselineAction(
  projectId: string,
  baselineId: string
) {
  await approveBaseline(baselineId);
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
}

export async function rejectBaselineAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const baselineId = String(formData.get("baselineId"));
  const projectId = String(formData.get("projectId"));
  try {
    await rejectBaseline(baselineId, String(formData.get("reason") ?? ""));
  } catch (error) {
    return friendlyError(error, "Only CEO can reject a baseline.");
  }
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
  return undefined;
}

export async function createFormulaApplicationAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const projectId = String(formData.get("projectId"));
  const baselineId = String(formData.get("baselineId"));
  try {
    await createFormulaApplicationDraft({
      workId: String(formData.get("workId")),
      formulaId: String(formData.get("formulaId")),
      baseQuantity: Number(formData.get("baseQuantity")),
    });
  } catch (error) {
    return friendlyError(error, "Only QS can apply a formula.");
  }
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
  return undefined;
}

export async function commitFormulaApplicationAction(
  applicationId: string,
  projectId: string,
  baselineId: string
) {
  await commitFormulaApplication(applicationId);
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
}

export async function discardFormulaApplicationAction(
  applicationId: string,
  projectId: string,
  baselineId: string
) {
  await discardFormulaApplicationDraft(applicationId);
  revalidatePath(`/projects/${projectId}/baseline/${baselineId}`);
}
