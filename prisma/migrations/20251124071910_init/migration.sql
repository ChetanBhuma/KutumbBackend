/*
  Warnings:

  - A unique constraint covering the columns `[srCitizenUniqueId]` on the table `SeniorCitizen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNo]` on the table `SeniorCitizen` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SeniorCitizen" ADD COLUMN     "aadhaarNoMasked" TEXT,
ADD COLUMN     "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "allowDataExport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowDataShareWithFamily" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowFamilyNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "beatCode" TEXT,
ADD COLUMN     "beatName" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "consentAcceptedOn" TIMESTAMP(3),
ADD COLUMN     "consentScheduledVisitReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consentVersion" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "deletedOn" TIMESTAMP(3),
ADD COLUMN     "digitalIdIssuedDate" TIMESTAMP(3),
ADD COLUMN     "digitalQrCodeUrl" TEXT,
ADD COLUMN     "disabilityCertificateNo" TEXT,
ADD COLUMN     "districtName" TEXT,
ADD COLUMN     "educationQualification" TEXT,
ADD COLUMN     "emergencyHospitalPreference" TEXT,
ADD COLUMN     "familyType" TEXT,
ADD COLUMN     "geoJsonBeatId" TEXT,
ADD COLUMN     "isMobileRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSoftDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAppLogin" TIMESTAMP(3),
ADD COLUMN     "lastAssessmentDate" TIMESTAMP(3),
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "mobilityStatus" TEXT,
ADD COLUMN     "nextScheduledVisitDate" TIMESTAMP(3),
ADD COLUMN     "physicalDisability" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "policePostCode" TEXT,
ADD COLUMN     "policePostName" TEXT,
ADD COLUMN     "policeStationCode" TEXT,
ADD COLUMN     "policeStationName" TEXT,
ADD COLUMN     "portalReferenceId" TEXT,
ADD COLUMN     "primaryDeviceId" TEXT,
ADD COLUMN     "primaryFamilyContactId" TEXT,
ADD COLUMN     "primaryFcmToken" TEXT,
ADD COLUMN     "rangeName" TEXT,
ADD COLUMN     "registrationDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "retiredFrom" TEXT,
ADD COLUMN     "sourceSystem" TEXT,
ADD COLUMN     "srCitizenUniqueId" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "subDivisionName" TEXT,
ADD COLUMN     "updatedBy" TEXT,
ADD COLUMN     "visitRemarks" TEXT,
ADD COLUMN     "vulnerabilityScore" INTEGER;

-- CreateTable
CREATE TABLE "SpouseDetails" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "gender" TEXT,
    "mobileNumber" TEXT,
    "email" TEXT,
    "socialChatIds" TEXT,
    "isLivingTogether" BOOLEAN NOT NULL DEFAULT true,
    "addressIfNotTogether" TEXT,
    "relationshipStatus" TEXT,
    "interlinkingId" TEXT,

    CONSTRAINT "SpouseDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpouseDetails_seniorCitizenId_key" ON "SpouseDetails"("seniorCitizenId");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorCitizen_srCitizenUniqueId_key" ON "SeniorCitizen"("srCitizenUniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorCitizen_registrationNo_key" ON "SeniorCitizen"("registrationNo");

-- AddForeignKey
ALTER TABLE "SpouseDetails" ADD CONSTRAINT "SpouseDetails_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
