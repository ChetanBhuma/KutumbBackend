import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to detect and block malicious input
 */
export declare const detectMaliciousInput: (req: Request, res: Response, next: NextFunction) => any;
/**
 * Middleware to prevent NoSQL injection
 */
export declare const preventNoSQLInjection: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=securityValidation.d.ts.map