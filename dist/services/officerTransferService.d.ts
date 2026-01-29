/**
 * Service for handling beat officer transfers and bulk citizen reassignment
 */
export declare class OfficerTransferService {
    /**
     * Find available officer in a beat (excluding specific officer)
     * Returns officer with least workload
     */
    static findAvailableOfficerInBeat(beatId: string, excludeOfficerId?: string): Promise<({
        Beat: ({
            SeniorCitizen: {
                id: string;
            }[];
        } & {
            code: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            rangeId: string | null;
            districtId: string | null;
            subDivisionId: string | null;
            policeStationId: string;
            beatNumber: string | null;
            exactLocation: string | null;
            landArea: string | null;
            boundaries: import("@prisma/client/runtime/library").JsonValue | null;
        }) | null;
    } & {
        email: string | null;
        name: string;
        id: string;
        mobileNumber: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rangeId: string | null;
        districtId: string | null;
        subDivisionId: string | null;
        policeStationId: string | null;
        beatId: string | null;
        rank: string;
        badgeNumber: string;
        designationId: string | null;
    }) | null>;
    /**
     * Reassign citizens to available officers when officer transfers
     */
    static reassignCitizensToNewOfficers(citizenIds: string[], beatId: string, excludeOfficerId: string): Promise<any[]>;
    /**
     * Handle scheduled visits when officer transfers
     * Reassign or cancel based on availability
     */
    static handleOfficerTransferVisits(scheduledVisits: any[], reassignments: any[]): Promise<{
        reassigned: number;
        cancelled: number;
    }>;
    /**
     * Preview transfer impact before execution
     */
    static previewTransfer(officerId: string, newBeatId: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            currentBeat: string;
            citizensCount: number;
            scheduledVisitsCount: number;
            availableOfficersInOldBeat: number;
            officersInNewBeat: number;
            canReassignCitizens: boolean;
            citizens: {
                id: any;
                name: any;
            }[];
            scheduledVisits: {
                id: any;
                type: any;
                scheduledDate: any;
            }[];
        };
        message?: undefined;
    }>;
}
export default OfficerTransferService;
//# sourceMappingURL=officerTransferService.d.ts.map