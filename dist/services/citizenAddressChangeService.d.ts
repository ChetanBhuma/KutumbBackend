/**
 * Helper Functions for Address Change and Re-Verification
 */
export declare class CitizenAddressChangeService {
    /**
     * Cancel all pending visits for a citizen
     */
    static cancelPendingVisits(citizenId: string, reason: string, cancelledBy?: string): Promise<number>;
    /**
     * Create a re-verification visit after address change
     */
    static createReVerificationVisit(citizenId: string, officerId: string, policeStationId: string, previousAddress?: string): Promise<{
        SeniorCitizen: {
            id: string;
            fullName: string;
        };
        officer: {
            name: string;
            id: string;
            rank: string;
        };
    } & {
        id: string;
        duration: number | null;
        status: import(".prisma/client").$Enums.VisitStatus;
        createdAt: Date;
        updatedAt: Date;
        officerId: string;
        photoUrl: string | null;
        gpsLatitude: number | null;
        gpsLongitude: number | null;
        policeStationId: string;
        beatId: string | null;
        visitType: string;
        priority: string | null;
        seniorCitizenId: string;
        scheduledDate: Date;
        completedDate: Date | null;
        notes: string | null;
        cancelledAt: Date | null;
        cancelledBy: string | null;
        previousAddress: string | null;
        startedAt: Date | null;
        assessmentData: import("@prisma/client/runtime/library").JsonValue | null;
        riskScore: number | null;
    }>;
    /**
     * Reset citizen verification status
     */
    static resetVerificationStatus(citizenId: string, remarks: string): Promise<void>;
}
export default CitizenAddressChangeService;
//# sourceMappingURL=citizenAddressChangeService.d.ts.map