import { redisService } from './redisService';
import { auditLogger } from '../config/logger';

interface BannedIP {
    ip: string;
    reason: string;
    bannedAt: Date;
    expiresAt?: Date;
    permanent: boolean;
}

interface FailedAttempt {
    count: number;
    firstAttempt: Date;
    lastAttempt: Date;
}

export class IPBanService {
    private static readonly BAN_PREFIX = 'banned_ip:';
    private static readonly FAILED_ATTEMPTS_PREFIX = 'failed_attempts:';
    private static readonly MAX_FAILED_ATTEMPTS = 5;
    private static readonly BAN_DURATION = 24 * 60 * 60; // 24 hours in seconds
    private static readonly ATTEMPT_WINDOW = 15 * 60; // 15 minutes in seconds

    /**
     * Check if IP is banned
     */
    static async isIPBanned(ip: string): Promise<boolean> {
        const key = `${this.BAN_PREFIX}${ip}`;
        return await redisService.exists(key);
    }

    /**
     * Ban an IP address
     */
    static async banIP(
        ip: string,
        reason: string,
        permanent: boolean = false,
        durationSeconds?: number
    ): Promise<void> {
        const key = `${this.BAN_PREFIX}${ip}`;
        const banData: BannedIP = {
            ip,
            reason,
            bannedAt: new Date(),
            permanent,
            expiresAt: permanent ? undefined : new Date(Date.now() + (durationSeconds || this.BAN_DURATION) * 1000)
        };

        if (permanent) {
            await redisService.set(key, JSON.stringify(banData));
        } else {
            await redisService.set(key, JSON.stringify(banData), durationSeconds || this.BAN_DURATION);
        }

        // Log ban event
        auditLogger.warn('IP banned', {
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
    static async unbanIP(ip: string): Promise<void> {
        const key = `${this.BAN_PREFIX}${ip}`;
        await redisService.delete(key);

        auditLogger.info('IP unbanned', {
            ip,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get ban details
     */
    static async getBanDetails(ip: string): Promise<BannedIP | null> {
        const key = `${this.BAN_PREFIX}${ip}`;
        const data = await redisService.get(key);

        if (!data) return null;

        return JSON.parse(data);
    }

    /**
     * Record failed attempt
     */
    static async recordFailedAttempt(ip: string): Promise<void> {
        const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
        const data = await redisService.get(key);

        let attempts: FailedAttempt;

        if (data) {
            attempts = JSON.parse(data);
            attempts.count++;
            attempts.lastAttempt = new Date();
        } else {
            attempts = {
                count: 1,
                firstAttempt: new Date(),
                lastAttempt: new Date()
            };
        }

        // Store for attempt window duration
        await redisService.set(key, JSON.stringify(attempts), this.ATTEMPT_WINDOW);

        // Auto-ban if threshold exceeded
        if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
            await this.banIP(
                ip,
                `Exceeded ${this.MAX_FAILED_ATTEMPTS} failed attempts in ${this.ATTEMPT_WINDOW / 60} minutes`,
                false,
                this.BAN_DURATION
            );

            // Clear failed attempts
            await redisService.delete(key);
        }
    }

    /**
     * Clear failed attempts for IP
     */
    static async clearFailedAttempts(ip: string): Promise<void> {
        const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
        await redisService.delete(key);
    }

    /**
     * Get failed attempts count
     */
    static async getFailedAttemptsCount(ip: string): Promise<number> {
        const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
        const data = await redisService.get(key);

        if (!data) return 0;

        const attempts: FailedAttempt = JSON.parse(data);
        return attempts.count;
    }

    /**
     * Get all banned IPs (for admin dashboard)
     */
    static async getAllBannedIPs(): Promise<BannedIP[]> {
        // Note: This is a simplified version
        // In production, use Redis SCAN to iterate through keys
        return [];
    }
}
