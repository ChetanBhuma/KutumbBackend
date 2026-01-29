import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to check if IP is banned
 */
export declare const checkIPBan: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Middleware to record failed authentication attempts
 */
export declare const recordFailedAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ipBan.d.ts.map