export interface DuplicateMatch {
    citizenId: string;
    fullName: string;
    mobileNumber: string;
    aadhaarNumber?: string | null;
    dateOfBirth: Date;
    permanentAddress: string;
    matchScore: number;
    matchReasons: string[];
}
export interface DuplicateCheckResult {
    hasDuplicates: boolean;
    duplicates: DuplicateMatch[];
    confidence: 'High' | 'Medium' | 'Low';
}
/**
 * Check for duplicate citizens based on multiple criteria
 */
export declare const checkForDuplicates: (citizenData: {
    fullName: string;
    mobileNumber: string;
    aadhaarNumber?: string | null;
    dateOfBirth?: Date;
    excludeCitizenId?: string;
}) => Promise<DuplicateCheckResult>;
/**
 * Find all potential duplicates in the system
 */
export declare const findAllDuplicates: () => Promise<Array<{
    citizen: any;
    duplicates: DuplicateMatch[];
}>>;
//# sourceMappingURL=duplicateDetectionService.d.ts.map