/*
  Warnings:

  - You are about to drop the column `category` on the `HouseholdHelp` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "IdentityStatus" ADD VALUE 'FieldVerified';

-- DropForeignKey
ALTER TABLE "BeatOfficer" DROP CONSTRAINT "BeatOfficer_policeStationId_fkey";

-- DropIndex
DROP INDEX "District_range_idx";

-- AlterTable
ALTER TABLE "BeatOfficer" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "rangeId" TEXT,
ADD COLUMN     "subDivisionId" TEXT,
ALTER COLUMN "policeStationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "District" ADD COLUMN     "rangeId" TEXT,
ALTER COLUMN "range" DROP NOT NULL;

-- AlterTable
ALTER TABLE "HouseholdHelp" DROP COLUMN "category",
ADD COLUMN     "idProofUrl" TEXT,
ADD COLUMN     "staffType" TEXT NOT NULL DEFAULT 'Domestic Help';

-- AlterTable
ALTER TABLE "PoliceStation" ADD COLUMN     "subDivisionId" TEXT;

-- AlterTable
ALTER TABLE "SeniorCitizen" ADD COLUMN     "residingWith" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "telephoneNumber" TEXT;

-- CreateTable
CREATE TABLE "Range" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubDivision" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "districtId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubDivision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Range_code_key" ON "Range"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubDivision_code_key" ON "SubDivision"("code");

-- CreateIndex
CREATE INDEX "SubDivision_districtId_idx" ON "SubDivision"("districtId");

-- CreateIndex
CREATE INDEX "District_rangeId_idx" ON "District"("rangeId");

-- CreateIndex
CREATE INDEX "PoliceStation_subDivisionId_idx" ON "PoliceStation"("subDivisionId");

-- CreateIndex
CREATE INDEX "SeniorCitizen_subDivisionId_idx" ON "SeniorCitizen"("subDivisionId");

-- CreateIndex
CREATE INDEX "SeniorCitizen_rangeId_idx" ON "SeniorCitizen"("rangeId");

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_subDivisionId_fkey" FOREIGN KEY ("subDivisionId") REFERENCES "SubDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubDivision" ADD CONSTRAINT "SubDivision_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_subDivisionId_fkey" FOREIGN KEY ("subDivisionId") REFERENCES "SubDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_subDivisionId_fkey" FOREIGN KEY ("subDivisionId") REFERENCES "SubDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE SET NULL ON UPDATE CASCADE;
