import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * docs/DATA_MODEL.md §9: "Written for every state-changing action on:
 * PlanningBaseline, ... Not optional — this is what makes the CEO dashboard's
 * drill-down and the financial-safety guarantees verifiable after the fact."
 * before/after are passed through JSON.parse(JSON.stringify(...)) to safely
 * flatten Decimal/Date instances into plain JSON for the Json column.
 */
export async function writeAuditLog(params: {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorId: params.actorId,
      beforeJson:
        params.before === undefined
          ? undefined
          : JSON.parse(JSON.stringify(params.before)),
      afterJson:
        params.after === undefined
          ? undefined
          : JSON.parse(JSON.stringify(params.after)),
    },
  });
}
