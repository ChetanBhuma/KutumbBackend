import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
/**
 * Middleware to log all API requests and responses
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to log data modifications
 */
export declare const dataModificationLogger: (operation: "CREATE" | "UPDATE" | "DELETE", resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to log authentication events
 */
export declare const authEventLogger: (event: "LOGIN" | "LOGOUT" | "REGISTER" | "OTP_SENT" | "OTP_VERIFIED") => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to log security incidents
 */
export declare const securityIncidentLogger: (incidentType: "BRUTE_FORCE" | "MALICIOUS_INPUT" | "UNAUTHORIZED_ACCESS" | "SUSPICIOUS_ACTIVITY", severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=requestLogger.d.ts.map