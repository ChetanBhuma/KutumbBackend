-- AlterTable
ALTER TABLE "SeniorCitizen" ADD COLUMN     "maritalStatusId" TEXT;

-- CreateTable
CREATE TABLE "MaritalStatus" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaritalStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskFactor" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskFactor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaritalStatus_code_key" ON "MaritalStatus"("code");

-- CreateIndex
CREATE INDEX "MaritalStatus_isActive_idx" ON "MaritalStatus"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RiskFactor_code_key" ON "RiskFactor"("code");

-- CreateIndex
CREATE INDEX "RiskFactor_category_idx" ON "RiskFactor"("category");

-- CreateIndex
CREATE INDEX "RiskFactor_isActive_idx" ON "RiskFactor"("isActive");

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_maritalStatusId_fkey" FOREIGN KEY ("maritalStatusId") REFERENCES "MaritalStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
