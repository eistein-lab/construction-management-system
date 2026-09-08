"use server";

import { revalidatePath } from "next/cache";
import { createProject } from "@/lib/services/project-structure";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth-guard";

export async function createProjectAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await createProject({
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      client: String(formData.get("client") ?? "").trim() || undefined,
      location: String(formData.get("location") ?? "").trim() || undefined,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return "You must be signed in.";
    if (error instanceof ForbiddenError) {
      return "Only PPIC can create a project.";
    }
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return "A project with that code already exists.";
    }
    throw error;
  }

  revalidatePath("/projects");
  return undefined;
}
