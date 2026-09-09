-- CreateEnum
CREATE TYPE "FormulaApplicationStatus" AS ENUM ('DRAFT', 'COMMITTED');

-- AlterTable
ALTER TABLE "PlanningLine" ADD COLUMN     "formulaApplicationId" TEXT;

-- CreateTable
CREATE TABLE "PricingLibraryItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultUnitPrice" DECIMAL(18,0) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "outputUnit" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaLine" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "pricingLibraryItemId" TEXT NOT NULL,
    "qtyPerOutputUnit" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "FormulaLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaApplication" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "baseQuantity" DECIMAL(18,4) NOT NULL,
    "status" "FormulaApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "appliedById" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulaApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingLibraryItem_code_key" ON "PricingLibraryItem"("code");

-- CreateIndex
CREATE INDEX "PricingLibraryItem_category_idx" ON "PricingLibraryItem"("category");

-- CreateIndex
CREATE INDEX "Formula_category_idx" ON "Formula"("category");

-- CreateIndex
CREATE INDEX "FormulaLine_formulaId_idx" ON "FormulaLine"("formulaId");

-- CreateIndex
CREATE INDEX "FormulaApplication_workId_idx" ON "FormulaApplication"("workId");

-- CreateIndex
CREATE INDEX "FormulaApplication_status_idx" ON "FormulaApplication"("status");

-- CreateIndex
CREATE INDEX "PlanningLine_formulaApplicationId_idx" ON "PlanningLine"("formulaApplicationId");

-- AddForeignKey
ALTER TABLE "PlanningLine" ADD CONSTRAINT "PlanningLine_formulaApplicationId_fkey" FOREIGN KEY ("formulaApplicationId") REFERENCES "FormulaApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingLibraryItem" ADD CONSTRAINT "PricingLibraryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formula" ADD CONSTRAINT "Formula_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaLine" ADD CONSTRAINT "FormulaLine_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaLine" ADD CONSTRAINT "FormulaLine_pricingLibraryItemId_fkey" FOREIGN KEY ("pricingLibraryItemId") REFERENCES "PricingLibraryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaApplication" ADD CONSTRAINT "FormulaApplication_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaApplication" ADD CONSTRAINT "FormulaApplication_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaApplication" ADD CONSTRAINT "FormulaApplication_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
