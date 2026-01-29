"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPBanService = void 0;
const redisService_1 = require("./redisService");
const logger_1 = require("../config/logger");
class IPBanService {
    static BAN_PREFIX = 'banned_ip:';
    static FAILED_ATTEMPTS_PREFIX = 'failed_attempts:';
    static MAX_FAILED_ATTEMPTS = 5;
    static BAN_DURATION = 24 * 60 * 60; // 24 hours in seconds
    static ATTEMPT_WINDOW = 15 * 60; // 15 minutes in seconds
    /**
     * Check if IP is banned
     */
    static async isIPBanned(ip) {
        const key = `${this.BAN_PREFIX}${ip}`;
        return await redisService_1.redisService.exists(key);
    }
    /**
     * Ban an IP address
     */
    static async banIP(ip, reason, permanent = false, durationSeconds) {
        const key = `${this.BAN_PREFIX}${ip}`;
        const banData = {
            ip,
            reason,
            bannedAt: new Date(),
            permanent,
            expiresAt: permanent ? undefined : new Date(Date.now() + (durationSeconds || this.BAN_DURATION) * 1000)
        };
        if (permanent) {
            await redisService_1.redisService.set(key, JSON.stringify(banData));
        }
        else {
            await redisService_1.redisService.set(key, JSON.stringify(banData), durationSeconds || this.BAN_DURATION);
        }
        // Log ban event
        logger_1.auditLogger.warn('IP banned', {
            ip,
            reason,
            permanent,
            duration: permanent ? 'permanent' : `${durationSeconds || this.BAN_DURATION}s`,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Unban an IP address
     */
    static async unbanIP(ip) {
        const key = `${this.BAN_PREFIX}${ip}`;
        await redisService_1.redisService.delete(key);
        logger_1.auditLogger.info('IP unbanned', {
            ip,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Get ban details
     */
    static async getBanDetails(ip) {
        const key = `${this.BAN_PREFIX}${ip}`;
        const data = await redisService_1.redisService.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    /**
     * Record failed attempt
     */
    static async recordFailedAttempt(ip) {
        const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
        const data = await redisService_1.redisService.get(key);
        let attempts;
        if (data) {
            attempts = JSON.parse(data);
            attempts.count++;
            attempts.lastAttempt = new Date();
        }
        else {
            attempts = {
                count: 1,
                firstAttempt: new Date(),
                lastAttempt: new Date()
            };
        }
        // Store for attempt window duration
        await redisService_1.redisService.set(key, JSON.stringify(attempts), this.ATTEMPT_WINDOW);
        // Auto-ban if threshold exceeded
        if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
            await this.banIP(ip, `Exceeded ${this.MAX_FAILED_ATTEMPTS} failed attempts in ${this.ATTEMPT_WINDOW / 60} minutes`, false, this.BAN_DURATION);
            // Clear failed attempts
            await redisService_1.redisService.delete(key);
        }
    }
    /**
     * Clear failed attempts for IP
     */
    static async clearFailedAttempts(ip) {
        const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
        await redisService_1.redisService.delete(key);
    }
    /**
     * Get failed attempts count
     */
    static async getFailedAttemptsCount(ip) {
        const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
        const data = await redisService_1.redisService.get(key);
        if (!data)
            return 0;
        const attempts = JSON.parse(data);
        return attempts.count;
    }
    /**
     * Get all banned IPs (for admin dashboard)
     */
    static async getAllBannedIPs() {
        // Note: This is a simplified version
        // In production, use Redis SCAN to iterate through keys
        return [];
    }
}
exports.IPBanService = IPBanService;
//# sourceMappingURL=ipBanService.js.map