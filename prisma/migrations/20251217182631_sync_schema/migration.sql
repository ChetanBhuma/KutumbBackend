-- AlterTable
ALTER TABLE "SeniorCitizen" ADD COLUMN     "healthInsuranceDetails" TEXT,
ADD COLUMN     "nearbyFamilyDetails" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "MedicalHistory" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "sinceWhen" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMaster" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalHistory_seniorCitizenId_idx" ON "MedicalHistory"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "SystemMaster_type_idx" ON "SystemMaster"("type");

-- CreateIndex
CREATE INDEX "SystemMaster_isActive_idx" ON "SystemMaster"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMaster_type_code_key" ON "SystemMaster"("type", "code");

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
