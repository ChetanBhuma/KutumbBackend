/*
  Warnings:

  - The `boundaries` column on the `Beat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `districtId` on table `PoliceStation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rangeId` on table `PoliceStation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subDivisionId` on table `PoliceStation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `Range` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `SubDivision` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PoliceStation" DROP CONSTRAINT "PoliceStation_districtId_fkey";

-- DropForeignKey
ALTER TABLE "PoliceStation" DROP CONSTRAINT "PoliceStation_rangeId_fkey";

-- DropForeignKey
ALTER TABLE "PoliceStation" DROP CONSTRAINT "PoliceStation_subDivisionId_fkey";

-- AlterTable
ALTER TABLE "Beat" ADD COLUMN     "beatNumber" TEXT,
ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "exactLocation" TEXT,
ADD COLUMN     "landArea" TEXT,
ADD COLUMN     "rangeId" TEXT,
ADD COLUMN     "subDivisionId" TEXT,
DROP COLUMN "boundaries",
ADD COLUMN     "boundaries" JSONB;

-- AlterTable
ALTER TABLE "PoliceStation" ALTER COLUMN "districtId" SET NOT NULL,
ALTER COLUMN "rangeId" SET NOT NULL,
ALTER COLUMN "subDivisionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Range" ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "SeniorCitizen" ADD COLUMN     "addressProofUrl" TEXT;

-- AlterTable
ALTER TABLE "SubDivision" ADD COLUMN     "area" TEXT,
ADD COLUMN     "headquarters" TEXT,
ADD COLUMN     "population" INTEGER,
ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Beat_rangeId_idx" ON "Beat"("rangeId");

-- CreateIndex
CREATE INDEX "Beat_districtId_idx" ON "Beat"("districtId");

-- CreateIndex
CREATE INDEX "Beat_subDivisionId_idx" ON "Beat"("subDivisionId");

-- CreateIndex
CREATE INDEX "Beat_code_idx" ON "Beat"("code");

-- CreateIndex
CREATE INDEX "Beat_isActive_idx" ON "Beat"("isActive");

-- CreateIndex
CREATE INDEX "PoliceStation_rangeId_idx" ON "PoliceStation"("rangeId");

-- CreateIndex
CREATE INDEX "PoliceStation_isActive_idx" ON "PoliceStation"("isActive");

-- CreateIndex
CREATE INDEX "Range_code_idx" ON "Range"("code");

-- CreateIndex
CREATE INDEX "Range_isActive_idx" ON "Range"("isActive");

-- CreateIndex
CREATE INDEX "SubDivision_code_idx" ON "SubDivision"("code");

-- CreateIndex
CREATE INDEX "SubDivision_isActive_idx" ON "SubDivision"("isActive");

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_subDivisionId_fkey" FOREIGN KEY ("subDivisionId") REFERENCES "SubDivision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_subDivisionId_fkey" FOREIGN KEY ("subDivisionId") REFERENCES "SubDivision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
