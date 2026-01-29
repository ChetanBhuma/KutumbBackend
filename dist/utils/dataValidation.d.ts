/**
 * Data validation utilities
 */
/**
 * Normalize Aadhaar number by removing spaces and validating format
 */
export declare const normalizeAadhaar: (aadhaar: string) => string;
/**
 * Validate Aadhaar number format
 */
export declare const validateAadhaar: (aadhaar: string) => boolean;
/**
 * Calculate age from date of birth
 */
export declare const calculateAge: (dateOfBirth: Date) => number;
/**
 * Validate age for senior citizen (must be >= 60)
 */
export declare const validateSeniorCitizenAge: (dateOfBirth: Date) => {
    valid: boolean;
    age: number;
    message?: string;
};
/**
 * Validate visit duration (10 to 480 minutes)
 */
export declare const validateVisitDuration: (duration: number) => {
    valid: boolean;
    message?: string;
};
/**
 * Normalize mobile number to +91 format
 */
export declare const normalizeMobile: (mobile: string) => string;
//# sourceMappingURL=dataValidation.d.ts.map