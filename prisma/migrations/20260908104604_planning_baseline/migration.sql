-- CreateEnum
CREATE TYPE "BaselineStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PlanningLineSource" AS ENUM ('MANUAL', 'QS_FORMULA');

-- CreateTable
CREATE TABLE "PlanningBaseline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BaselineStatus" NOT NULL DEFAULT 'DRAFT',
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningLine" (
    "id" TEXT NOT NULL,
    "baselineId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,0) NOT NULL,
    "totalValue" DECIMAL(18,0) NOT NULL,
    "source" "PlanningLineSource" NOT NULL DEFAULT 'MANUAL',
    "sequence" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningBaseline_projectId_status_idx" ON "PlanningBaseline"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningBaseline_projectId_version_key" ON "PlanningBaseline"("projectId", "version");

-- CreateIndex
CREATE INDEX "PlanningLine_baselineId_idx" ON "PlanningLine"("baselineId");

-- CreateIndex
CREATE INDEX "PlanningLine_workId_idx" ON "PlanningLine"("workId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "PlanningBaseline" ADD CONSTRAINT "PlanningBaseline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningBaseline" ADD CONSTRAINT "PlanningBaseline_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningBaseline" ADD CONSTRAINT "PlanningBaseline_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningLine" ADD CONSTRAINT "PlanningLine_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "PlanningBaseline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningLine" ADD CONSTRAINT "PlanningLine_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningLine" ADD CONSTRAINT "PlanningLine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
