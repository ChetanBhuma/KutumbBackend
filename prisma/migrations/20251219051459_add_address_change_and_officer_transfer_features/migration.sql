/*
  Warnings:

  - The values [False_Alarm] on the enum `AlertStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AlertStatus_new" AS ENUM ('Active', 'Responded', 'Resolved', 'FalseAlarm');
ALTER TABLE "SOSAlert" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SOSAlert" ALTER COLUMN "status" TYPE "AlertStatus_new" USING ("status"::text::"AlertStatus_new");
ALTER TYPE "AlertStatus" RENAME TO "AlertStatus_old";
ALTER TYPE "AlertStatus_new" RENAME TO "AlertStatus";
DROP TYPE "AlertStatus_old";
ALTER TABLE "SOSAlert" ALTER COLUMN "status" SET DEFAULT 'Active';
COMMIT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "previousAddress" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "OfficerTransferHistory" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "fromBeatId" TEXT NOT NULL,
    "toBeatId" TEXT NOT NULL,
    "fromPoliceStationId" TEXT NOT NULL,
    "toPoliceStationId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "transferredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficerTransferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficerTransferHistory_officerId_idx" ON "OfficerTransferHistory"("officerId");

-- CreateIndex
CREATE INDEX "OfficerTransferHistory_effectiveDate_idx" ON "OfficerTransferHistory"("effectiveDate");

-- CreateIndex
CREATE INDEX "OfficerTransferHistory_fromBeatId_idx" ON "OfficerTransferHistory"("fromBeatId");

-- CreateIndex
CREATE INDEX "OfficerTransferHistory_toBeatId_idx" ON "OfficerTransferHistory"("toBeatId");

-- CreateIndex
CREATE INDEX "BeatOfficer_badgeNumber_idx" ON "BeatOfficer"("badgeNumber");

-- CreateIndex
CREATE INDEX "SOSAlert_status_createdAt_idx" ON "SOSAlert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SeniorCitizen_isActive_idx" ON "SeniorCitizen"("isActive");

-- CreateIndex
CREATE INDEX "SeniorCitizen_idVerificationStatus_idx" ON "SeniorCitizen"("idVerificationStatus");

-- CreateIndex
CREATE INDEX "SeniorCitizen_policeStationId_isActive_idx" ON "SeniorCitizen"("policeStationId", "isActive");

-- CreateIndex
CREATE INDEX "Visit_officerId_status_idx" ON "Visit"("officerId", "status");

-- CreateIndex
CREATE INDEX "Visit_status_scheduledDate_idx" ON "Visit"("status", "scheduledDate");

-- AddForeignKey
ALTER TABLE "OfficerTransferHistory" ADD CONSTRAINT "OfficerTransferHistory_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "BeatOfficer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
