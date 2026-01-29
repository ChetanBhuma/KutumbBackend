import { Request, Response, NextFunction } from 'express';
/**
 * CSRF protection middleware
 * Uses double-submit cookie pattern
 */
export declare const csrfProtection: import("express-serve-static-core").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Middleware to attach CSRF token to response
 */
export declare const attachCsrfToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Endpoint to get CSRF token
 */
export declare const getCsrfToken: (req: Request, res: Response) => void;
/**
 * CSRF error handler
 */
export declare const csrfErrorHandler: (err: any, _req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=csrf.d.ts.map