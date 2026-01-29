/**
 * Handle officer leave - reassign scheduled visits to backup officer
 */
export declare const handleLeaveReassignment: (officerId: string, leaveStartDate: Date, leaveEndDate: Date) => Promise<{
    reassignedCount: number;
    error?: undefined;
    backupOfficerId?: undefined;
} | {
    reassignedCount: number;
    error: string;
    backupOfficerId?: undefined;
} | {
    reassignedCount: number;
    backupOfficerId: string;
    error?: undefined;
}>;
//# sourceMappingURL=leaveReassignment.d.ts.map