/**
 * Soft delete cascade logic
 * When a citizen is soft-deleted (isActive = false), this handles cleanup of related records
 */
export declare const handleCitizenSoftDelete: (citizenId: string) => Promise<{
    success: boolean;
    cancelledVisits: number;
    resolvedAlerts: number;
    closedRequests: number;
}>;
//# sourceMappingURL=softDeleteCascade.d.ts.map