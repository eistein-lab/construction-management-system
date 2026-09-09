"use server";

import { revalidatePath } from "next/cache";
import {
  createSubPhase,
  createWork,
  assignUserToProject,
  removeUserFromProject,
} from "@/lib/services/project-structure";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth-guard";

function friendlyError(error: unknown, forbiddenMessage: string): string {
  if (error instanceof UnauthorizedError) return "You must be signed in.";
  if (error instanceof ForbiddenError) return forbiddenMessage;
  throw error;
}

export async function createSubPhaseAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const projectId = String(formData.get("projectId"));
  try {
    await createSubPhase({
      projectId,
      name: String(formData.get("name") ?? "").trim(),
      sequence: Number(formData.get("sequence") ?? 0),
    });
  } catch (error) {
    return friendlyError(error, "Only PM can add a sub-phase.");
  }
  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

export async function createWorkAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const projectId = String(formData.get("projectId"));
  try {
    await createWork({
      subPhaseId: String(formData.get("subPhaseId")),
      name: String(formData.get("name") ?? "").trim(),
      unit: String(formData.get("unit") ?? "").trim(),
      sequence: Number(formData.get("sequence") ?? 0),
    });
  } catch (error) {
    return friendlyError(error, "Only PM can add a Work.");
  }
  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

export async function assignUserAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const projectId = String(formData.get("projectId"));
  try {
    await assignUserToProject({
      projectId,
      userId: String(formData.get("userId")),
    });
  } catch (error) {
    return friendlyError(error, "Only CEO/ADMIN can assign users to a project.");
  }
  revalidatePath(`/projects/${projectId}`);
  return undefined;
}

export async function removeUserAction(projectId: string, userId: string) {
  await removeUserFromProject({ projectId, userId });
  revalidatePath(`/projects/${projectId}`);
}
