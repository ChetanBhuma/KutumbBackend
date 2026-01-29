"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordFailedAuth = exports.checkIPBan = void 0;
const ipBanService_1 = require("../services/ipBanService");
const logger_1 = require("../config/logger");
/**
 * Middleware to check if IP is banned
 */
const checkIPBan = async (req, res, next) => {
    try {
        const ip = req.ip || 'unknown';
        // Check if IP is banned
        const isBanned = await ipBanService_1.IPBanService.isIPBanned(ip);
        if (isBanned) {
            const banDetails = await ipBanService_1.IPBanService.getBanDetails(ip);
            logger_1.auditLogger.warn('Banned IP attempted access', {
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
    }
    catch (error) {
        next(error);
    }
};
exports.checkIPBan = checkIPBan;
/**
 * Middleware to record failed authentication attempts
 */
const recordFailedAuth = async (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        // Check if authentication failed
        if (res.statusCode === 401 || res.statusCode === 403) {
            const ip = req.ip || 'unknown';
            // Record failed attempt (async, don't wait)
            ipBanService_1.IPBanService.recordFailedAttempt(ip).catch(err => {
                console.error('Failed to record failed attempt:', err);
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.recordFailedAuth = recordFailedAuth;
//# sourceMappingURL=ipBan.js.map