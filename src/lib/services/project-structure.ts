import "server-only";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireSession,
  hasGlobalProjectVisibility,
  ForbiddenError,
} from "@/lib/auth-guard";

/**
 * Service layer for Project / SubPhase / Work — docs/DATA_MODEL.md §2,
 * docs/PPIC_LOGIC.md, docs/USER_ROLES.md permission matrix:
 *   Project / SubPhase / Work | CEO:V FINANCE:V PPIC:V,C,E PURCHASING:V ACCOUNTING:V
 *                               LOGISTIC:V SPV:V(assigned) QS:V ADMIN:V
 * Only PPIC can create/edit. Nothing is ever hard-deleted (docs/BUSINESS_RULES.md
 * §Historical Integrity) — there is deliberately no delete function here.
 */

const STRUCTURE_EDITOR_ROLES = ["PPIC"] as const;

export async function listProjectsForCurrentUser() {
  const session = await requireSession();
  const { role, id: userId } = session.user;

  if (hasGlobalProjectVisibility(role)) {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { subPhases: true } } },
    });
  }

  return prisma.project.findMany({
    where: { assignments: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subPhases: true } } },
  });
}

export async function createProject(input: {
  code: string;
  name: string;
  client?: string;
  location?: string;
}) {
  const session = await requireRole([...STRUCTURE_EDITOR_ROLES]);
  return prisma.project.create({
    data: { ...input, createdById: session.user.id },
  });
}

export async function updateProject(
  projectId: string,
  input: Partial<{
    name: string;
    client: string;
    location: string;
    startDate: Date;
    targetEndDate: Date;
  }>
) {
  await requireRole([...STRUCTURE_EDITOR_ROLES]);
  return prisma.project.update({ where: { id: projectId }, data: input });
}

async function assertProjectVisible(projectId: string) {
  const session = await requireSession();
  const { role, id: userId } = session.user;

  const assignment = hasGlobalProjectVisibility(role)
    ? true
    : await prisma.projectAssignment.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

  if (!assignment) {
    throw new ForbiddenError("Not assigned to this project");
  }
  return session;
}

export async function getProjectDetail(projectId: string) {
  await assertProjectVisible(projectId);

  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      subPhases: {
        orderBy: { sequence: "asc" },
        include: { works: { orderBy: { sequence: "asc" } } },
      },
      assignments: { include: { user: true } },
    },
  });
}

export async function createSubPhase(input: {
  projectId: string;
  name: string;
  sequence: number;
}) {
  const session = await requireRole([...STRUCTURE_EDITOR_ROLES]);
  return prisma.subPhase.create({
    data: { ...input, createdById: session.user.id },
  });
}

export async function updateSubPhase(
  subPhaseId: string,
  input: Partial<{ name: string; sequence: number }>
) {
  await requireRole([...STRUCTURE_EDITOR_ROLES]);
  return prisma.subPhase.update({ where: { id: subPhaseId }, data: input });
}

export async function createWork(input: {
  subPhaseId: string;
  name: string;
  unit: string;
  sequence: number;
}) {
  const session = await requireRole([...STRUCTURE_EDITOR_ROLES]);
  return prisma.work.create({
    data: { ...input, createdById: session.user.id },
  });
}

export async function updateWork(
  workId: string,
  input: Partial<{ name: string; unit: string; sequence: number }>
) {
  await requireRole([...STRUCTURE_EDITOR_ROLES]);
  return prisma.work.update({ where: { id: workId }, data: input });
}

/** CEO/ADMIN scope non-global-visibility users to specific projects — docs/DATA_MODEL.md §1. */
export async function assignUserToProject(input: {
  projectId: string;
  userId: string;
}) {
  await requireRole(["CEO", "ADMIN"]);
  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: input.userId },
  });
  return prisma.projectAssignment.upsert({
    where: {
      projectId_userId: { projectId: input.projectId, userId: input.userId },
    },
    create: { ...input, role: targetUser.role },
    update: { role: targetUser.role },
  });
}

export async function removeUserFromProject(input: {
  projectId: string;
  userId: string;
}) {
  await requireRole(["CEO", "ADMIN"]);
  return prisma.projectAssignment.delete({
    where: {
      projectId_userId: { projectId: input.projectId, userId: input.userId },
    },
  });
}

export async function listAllUsers() {
  await requireRole(["CEO", "ADMIN"]);
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
