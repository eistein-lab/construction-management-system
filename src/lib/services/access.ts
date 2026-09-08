import "server-only";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  hasGlobalProjectVisibility,
  ForbiddenError,
} from "@/lib/auth-guard";

/**
 * Shared "can the current user see this project" check — every service module
 * that reads/writes data under a project (baseline, procurement, progress,
 * stock, ...) calls this rather than re-deriving the visibility rule, per
 * docs/USER_ROLES.md (only SPV is ProjectAssignment-scoped) and the D-010
 * lesson in docs/DECISIONS.md about keeping this in exactly one place.
 */
export async function assertProjectVisible(projectId: string) {
  const session = await requireSession();
  const { role, id: userId } = session.user;

  const visible = hasGlobalProjectVisibility(role)
    ? true
    : await prisma.projectAssignment.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

  if (!visible) {
    throw new ForbiddenError("Not assigned to this project");
  }
  return session;
}
