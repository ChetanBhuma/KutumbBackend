import { Request, Response, NextFunction } from 'express';
import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Common validation rules
 */
export class ValidationRules {
    /**
     * Email validation
     */
    static email(): ValidationChain {
        return body('email')
            .trim()
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email must not exceed 255 characters');
    }

    /**
     * Phone validation (Indian format)
     */
    static phone(): ValidationChain {
        return body('phone')
            .trim()
            .matches(/^\+?91?[6-9]\d{9}$/)
            .withMessage('Valid Indian phone number is required (10 digits starting with 6-9)');
    }

    /**
     * Password validation
     */
    static password(): ValidationChain {
        return body('password')
            .isLength({ min: 8, max: 128 })
            .withMessage('Password must be between 8 and 128 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain uppercase, lowercase, number, and special character');
    }

    /**
     * Name validation
     */
    static fullName(field: string = 'name'): ValidationChain {
        return body(field)
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage(`${field} must be between 2 and 100 characters`)
            .matches(/^[a-zA-Z\s'-]+$/)
            .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);
    }

    /**
     * Aadhaar number validation
     */
    static aadhaar(): ValidationChain {
        return body('aadharNumber')
            .optional()
            .trim()
            .matches(/^\d{12}$/)
            .withMessage('Aadhaar number must be 12 digits');
    }

    /**
     * ID validation (CUID - flexible for development)
     * Accepts:
     * - Production CUIDs: c[24 alphanumeric chars]
     * - Seed/Test IDs: citizen-1, officer-2, etc.
     * - Other CUID-like formats
     */
    static id(paramName: string = 'id'): ValidationChain {
        return param(paramName)
            .trim()
            .custom((value) => {
                // Accept CUID format (production): c followed by 24 alphanumeric chars
                const cuidPattern = /^c[a-z0-9]{24}$/;
                // Accept seed/test IDs (development): word-number format
                const seedPattern = /^[a-z]+-\d+$/;
                // Accept any cuid-like format (starts with 'c' and has alphanumerics)
                const flexibleCuid = /^c[a-z0-9]+$/;

                if (cuidPattern.test(value) || seedPattern.test(value) || flexibleCuid.test(value)) {
                    return true;
                }
                throw new Error('Invalid ID format. Expected CUID or test ID format (e.g., citizen-1).');
            });
    }

    /**
     * Pagination validation
     */
    static pagination() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer')
                .toInt(),
            query('limit')
                .optional()
                .isInt({ min: 1, max: 1000 })
                .withMessage('Limit must be between 1 and 1000')
                .toInt()
        ];
    }

    /**
     * Date validation
     */
    static date(field: string = 'date'): ValidationChain {
        return body(field)
            .isISO8601()
            .withMessage(`${field} must be a valid ISO 8601 date`)
            .toDate();
    }

    /**
     * Enum validation
     */
    static enum(field: string, allowedValues: string[]): ValidationChain {
        return body(field)
            .isIn(allowedValues)
            .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    static sanitizeHtml(field: string): ValidationChain {
        return body(field)
            .trim()
            .escape() // Escape HTML characters
            .stripLow(); // Remove control characters
    }

    /**
     * URL validation
     */
    static url(field: string = 'url'): ValidationChain {
        return body(field)
            .optional()
            .trim()
            .isURL({ protocols: ['http', 'https'], require_protocol: true })
            .withMessage(`${field} must be a valid URL`);
    }

    /**
     * Latitude validation
     */
    static latitude(): ValidationChain {
        return body('latitude')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90')
            .toFloat();
    }

    /**
     * Longitude validation
     */
    static longitude(): ValidationChain {
        return body('longitude')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180')
            .toFloat();
    }

    /**
     * File upload validation
     */
    static fileUpload(field: string = 'file') {
        return body(field)
            .custom((_value, { req }) => {
                const file = req.file;
                if (!file) {
                    throw new Error('File is required');
                }

                // Check file size (10MB max)
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error('File size must not exceed 10MB');
                }

                // Check file type
                const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    throw new Error('File type must be JPEG, PNG, or PDF');
                }

                return true;
            });
    }
}

/**
 * Sanitization middleware to prevent XSS
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
    // Sanitize all string inputs in body
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Remove any script tags and potentially dangerous content
                req.body[key] = req.body[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
        });
    }

    next();
};
