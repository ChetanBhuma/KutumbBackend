import { Request, Response, NextFunction } from 'express';
import { auditLogger } from '../config/logger';

/**
 * SQL Injection detection patterns
 */
/**
 * SQL Injection detection patterns
 * Refined to avoid false positives on common words like "SELECT", "UPDATE"
 * Focuses on comment markers, union-based attacks, and quote manipulation
 */
const SQL_INJECTION_PATTERNS = [
    /(\b(UNION\s+ALL\s+SELECT|UNION\s+SELECT)\b)/gi, // Union-based injection
    /(--|;|\/\*|\*\/|xp_|sp_)/gi, // Comment markers and stored procedures
    /(';|";|';|";)/gi, // Statement termination
    /(\b(OR|AND)\s+[\d']+\s*=\s*[\d'])/gi // Tautologies (OR 1=1)
];

/**
 * XSS detection patterns
 * Blocks script tags, javascript: URIs, and common event handlers
 */
const XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /vbscript:/gi,
    /data:text\/html/gi
];

/**
 * Path traversal detection
 */
const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%252e%252e%252f/gi
];

/**
 * Middleware to detect and block malicious input
 */
export const detectMaliciousInput = (req: Request, res: Response, next: NextFunction): any => {
    const checkInput = (input: any, location: string): boolean => {
        if (typeof input === 'string') {
            // Check for SQL injection
            for (const pattern of SQL_INJECTION_PATTERNS) {
                if (pattern.test(input)) {
                    auditLogger.warn('SQL injection attempt detected', {
                        location,
                        input,
                        ip: req.ip,
                        userAgent: req.get('user-agent'),
                        path: req.path
                    });
                    return true;
                }
            }

            // Check for XSS
            for (const pattern of XSS_PATTERNS) {
                if (pattern.test(input)) {
                    auditLogger.warn('XSS attempt detected', {
                        location,
                        input,
                        ip: req.ip,
                        userAgent: req.get('user-agent'),
                        path: req.path
                    });
                    return true;
                }
            }

            // Check for path traversal
            for (const pattern of PATH_TRAVERSAL_PATTERNS) {
                if (pattern.test(input)) {
                    auditLogger.warn('Path traversal attempt detected', {
                        location,
                        input,
                        ip: req.ip,
                        userAgent: req.get('user-agent'),
                        path: req.path
                    });
                    return true;
                }
            }
        } else if (typeof input === 'object' && input !== null) {
            // Recursively check object properties
            for (const key in input) {
                if (checkInput(input[key], `${location}.${key}`)) {
                    return true;
                }
            }
        }

        return false;
    };

    // Check request body
    if (req.body && checkInput(req.body, 'body')) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Malicious input detected. Request blocked for security reasons.'
            }
        });
    }

    // Check query parameters
    if (req.query && checkInput(req.query, 'query')) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Malicious input detected. Request blocked for security reasons.'
            }
        });
    }

    // Check URL parameters
    if (req.params && checkInput(req.params, 'params')) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Malicious input detected. Request blocked for security reasons.'
            }
        });
    }

    next();
};

/**
 * Middleware to prevent NoSQL injection
 */
export const preventNoSQLInjection = (req: Request, _res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                // Remove MongoDB operators
                if (key.startsWith('$')) {
                    delete obj[key];
                    auditLogger.warn('NoSQL injection attempt detected', {
                        key,
                        ip: req.ip,
                        path: req.path
                    });
                } else {
                    obj[key] = sanitize(obj[key]);
                }
            }
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }

    next();
};
