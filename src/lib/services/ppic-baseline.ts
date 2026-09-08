import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { assertProjectVisible } from "@/lib/services/access";
import { writeAuditLog } from "@/lib/audit";
import { calculateLineTotal } from "@/lib/calculations/baseline";

/**
 * Service layer for PlanningBaseline / PlanningLine — docs/PPIC_LOGIC.md,
 * docs/DATA_MODEL.md §2. Lifecycle: DRAFT → SUBMITTED → APPROVED (→ SUPERSEDED
 * when a later revision is approved in its place). Approver is CEO only
 * (docs/USER_ROLES.md §Approval Structure — unlike BaselineAddendum, which is
 * dual CEO+FINANCE and arrives in a later day).
 */

const BASELINE_EDITOR_ROLES = ["PPIC"] as const;
const BASELINE_APPROVER_ROLES = ["CEO"] as const;

async function assertBaselineVisible(baselineId: string) {
  const baseline = await prisma.planningBaseline.findUniqueOrThrow({
    where: { id: baselineId },
  });
  const session = await assertProjectVisible(baseline.projectId);
  return { session, baseline };
}

export async function listBaselinesForProject(projectId: string) {
  await assertProjectVisible(projectId);
  return prisma.planningBaseline.findMany({
    where: { projectId },
    orderBy: { version: "desc" },
    include: { _count: { select: { lines: true } } },
  });
}

export async function getBaselineDetail(baselineId: string) {
  const { baseline } = await assertBaselineVisible(baselineId);

  const [full, siblings] = await Promise.all([
    prisma.planningBaseline.findUniqueOrThrow({
      where: { id: baselineId },
      include: {
        lines: {
          orderBy: { sequence: "asc" },
          include: { work: { include: { subPhase: true } } },
        },
        createdBy: true,
        approvedBy: true,
      },
    }),
    prisma.planningBaseline.findMany({
      where: { projectId: baseline.projectId },
      select: { id: true, version: true, status: true },
      orderBy: { version: "desc" },
    }),
  ]);

  const isLatest = siblings[0]?.id === baselineId;
  const hasActiveRevision = siblings.some(
    (s) => s.id !== baselineId && (s.status === "DRAFT" || s.status === "SUBMITTED")
  );

  return { baseline: full, isLatest, hasActiveRevision };
}

export async function createBaseline(projectId: string) {
  const session = await requireRole([...BASELINE_EDITOR_ROLES]);
  await assertProjectVisible(projectId);

  const existing = await prisma.planningBaseline.findMany({
    where: { projectId, status: { in: ["DRAFT", "SUBMITTED"] } },
  });
  if (existing.length > 0) {
    throw new Error(
      `A baseline revision is already in progress (version ${existing[0].version}, status ${existing[0].status}) — finish or resolve it before starting another.`
    );
  }

  const latest = await prisma.planningBaseline.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });

  return prisma.planningBaseline.create({
    data: {
      projectId,
      version: (latest?.version ?? 0) + 1,
      createdById: session.user.id,
    },
  });
}

async function assertLineEditable(baselineId: string) {
  const { session, baseline } = await assertBaselineVisible(baselineId);
  await requireRole([...BASELINE_EDITOR_ROLES]);
  if (baseline.status !== "DRAFT") {
    throw new Error(
      `Cannot modify lines on a baseline that is ${baseline.status} — only DRAFT baselines are editable.`
    );
  }
  return session;
}

export async function addPlanningLine(input: {
  baselineId: string;
  workId: string;
  itemDescription: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  sequence: number;
}) {
  const session = await assertLineEditable(input.baselineId);
  const totalValue = calculateLineTotal(input.quantity, input.unitPrice);

  return prisma.planningLine.create({
    data: {
      baselineId: input.baselineId,
      workId: input.workId,
      itemDescription: input.itemDescription,
      unit: input.unit,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      totalValue,
      sequence: input.sequence,
      createdById: session.user.id,
    },
  });
}

export async function deletePlanningLine(lineId: string) {
  const line = await prisma.planningLine.findUniqueOrThrow({
    where: { id: lineId },
  });
  await assertLineEditable(line.baselineId);
  return prisma.planningLine.delete({ where: { id: lineId } });
}

export async function submitBaseline(baselineId: string) {
  const { session, baseline } = await assertBaselineVisible(baselineId);
  await requireRole([...BASELINE_EDITOR_ROLES]);

  if (baseline.status !== "DRAFT") {
    throw new Error(`Cannot submit a baseline that is ${baseline.status}.`);
  }
  const lineCount = await prisma.planningLine.count({ where: { baselineId } });
  if (lineCount === 0) {
    throw new Error("Cannot submit an empty baseline — add at least one line first.");
  }

  const updated = await prisma.planningBaseline.update({
    where: { id: baselineId },
    data: { status: "SUBMITTED", rejectionReason: null },
  });

  await writeAuditLog({
    entityType: "PlanningBaseline",
    entityId: baselineId,
    action: "SUBMIT",
    actorId: session.user.id,
    before: baseline,
    after: updated,
  });
  return updated;
}

export async function approveBaseline(baselineId: string) {
  const { session, baseline } = await assertBaselineVisible(baselineId);
  await requireRole([...BASELINE_APPROVER_ROLES]);

  if (baseline.status !== "SUBMITTED") {
    throw new Error(`Cannot approve a baseline that is ${baseline.status}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Only one APPROVED baseline should exist per project at a time — a prior
    // approved version being revised becomes SUPERSEDED the moment its
    // replacement is approved (docs/PPIC_LOGIC.md §Baseline Lifecycle).
    await tx.planningBaseline.updateMany({
      where: { projectId: baseline.projectId, status: "APPROVED" },
      data: { status: "SUPERSEDED" },
    });

    return tx.planningBaseline.update({
      where: { id: baselineId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });
  });

  await writeAuditLog({
    entityType: "PlanningBaseline",
    entityId: baselineId,
    action: "APPROVE",
    actorId: session.user.id,
    before: baseline,
    after: updated,
  });
  return updated;
}

export async function rejectBaseline(baselineId: string, reason: string) {
  const { session, baseline } = await assertBaselineVisible(baselineId);
  await requireRole([...BASELINE_APPROVER_ROLES]);

  if (baseline.status !== "SUBMITTED") {
    throw new Error(`Cannot reject a baseline that is ${baseline.status}.`);
  }
  if (!reason.trim()) {
    throw new Error("A rejection reason is required.");
  }

  const updated = await prisma.planningBaseline.update({
    where: { id: baselineId },
    data: { status: "DRAFT", rejectionReason: reason.trim() },
  });

  await writeAuditLog({
    entityType: "PlanningBaseline",
    entityId: baselineId,
    action: "REJECT",
    actorId: session.user.id,
    before: baseline,
    after: updated,
  });
  return updated;
}
