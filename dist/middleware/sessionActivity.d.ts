import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
/**
 * Session activity tracking
 */
interface SessionActivity {
    userId: string;
    lastActivity: Date;
    ip: string;
    userAgent: string;
}
export declare class SessionService {
    private static readonly SESSION_TIMEOUT;
    private static readonly ACTIVITY_PREFIX;
    /**
     * Update session activity
     */
    static updateActivity(userId: string, ip: string, userAgent: string): Promise<void>;
    /**
     * Get session activity
     */
    static getActivity(userId: string): Promise<SessionActivity | null>;
    /**
     * Check if session is active
     */
    static isSessionActive(userId: string): Promise<boolean>;
    /**
     * Invalidate session
     */
    static invalidateSession(userId: string): Promise<void>;
}
/**
 * Middleware to track session activity and auto-logout
 */
export declare const sessionActivityTracker: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to detect suspicious session activity
 */
export declare const detectSuspiciousActivity: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=sessionActivity.d.ts.map