/**
 * Data validation utilities
 */

/**
 * Normalize Aadhaar number by removing spaces and validating format
 */
export const normalizeAadhaar = (aadhaar: string): string => {
    // Remove all non-digit characters
    const cleaned = aadhaar.replace(/\D/g, '');

    // Validate length
    if (cleaned.length !== 12) {
        throw new Error('Aadhaar number must be exactly 12 digits');
    }

    return cleaned;
};

/**
 * Validate Aadhaar number format
 */
export const validateAadhaar = (aadhaar: string): boolean => {
    const cleaned = aadhaar.replace(/\D/g, '');
    return /^\d{12}$/.test(cleaned);
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Validate age for senior citizen (must be >= 60)
 */
export const validateSeniorCitizenAge = (dateOfBirth: Date): { valid: boolean; age: number; message?: string } => {
    const age = calculateAge(dateOfBirth);

    if (age < 60) {
        return {
            valid: false,
            age,
            message: `Age must be at least 60 years. Current age: ${age} years`
        };
    }

    return { valid: true, age };
};

/**
 * Validate visit duration (10 to 480 minutes)
 */
export const validateVisitDuration = (duration: number): { valid: boolean; message?: string } => {
    const MIN_DURATION = 10;  // 10 minutes
    const MAX_DURATION = 480; // 8 hours

    if (duration < MIN_DURATION || duration > MAX_DURATION) {
        return {
            valid: false,
            message: `Visit duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`
        };
    }

    return { valid: true };
};

/**
 * Normalize mobile number to +91 format
 */
export const normalizeMobile = (mobile: string): string => {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');

    // Validate and format
    if (digits.length === 10) {
        return `+91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
        return `+${digits}`;
    }

    throw new Error(`Invalid mobile number: ${mobile}. Must be 10 digits or +91XXXXXXXXXX`);
};
