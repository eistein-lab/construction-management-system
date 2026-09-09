import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth-guard";
import { assertProjectVisible } from "@/lib/services/access";
import { calculateLineTotal } from "@/lib/calculations/money";
import { calculateFormulaBreakdown } from "@/lib/calculations/formula";

/**
 * Service layer for the QS Formula module — docs/QS_FORMULA_LOGIC.md,
 * docs/DATA_MODEL.md §3. PricingLibraryItem/Formula/FormulaLine are global
 * master data (no project scoping — view is open to any authenticated user,
 * per docs/USER_ROLES.md's "V" cells for every role); only QS may write.
 * FormulaApplication is project-scoped via the Work it targets.
 */

const QS_EDITOR_ROLES = ["QS"] as const;

// ---------------------------------------------------------------------------
// Pricing Library
// ---------------------------------------------------------------------------

export async function listPricingLibraryItems() {
  await requireSession();
  return prisma.pricingLibraryItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createPricingLibraryItem(input: {
  code: string;
  name: string;
  unit: string;
  category: string;
  defaultUnitPrice: number;
}) {
  const session = await requireRole([...QS_EDITOR_ROLES]);
  return prisma.pricingLibraryItem.create({
    data: { ...input, createdById: session.user.id },
  });
}

export async function setPricingLibraryItemActive(id: string, isActive: boolean) {
  await requireRole([...QS_EDITOR_ROLES]);
  return prisma.pricingLibraryItem.update({ where: { id }, data: { isActive } });
}

// ---------------------------------------------------------------------------
// Formula / FormulaLine
// ---------------------------------------------------------------------------

export async function listFormulas() {
  await requireSession();
  return prisma.formula.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { lines: true } } },
  });
}

export async function getFormulaDetail(formulaId: string) {
  await requireSession();
  return prisma.formula.findUniqueOrThrow({
    where: { id: formulaId },
    include: {
      lines: { include: { pricingLibraryItem: true } },
    },
  });
}

export async function createFormula(input: {
  name: string;
  category: string;
  outputUnit: string;
  description?: string;
}) {
  const session = await requireRole([...QS_EDITOR_ROLES]);
  return prisma.formula.create({ data: { ...input, createdById: session.user.id } });
}

export async function addFormulaLine(input: {
  formulaId: string;
  pricingLibraryItemId: string;
  qtyPerOutputUnit: number;
  unit: string;
}) {
  await requireRole([...QS_EDITOR_ROLES]);
  return prisma.formulaLine.create({ data: input });
}

export async function removeFormulaLine(formulaLineId: string) {
  await requireRole([...QS_EDITOR_ROLES]);
  return prisma.formulaLine.delete({ where: { id: formulaLineId } });
}

// ---------------------------------------------------------------------------
// FormulaApplication
// ---------------------------------------------------------------------------

async function getWorkProjectId(workId: string) {
  const work = await prisma.work.findUniqueOrThrow({
    where: { id: workId },
    include: { subPhase: true },
  });
  return work.subPhase.projectId;
}

/** DRAFT applications for Works within a project — what QS still needs to review/commit. */
export async function listFormulaApplicationsForProject(projectId: string) {
  await assertProjectVisible(projectId);
  return prisma.formulaApplication.findMany({
    where: { work: { subPhase: { projectId } } },
    orderBy: { createdAt: "desc" },
    include: {
      work: { include: { subPhase: true } },
      formula: { include: { lines: { include: { pricingLibraryItem: true } } } },
      appliedBy: true,
    },
  });
}

export async function createFormulaApplicationDraft(input: {
  workId: string;
  formulaId: string;
  baseQuantity: number;
}) {
  const session = await requireRole([...QS_EDITOR_ROLES]);
  const projectId = await getWorkProjectId(input.workId);
  await assertProjectVisible(projectId);
  return prisma.formulaApplication.create({
    data: { ...input, appliedById: session.user.id },
  });
}

export async function getFormulaApplicationPreview(applicationId: string) {
  await requireSession();
  const application = await prisma.formulaApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      work: { include: { subPhase: true } },
      formula: { include: { lines: { include: { pricingLibraryItem: true } } } },
      appliedBy: true,
    },
  });
  const breakdown = calculateFormulaBreakdown(
    application.formula.lines,
    Number(application.baseQuantity)
  );
  return { application, breakdown };
}

export async function discardFormulaApplicationDraft(applicationId: string) {
  await requireRole([...QS_EDITOR_ROLES]);
  const application = await prisma.formulaApplication.findUniqueOrThrow({
    where: { id: applicationId },
  });
  if (application.status !== "DRAFT") {
    throw new Error("Only a DRAFT formula application can be discarded.");
  }
  return prisma.formulaApplication.delete({ where: { id: applicationId } });
}

/**
 * Commits a DRAFT FormulaApplication: generates one PlanningLine per
 * FormulaLine into the project's current DRAFT PlanningBaseline, snapshotting
 * each PricingLibraryItem's price at this moment (docs/QS_FORMULA_LOGIC.md —
 * "never recalculated later even if the library price changes"). Requires a
 * DRAFT baseline to exist; there is no separate "QS quantity" reconciliation
 * step — the generated PlanningLine IS the planning quantity from creation.
 */
export async function commitFormulaApplication(applicationId: string) {
  const session = await requireRole([...QS_EDITOR_ROLES]);
  const application = await prisma.formulaApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      work: { include: { subPhase: true } },
      formula: { include: { lines: { include: { pricingLibraryItem: true } } } },
    },
  });
  if (application.status !== "DRAFT") {
    throw new Error(`Cannot commit a formula application that is ${application.status}.`);
  }

  const projectId = application.work.subPhase.projectId;
  await assertProjectVisible(projectId);

  const draftBaseline = await prisma.planningBaseline.findFirst({
    where: { projectId, status: "DRAFT" },
  });
  if (!draftBaseline) {
    throw new Error(
      "No DRAFT baseline exists for this project — create one on the Planning Baseline page first, then apply formulas."
    );
  }

  const breakdown = calculateFormulaBreakdown(
    application.formula.lines,
    Number(application.baseQuantity)
  );
  if (breakdown.length === 0) {
    throw new Error("This formula has no lines yet — add at least one before committing.");
  }

  const existingLineCount = await prisma.planningLine.count({
    where: { baselineId: draftBaseline.id },
  });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.formulaApplication.update({
      where: { id: applicationId },
      data: { status: "COMMITTED" },
    });

    await tx.planningLine.createMany({
      data: breakdown.map((row, index) => ({
        baselineId: draftBaseline.id,
        workId: application.workId,
        itemDescription: row.itemName,
        unit: row.unit,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        totalValue: calculateLineTotal(row.quantity, row.unitPrice),
        source: "QS_FORMULA" as const,
        formulaApplicationId: application.id,
        sequence: existingLineCount + index + 1,
        createdById: session.user.id,
      })),
    });

    return updated;
  });
}
