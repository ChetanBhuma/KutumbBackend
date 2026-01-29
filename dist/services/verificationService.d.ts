export type VerificationEntityType = 'HouseholdHelp' | 'EmergencyContact' | 'Tenant' | 'SeniorCitizen' | 'Other';
export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
export type VerificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type VerificationMethod = 'Physical' | 'Document' | 'Phone' | 'BackgroundCheck';
export interface CreateVerificationRequestData {
    entityType: VerificationEntityType;
    entityId: string;
    seniorCitizenId: string;
    requestedBy: string;
    priority?: VerificationPriority;
    remarks?: string;
    documents?: string[];
}
export interface UpdateVerificationStatusData {
    status: VerificationStatus;
    verifiedBy?: string;
    verificationMethod?: VerificationMethod;
    verificationNotes?: string;
    rejectionReason?: string;
}
/**
 * Create a verification request
 */
export declare const createVerificationRequest: (data: CreateVerificationRequestData) => Promise<{
    seniorCitizen: {
        id: string;
        mobileNumber: string;
        fullName: string;
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
    documents: string[];
    priority: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    remarks: string | null;
    assignedTo: string | null;
    assignedAt: Date | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    verificationMethod: string | null;
    verificationNotes: string | null;
    rejectionReason: string | null;
    seniorCitizenId: string;
}>;
/**
 * Assign verification request to an officer
 */
export declare const assignVerificationRequest: (requestId: string, officerId: string) => Promise<{
    seniorCitizen: {
        userId: string | null;
        email: string | null;
        id: string;
        status: string;
        mobileNumber: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        aadhaarNumber: string | null;
        registrationNo: string | null;
        srCitizenUniqueId: string | null;
        fullName: string;
        dateOfBirth: Date;
        age: number;
        gender: string;
        photoUrl: string | null;
        maritalStatus: string | null;
        occupation: string | null;
        yearOfRetirement: number | null;
        nationality: string;
        religion: string | null;
        languagesKnown: string[];
        voterIdNumber: string | null;
        panNumber: string | null;
        passportNumber: string | null;
        healthId: string | null;
        socialChatIds: string | null;
        alternateMobile: string | null;
        preferredContactMode: string;
        permanentAddress: string;
        presentAddress: string | null;
        pinCode: string;
        gpsLatitude: number | null;
        gpsLongitude: number | null;
        landmark: string | null;
        rangeId: string | null;
        districtId: string | null;
        subDivisionId: string | null;
        policeStationId: string | null;
        beatId: string | null;
        livingArrangementId: string | null;
        livingArrangement: string | null;
        numberOfChildren: number | null;
        consentToNotifyFamily: boolean;
        bloodGroup: string | null;
        healthConditions: string[];
        allergies: string | null;
        regularDoctor: string | null;
        doctorContact: string | null;
        healthInsurance: string | null;
        mobilityConstraints: string | null;
        consentShareHealth: boolean;
        registeredOnApp: boolean;
        deviceId: string | null;
        appRegistrationDate: Date | null;
        consentNotifications: boolean;
        digitalCardIssued: boolean;
        digitalCardNumber: string | null;
        digitalCardIssueDate: Date | null;
        preferredVisitDay: string | null;
        preferredVisitTime: string | null;
        freeTime: string | null;
        visitNotes: string | null;
        lastVisitDate: Date | null;
        vulnerabilityLevel: string;
        interestedServices: string[];
        consentServiceRequest: boolean;
        consentDataUse: boolean;
        consentDate: Date | null;
        signatureUrl: string | null;
        applicationReceivedOn: Date;
        receivedBy: string | null;
        idVerificationStatus: import(".prisma/client").$Enums.IdentityStatus;
        officialRemarks: string | null;
        dataEntryCompletedBy: string | null;
        dataEntryDate: Date | null;
        formCode: string;
        formVersion: string;
        submissionType: string;
        maritalStatusId: string | null;
        aadhaarNoMasked: string | null;
        aadhaarVerified: boolean;
        addressLine1: string | null;
        addressLine2: string | null;
        allowDataExport: boolean;
        allowDataShareWithFamily: boolean;
        allowFamilyNotification: boolean;
        allowNotifications: boolean;
        beatCode: string | null;
        city: string | null;
        consentAcceptedOn: Date | null;
        consentScheduledVisitReminder: boolean;
        consentVersion: string | null;
        createdBy: string | null;
        deletedBy: string | null;
        deletedOn: Date | null;
        digitalIdIssuedDate: Date | null;
        digitalQrCodeUrl: string | null;
        disabilityCertificateNo: string | null;
        educationQualification: string | null;
        emergencyHospitalPreference: string | null;
        familyType: string | null;
        geoJsonBeatId: string | null;
        isMobileRegistered: boolean;
        isSoftDeleted: boolean;
        lastAppLogin: Date | null;
        lastAssessmentDate: Date | null;
        locality: string | null;
        mobilityStatus: string | null;
        nextScheduledVisitDate: Date | null;
        physicalDisability: boolean;
        policePostCode: string | null;
        policePostName: string | null;
        portalReferenceId: string | null;
        primaryDeviceId: string | null;
        primaryFamilyContactId: string | null;
        primaryFcmToken: string | null;
        registrationDate: Date | null;
        retiredFrom: string | null;
        sourceSystem: string | null;
        state: string | null;
        updatedBy: string | null;
        visitRemarks: string | null;
        vulnerabilityScore: number | null;
        whatsappNumber: string | null;
        nearbyFamilyDetails: string | null;
        healthInsuranceDetails: string | null;
        addressProofUrl: string | null;
        telephoneNumber: string | null;
        specialization: string | null;
        residingWith: string | null;
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
    documents: string[];
    priority: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    remarks: string | null;
    assignedTo: string | null;
    assignedAt: Date | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    verificationMethod: string | null;
    verificationNotes: string | null;
    rejectionReason: string | null;
    seniorCitizenId: string;
}>;
/**
 * Update verification status
 */
export declare const updateVerificationStatus: (requestId: string, updateData: UpdateVerificationStatusData) => Promise<{
    id: string;
    status: import(".prisma/client").$Enums.VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
    documents: string[];
    priority: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    remarks: string | null;
    assignedTo: string | null;
    assignedAt: Date | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    verificationMethod: string | null;
    verificationNotes: string | null;
    rejectionReason: string | null;
    seniorCitizenId: string;
}>;
/**
 * Get verification requests with filters
 */
export declare const getVerificationRequests: (filters: {
    status?: VerificationStatus;
    entityType?: VerificationEntityType;
    assignedTo?: string;
    seniorCitizenId?: string;
    priority?: VerificationPriority;
}) => Promise<({
    seniorCitizen: {
        id: string;
        mobileNumber: string;
        fullName: string;
        permanentAddress: string;
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
    documents: string[];
    priority: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    remarks: string | null;
    assignedTo: string | null;
    assignedAt: Date | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    verificationMethod: string | null;
    verificationNotes: string | null;
    rejectionReason: string | null;
    seniorCitizenId: string;
})[]>;
/**
 * Get verification statistics
 */
export declare const getVerificationStatistics: (filters?: {
    entityType?: VerificationEntityType;
    assignedTo?: string;
}) => Promise<{
    total: number;
    byStatus: {
        pending: number;
        inProgress: number;
        approved: number;
        rejected: number;
    };
    approvalRate: string | number;
}>;
//# sourceMappingURL=verificationService.d.ts.map