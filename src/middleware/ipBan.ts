import { Request, Response, NextFunction } from 'express';
import { IPBanService } from '../services/ipBanService';
import { auditLogger } from '../config/logger';

/**
 * Middleware to check if IP is banned
 */
export const checkIPBan = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const ip = req.ip || 'unknown';

        // Check if IP is banned
        const isBanned = await IPBanService.isIPBanned(ip);

        if (isBanned) {
            const banDetails = await IPBanService.getBanDetails(ip);

            auditLogger.warn('Banned IP attempted access', {
                ip,
                path: req.path,
                method: req.method,
                banReason: banDetails?.reason,
                timestamp: new Date().toISOString()
            });

            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied. Your IP address has been banned.',
                    reason: banDetails?.reason,
                    bannedAt: banDetails?.bannedAt,
                    expiresAt: banDetails?.expiresAt,
                    contact: 'Please contact administrator if you believe this is an error.'
                }
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to record failed authentication attempts
 */
export const recordFailedAuth = async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
        // Check if authentication failed
        if (res.statusCode === 401 || res.statusCode === 403) {
            const ip = req.ip || 'unknown';

            // Record failed attempt (async, don't wait)
            IPBanService.recordFailedAttempt(ip).catch(err => {
                console.error('Failed to record failed attempt:', err);
            });
        }

        return originalSend.call(this, data);
    };

    next();
};
