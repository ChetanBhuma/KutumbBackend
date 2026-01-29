import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { redisService } from '../services/redisService';
import { auditLogger } from '../config/logger';

/**
 * Session activity tracking
 */
interface SessionActivity {
    userId: string;
    lastActivity: Date;
    ip: string;
    userAgent: string;
}

export class SessionService {
    private static readonly SESSION_TIMEOUT = 30 * 60; // 30 minutes in seconds
    private static readonly ACTIVITY_PREFIX = 'session_activity:';

    /**
     * Update session activity
     */
    static async updateActivity(userId: string, ip: string, userAgent: string): Promise<void> {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        const activity: SessionActivity = {
            userId,
            lastActivity: new Date(),
            ip,
            userAgent
        };

        await redisService.set(key, JSON.stringify(activity), this.SESSION_TIMEOUT);
    }

    /**
     * Get session activity
     */
    static async getActivity(userId: string): Promise<SessionActivity | null> {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        const data = await redisService.get(key);

        if (!data) return null;

        return JSON.parse(data);
    }

    /**
     * Check if session is active
     */
    static async isSessionActive(userId: string): Promise<boolean> {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        return await redisService.exists(key);
    }

    /**
     * Invalidate session
     */
    static async invalidateSession(userId: string): Promise<void> {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        await redisService.delete(key);

        // Also delete refresh token
        await redisService.deleteRefreshToken(userId);

        auditLogger.info('Session invalidated', {
            userId,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Middleware to track session activity and auto-logout
 */
export const sessionActivityTracker = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next();
    }

    try {
        const userId = req.user.id;
        const ip = req.ip || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';

        // Check if session is still active
        const isActive = await SessionService.isSessionActive(userId);

        if (!isActive) {
            // Session expired - auto logout
            auditLogger.info('Session expired - auto logout', {
                userId,
                ip,
                path: req.path,
                timestamp: new Date().toISOString()
            });

            return res.status(401).json({
                success: false,
                error: {
                    message: 'Session expired. Please login again.',
                    code: 'SESSION_EXPIRED',
                    redirectTo: '/login'
                }
            });
        }

        // Update activity timestamp
        await SessionService.updateActivity(userId, ip, userAgent);

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to detect suspicious session activity
 */
export const detectSuspiciousActivity = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next();
    }

    try {
        const userId = req.user.id;
        const currentIP = req.ip || 'unknown';
        const currentUserAgent = req.get('user-agent') || 'unknown';

        // Get previous activity
        const previousActivity = await SessionService.getActivity(userId);

        if (previousActivity) {
            // Check for IP change
            if (previousActivity.ip !== currentIP) {
                auditLogger.warn('Suspicious activity - IP change detected', {
                    userId,
                    previousIP: previousActivity.ip,
                    currentIP,
                    path: req.path,
                    timestamp: new Date().toISOString()
                });

                // Optional: Force re-authentication on IP change
                // Uncomment for stricter security
                /*
                await SessionService.invalidateSession(userId);
                return res.status(401).json({
                  success: false,
                  error: {
                    message: 'Security alert: IP address changed. Please login again.',
                    code: 'IP_CHANGED',
                    redirectTo: '/login'
                  }
                });
                */
            }

            // Check for user agent change
            if (previousActivity.userAgent !== currentUserAgent) {
                auditLogger.warn('Suspicious activity - User agent change detected', {
                    userId,
                    previousUserAgent: previousActivity.userAgent,
                    currentUserAgent,
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};
