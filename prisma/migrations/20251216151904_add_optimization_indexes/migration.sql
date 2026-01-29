/*
  Warnings:

  - The `status` column on the `SOSAlert` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `beatName` on the `SeniorCitizen` table. All the data in the column will be lost.
  - You are about to drop the column `districtName` on the `SeniorCitizen` table. All the data in the column will be lost.
  - You are about to drop the column `policeStationCode` on the `SeniorCitizen` table. All the data in the column will be lost.
  - You are about to drop the column `policeStationName` on the `SeniorCitizen` table. All the data in the column will be lost.
  - You are about to drop the column `rangeName` on the `SeniorCitizen` table. All the data in the column will be lost.
  - You are about to drop the column `subDivisionName` on the `SeniorCitizen` table. All the data in the column will be lost.
  - The `idVerificationStatus` column on the `SeniorCitizen` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `ServiceRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Visit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[officerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'MISSED');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('Pending', 'Verified', 'Rejected', 'Suspended');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'In_Progress', 'Resolved', 'Closed', 'Rejected');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('Active', 'Resolved', 'False_Alarm');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled');

-- AlterTable
ALTER TABLE "EmergencyContact" ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'Not Verified',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SOSAlert" ADD COLUMN     "batteryLevel" INTEGER,
ADD COLUMN     "deviceInfo" JSONB,
DROP COLUMN "status",
ADD COLUMN     "status" "AlertStatus" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "SeniorCitizen" DROP COLUMN "beatName",
DROP COLUMN "districtName",
DROP COLUMN "policeStationCode",
DROP COLUMN "policeStationName",
DROP COLUMN "rangeName",
DROP COLUMN "subDivisionName",
DROP COLUMN "idVerificationStatus",
ADD COLUMN     "idVerificationStatus" "IdentityStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "officerId" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "assessmentData" JSONB,
ADD COLUMN     "riskScore" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE "SOSLocationUpdate" (
    "id" TEXT NOT NULL,
    "sosAlertId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "batteryLevel" INTEGER,
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOSLocationUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VulnerabilityHistory" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "breakdown" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VulnerabilityHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitRequest" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTimeSlot" TEXT,
    "visitType" TEXT,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registrationId" TEXT,

    CONSTRAINT "VisitRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenRegistration" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "fullName" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "registrationStep" TEXT NOT NULL DEFAULT 'START',
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "draftData" JSONB,
    "citizenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitFeedback" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenAuth" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpLastSentAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "registrationStep" INTEGER NOT NULL DEFAULT 0,
    "citizenId" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIP" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "remarks" TEXT,
    "documents" TEXT[],
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "verificationNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VulnerabilityConfig" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "weights" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VulnerabilityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VulnerabilityBand" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "min" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "color" TEXT,
    "visitFrequencyDays" INTEGER NOT NULL,

    CONSTRAINT "VulnerabilityBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerLeave" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "leaveType" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'Pending',
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerLeave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SOSLocationUpdate_sosAlertId_idx" ON "SOSLocationUpdate"("sosAlertId");

-- CreateIndex
CREATE INDEX "VulnerabilityHistory_citizenId_idx" ON "VulnerabilityHistory"("citizenId");

-- CreateIndex
CREATE INDEX "VisitRequest_seniorCitizenId_idx" ON "VisitRequest"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "VisitRequest_status_idx" ON "VisitRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenRegistration_mobileNumber_key" ON "CitizenRegistration"("mobileNumber");

-- CreateIndex
CREATE INDEX "CitizenRegistration_mobileNumber_idx" ON "CitizenRegistration"("mobileNumber");

-- CreateIndex
CREATE INDEX "CitizenRegistration_status_idx" ON "CitizenRegistration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VisitFeedback_visitId_key" ON "VisitFeedback"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenAuth_mobileNumber_key" ON "CitizenAuth"("mobileNumber");

-- CreateIndex
CREATE INDEX "CitizenAuth_mobileNumber_idx" ON "CitizenAuth"("mobileNumber");

-- CreateIndex
CREATE INDEX "CitizenAuth_citizenId_idx" ON "CitizenAuth"("citizenId");

-- CreateIndex
CREATE INDEX "VerificationRequest_seniorCitizenId_idx" ON "VerificationRequest"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationRequest_assignedTo_idx" ON "VerificationRequest"("assignedTo");

-- CreateIndex
CREATE INDEX "OfficerLeave_officerId_idx" ON "OfficerLeave"("officerId");

-- CreateIndex
CREATE INDEX "OfficerLeave_status_idx" ON "OfficerLeave"("status");

-- CreateIndex
CREATE INDEX "OfficerLeave_startDate_idx" ON "OfficerLeave"("startDate");

-- CreateIndex
CREATE INDEX "OfficerLeave_endDate_idx" ON "OfficerLeave"("endDate");

-- CreateIndex
CREATE INDEX "OfficerLeave_approvedBy_idx" ON "OfficerLeave"("approvedBy");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "BeatOfficer_designationId_idx" ON "BeatOfficer"("designationId");

-- CreateIndex
CREATE INDEX "PoliceStation_districtId_idx" ON "PoliceStation"("districtId");

-- CreateIndex
CREATE INDEX "SOSAlert_status_idx" ON "SOSAlert"("status");

-- CreateIndex
CREATE INDEX "SeniorCitizen_districtId_idx" ON "SeniorCitizen"("districtId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_assignedTo_idx" ON "ServiceRequest"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "User_officerId_key" ON "User"("officerId");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_policeStationId_idx" ON "Visit"("policeStationId");

-- CreateIndex
CREATE INDEX "Visit_beatId_idx" ON "Visit"("beatId");

-- AddForeignKey
ALTER TABLE "SOSLocationUpdate" ADD CONSTRAINT "SOSLocationUpdate_sosAlertId_fkey" FOREIGN KEY ("sosAlertId") REFERENCES "SOSAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "BeatOfficer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerabilityHistory" ADD CONSTRAINT "VulnerabilityHistory_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "SeniorCitizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitRequest" ADD CONSTRAINT "VisitRequest_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitRequest" ADD CONSTRAINT "VisitRequest_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "CitizenRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenRegistration" ADD CONSTRAINT "CitizenRegistration_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "SeniorCitizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitFeedback" ADD CONSTRAINT "VisitFeedback_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenAuth" ADD CONSTRAINT "CitizenAuth_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "SeniorCitizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerabilityBand" ADD CONSTRAINT "VulnerabilityBand_configId_fkey" FOREIGN KEY ("configId") REFERENCES "VulnerabilityConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLeave" ADD CONSTRAINT "OfficerLeave_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "BeatOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLeave" ADD CONSTRAINT "OfficerLeave_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerLeave" ADD CONSTRAINT "OfficerLeave_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
