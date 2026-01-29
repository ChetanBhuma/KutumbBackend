export interface VisitConflict {
    hasConflict: boolean;
    conflictingVisits?: Array<{
        id: string;
        scheduledDate: Date;
        duration?: number | null;
        seniorCitizenId: string;
        status: string;
    }>;
}
/**
 * Check if a new visit conflicts with existing visits for an officer
 * Logic: Two visits conflict if their time ranges overlap
 * Visit A: [start, end], Visit B: [start, end]
 * Conflict if: A.start < B.end AND A.end > B.start
 */
export declare const checkVisitConflict: (officerId: string, scheduledDate: Date, duration?: number, // default 30 minutes
excludeVisitId?: string) => Promise<VisitConflict>;
/**
 * Get officer's schedule for a date range
 */
export declare const getOfficerSchedule: (officerId: string, startDate: Date, endDate: Date) => Promise<({
    SeniorCitizen: {
        id: string;
        fullName: string;
        permanentAddress: string;
        vulnerabilityLevel: string;
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
})[]>;
//# sourceMappingURL=visitScheduler.d.ts.map