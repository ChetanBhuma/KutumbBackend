import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Common validation rules
 */
export declare class ValidationRules {
    /**
     * Email validation
     */
    static email(): ValidationChain;
    /**
     * Phone validation (Indian format)
     */
    static phone(): ValidationChain;
    /**
     * Password validation
     */
    static password(): ValidationChain;
    /**
     * Name validation
     */
    static fullName(field?: string): ValidationChain;
    /**
     * Aadhaar number validation
     */
    static aadhaar(): ValidationChain;
    /**
     * ID validation (CUID - flexible for development)
     * Accepts:
     * - Production CUIDs: c[24 alphanumeric chars]
     * - Seed/Test IDs: citizen-1, officer-2, etc.
     * - Other CUID-like formats
     */
    static id(paramName?: string): ValidationChain;
    /**
     * Pagination validation
     */
    static pagination(): ValidationChain[];
    /**
     * Date validation
     */
    static date(field?: string): ValidationChain;
    /**
     * Enum validation
     */
    static enum(field: string, allowedValues: string[]): ValidationChain;
    /**
     * Sanitize HTML to prevent XSS
     */
    static sanitizeHtml(field: string): ValidationChain;
    /**
     * URL validation
     */
    static url(field?: string): ValidationChain;
    /**
     * Latitude validation
     */
    static latitude(): ValidationChain;
    /**
     * Longitude validation
     */
    static longitude(): ValidationChain;
    /**
     * File upload validation
     */
    static fileUpload(field?: string): ValidationChain;
}
/**
 * Sanitization middleware to prevent XSS
 */
export declare const sanitizeInput: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map