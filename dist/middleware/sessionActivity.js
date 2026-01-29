"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSuspiciousActivity = exports.sessionActivityTracker = exports.SessionService = void 0;
const redisService_1 = require("../services/redisService");
const logger_1 = require("../config/logger");
class SessionService {
    static SESSION_TIMEOUT = 30 * 60; // 30 minutes in seconds
    static ACTIVITY_PREFIX = 'session_activity:';
    /**
     * Update session activity
     */
    static async updateActivity(userId, ip, userAgent) {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        const activity = {
            userId,
            lastActivity: new Date(),
            ip,
            userAgent
        };
        await redisService_1.redisService.set(key, JSON.stringify(activity), this.SESSION_TIMEOUT);
    }
    /**
     * Get session activity
     */
    static async getActivity(userId) {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        const data = await redisService_1.redisService.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    /**
     * Check if session is active
     */
    static async isSessionActive(userId) {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        return await redisService_1.redisService.exists(key);
    }
    /**
     * Invalidate session
     */
    static async invalidateSession(userId) {
        const key = `${this.ACTIVITY_PREFIX}${userId}`;
        await redisService_1.redisService.delete(key);
        // Also delete refresh token
        await redisService_1.redisService.deleteRefreshToken(userId);
        logger_1.auditLogger.info('Session invalidated', {
            userId,
            timestamp: new Date().toISOString()
        });
    }
}
exports.SessionService = SessionService;
/**
 * Middleware to track session activity and auto-logout
 */
const sessionActivityTracker = async (req, res, next) => {
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
            logger_1.auditLogger.info('Session expired - auto logout', {
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
    }
    catch (error) {
        next(error);
    }
};
exports.sessionActivityTracker = sessionActivityTracker;
/**
 * Middleware to detect suspicious session activity
 */
const detectSuspiciousActivity = async (req, _res, next) => {
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
                logger_1.auditLogger.warn('Suspicious activity - IP change detected', {
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
                logger_1.auditLogger.warn('Suspicious activity - User agent change detected', {
                    userId,
                    previousUserAgent: previousActivity.userAgent,
                    currentUserAgent,
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.detectSuspiciousActivity = detectSuspiciousActivity;
//# sourceMappingURL=sessionActivity.js.map