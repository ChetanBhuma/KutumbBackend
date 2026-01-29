-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeniorCitizen" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "photoUrl" TEXT,
    "maritalStatus" TEXT,
    "occupation" TEXT,
    "yearOfRetirement" INTEGER,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "religion" TEXT,
    "languagesKnown" TEXT[],
    "aadhaarNumber" TEXT,
    "voterIdNumber" TEXT,
    "panNumber" TEXT,
    "passportNumber" TEXT,
    "healthId" TEXT,
    "socialChatIds" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "alternateMobile" TEXT,
    "email" TEXT,
    "preferredContactMode" TEXT NOT NULL DEFAULT 'Call',
    "permanentAddress" TEXT NOT NULL,
    "presentAddress" TEXT,
    "pinCode" TEXT NOT NULL,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "landmark" TEXT,
    "rangeId" TEXT,
    "districtId" TEXT,
    "subDivisionId" TEXT,
    "policeStationId" TEXT,
    "beatId" TEXT,
    "livingArrangementId" TEXT,
    "livingArrangement" TEXT,
    "numberOfChildren" INTEGER,
    "consentToNotifyFamily" BOOLEAN NOT NULL DEFAULT false,
    "bloodGroup" TEXT,
    "healthConditions" TEXT[],
    "allergies" TEXT,
    "regularDoctor" TEXT,
    "doctorContact" TEXT,
    "healthInsurance" TEXT,
    "mobilityConstraints" TEXT,
    "consentShareHealth" BOOLEAN NOT NULL DEFAULT false,
    "registeredOnApp" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" TEXT,
    "appRegistrationDate" TIMESTAMP(3),
    "consentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "digitalCardIssued" BOOLEAN NOT NULL DEFAULT false,
    "digitalCardNumber" TEXT,
    "digitalCardIssueDate" TIMESTAMP(3),
    "preferredVisitDay" TEXT,
    "preferredVisitTime" TEXT,
    "visitNotes" TEXT,
    "lastVisitDate" TIMESTAMP(3),
    "vulnerabilityLevel" TEXT NOT NULL DEFAULT 'Low',
    "interestedServices" TEXT[],
    "consentServiceRequest" BOOLEAN NOT NULL DEFAULT true,
    "consentDataUse" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "applicationReceivedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT,
    "idVerificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "officialRemarks" TEXT,
    "dataEntryCompletedBy" TEXT,
    "dataEntryDate" TIMESTAMP(3),
    "formCode" TEXT NOT NULL DEFAULT 'SC-REG-01',
    "formVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "submissionType" TEXT NOT NULL DEFAULT 'New',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "SeniorCitizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "relation" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdHelp" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "address" TEXT,
    "idProofType" TEXT,
    "idProofNumber" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'Not Verified',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdHelp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "districtId" TEXT,
    "rangeId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "policeStationId" TEXT NOT NULL,
    "description" TEXT,
    "boundaries" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeatOfficer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "policeStationId" TEXT NOT NULL,
    "beatId" TEXT,
    "designationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeatOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "policeStationId" TEXT NOT NULL,
    "beatId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "visitType" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSAlert" (
    "id" TEXT NOT NULL,
    "seniorCitizenId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDuration" INTEGER NOT NULL DEFAULT 30,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requiresSpecialCare" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "population" INTEGER NOT NULL DEFAULT 0,
    "headquarters" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivingArrangement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresCaretaker" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivingArrangement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HealthConditions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorCitizen_aadhaarNumber_key" ON "SeniorCitizen"("aadhaarNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorCitizen_mobileNumber_key" ON "SeniorCitizen"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorCitizen_userId_key" ON "SeniorCitizen"("userId");

-- CreateIndex
CREATE INDEX "SeniorCitizen_mobileNumber_idx" ON "SeniorCitizen"("mobileNumber");

-- CreateIndex
CREATE INDEX "SeniorCitizen_aadhaarNumber_idx" ON "SeniorCitizen"("aadhaarNumber");

-- CreateIndex
CREATE INDEX "SeniorCitizen_policeStationId_idx" ON "SeniorCitizen"("policeStationId");

-- CreateIndex
CREATE INDEX "SeniorCitizen_beatId_idx" ON "SeniorCitizen"("beatId");

-- CreateIndex
CREATE INDEX "SeniorCitizen_vulnerabilityLevel_idx" ON "SeniorCitizen"("vulnerabilityLevel");

-- CreateIndex
CREATE INDEX "FamilyMember_seniorCitizenId_idx" ON "FamilyMember"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "EmergencyContact_seniorCitizenId_idx" ON "EmergencyContact"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "HouseholdHelp_seniorCitizenId_idx" ON "HouseholdHelp"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "HouseholdHelp_verificationStatus_idx" ON "HouseholdHelp"("verificationStatus");

-- CreateIndex
CREATE INDEX "Document_seniorCitizenId_idx" ON "Document"("seniorCitizenId");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceStation_code_key" ON "PoliceStation"("code");

-- CreateIndex
CREATE INDEX "PoliceStation_code_idx" ON "PoliceStation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Beat_code_key" ON "Beat"("code");

-- CreateIndex
CREATE INDEX "Beat_policeStationId_idx" ON "Beat"("policeStationId");

-- CreateIndex
CREATE UNIQUE INDEX "BeatOfficer_badgeNumber_key" ON "BeatOfficer"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BeatOfficer_mobileNumber_key" ON "BeatOfficer"("mobileNumber");

-- CreateIndex
CREATE INDEX "BeatOfficer_policeStationId_idx" ON "BeatOfficer"("policeStationId");

-- CreateIndex
CREATE INDEX "BeatOfficer_beatId_idx" ON "BeatOfficer"("beatId");

-- CreateIndex
CREATE INDEX "Visit_seniorCitizenId_idx" ON "Visit"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "Visit_officerId_idx" ON "Visit"("officerId");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_scheduledDate_idx" ON "Visit"("scheduledDate");

-- CreateIndex
CREATE INDEX "ServiceRequest_seniorCitizenId_idx" ON "ServiceRequest"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_priority_idx" ON "ServiceRequest"("priority");

-- CreateIndex
CREATE INDEX "SOSAlert_seniorCitizenId_idx" ON "SOSAlert"("seniorCitizenId");

-- CreateIndex
CREATE INDEX "SOSAlert_status_idx" ON "SOSAlert"("status");

-- CreateIndex
CREATE INDEX "SOSAlert_createdAt_idx" ON "SOSAlert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "Role_code_idx" ON "Role"("code");

-- CreateIndex
CREATE INDEX "Role_isActive_idx" ON "Role"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VisitType_code_key" ON "VisitType"("code");

-- CreateIndex
CREATE INDEX "VisitType_code_idx" ON "VisitType"("code");

-- CreateIndex
CREATE INDEX "VisitType_isActive_idx" ON "VisitType"("isActive");

-- CreateIndex
CREATE INDEX "VisitType_priority_idx" ON "VisitType"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "HealthCondition_code_key" ON "HealthCondition"("code");

-- CreateIndex
CREATE INDEX "HealthCondition_severity_idx" ON "HealthCondition"("severity");

-- CreateIndex
CREATE INDEX "HealthCondition_isActive_idx" ON "HealthCondition"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_code_key" ON "Designation"("code");

-- CreateIndex
CREATE INDEX "Designation_department_idx" ON "Designation"("department");

-- CreateIndex
CREATE INDEX "Designation_level_idx" ON "Designation"("level");

-- CreateIndex
CREATE INDEX "Designation_isActive_idx" ON "Designation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "District"("code");

-- CreateIndex
CREATE INDEX "District_range_idx" ON "District"("range");

-- CreateIndex
CREATE INDEX "District_isActive_idx" ON "District"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LivingArrangement_code_key" ON "LivingArrangement"("code");

-- CreateIndex
CREATE INDEX "LivingArrangement_riskLevel_idx" ON "LivingArrangement"("riskLevel");

-- CreateIndex
CREATE INDEX "LivingArrangement_isActive_idx" ON "LivingArrangement"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "_HealthConditions_AB_unique" ON "_HealthConditions"("A", "B");

-- CreateIndex
CREATE INDEX "_HealthConditions_B_index" ON "_HealthConditions"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeniorCitizen" ADD CONSTRAINT "SeniorCitizen_livingArrangementId_fkey" FOREIGN KEY ("livingArrangementId") REFERENCES "LivingArrangement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdHelp" ADD CONSTRAINT "HouseholdHelp_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatOfficer" ADD CONSTRAINT "BeatOfficer_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "BeatOfficer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSAlert" ADD CONSTRAINT "SOSAlert_seniorCitizenId_fkey" FOREIGN KEY ("seniorCitizenId") REFERENCES "SeniorCitizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HealthConditions" ADD CONSTRAINT "_HealthConditions_A_fkey" FOREIGN KEY ("A") REFERENCES "HealthCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HealthConditions" ADD CONSTRAINT "_HealthConditions_B_fkey" FOREIGN KEY ("B") REFERENCES "SeniorCitizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
