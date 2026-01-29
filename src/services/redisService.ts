import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

class RedisService {
    private get isConnected(): boolean {
        return redisClient.status === 'ready';
    }

    constructor() {
        // Event listeners are already attached in config/redis.ts
        // We can add service-specific listeners if needed
    }

    async connect(): Promise<void> {
        // @ts-ignore - ioredis types might be slightly off or strict
        if (redisClient.status === 'ready') return;

        // @ts-ignore - ioredis types might be slightly off or strict
        if (redisClient.status !== 'ready') {
            if (redisClient.status === 'wait' || redisClient.status === 'close' || redisClient.status === 'end') {
                await redisClient.connect();
            }
        }

        // Wait for ready state
        // @ts-ignore
        if (redisClient.status !== 'ready') {
            await new Promise<void>((resolve) => {
                redisClient.once('ready', () => resolve());
            });
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await redisClient.quit();
        }
    }

    /**
     * Set a key-value pair with optional expiration
     */
    async set(key: string, value: string, expirySeconds?: number): Promise<void> {
        if (!this.isConnected) {
            logger.warn('Redis not connected - skipping set operation');
            return;
        }
        try {
            if (expirySeconds) {
                await redisClient.set(key, value, 'EX', expirySeconds);
            } else {
                await redisClient.set(key, value);
            }
        } catch (error) {
            logger.error(`Redis set error for key ${key}:`, error);
        }
    }

    /**
     * Get value by key
     */
    async get(key: string): Promise<string | null> {
        if (!this.isConnected) {
            logger.warn('Redis not connected - skipping get operation');
            return null;
        }
        try {
            return await redisClient.get(key);
        } catch (error) {
            logger.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Delete a key
     */
    async delete(key: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await redisClient.del(key);
        } catch (error) {
            logger.error(`Redis delete error for key ${key}:`, error);
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isConnected) {
            logger.warn('Redis not connected - returning false for exists check');
            return false;
        }
        try {
            const result = await redisClient.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`Redis exists error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Set expiration on a key
     */
    async expire(key: string, seconds: number): Promise<void> {
        if (!this.isConnected) return;
        try {
            await redisClient.expire(key, seconds);
        } catch (error) {
            logger.error(`Redis expire error for key ${key}:`, error);
        }
    }

    /**
     * Get time to live for a key
     */
    async ttl(key: string): Promise<number> {
        if (!this.isConnected) return -2;
        try {
            return await redisClient.ttl(key);
        } catch (error) {
            logger.error(`Redis ttl error for key ${key}:`, error);
            return -2;
        }
    }

    /**
     * Store refresh token
     */
    async storeRefreshToken(
        userId: string,
        refreshToken: string,
        expirySeconds: number
    ): Promise<void> {
        const key = `refresh_token:${userId}`;
        await this.set(key, refreshToken, expirySeconds);
    }

    /**
     * Get refresh token
     */
    async getRefreshToken(userId: string): Promise<string | null> {
        const key = `refresh_token:${userId}`;
        return await this.get(key);
    }

    /**
     * Delete refresh token (logout)
     */
    async deleteRefreshToken(userId: string): Promise<void> {
        const key = `refresh_token:${userId}`;
        await this.delete(key);
    }

    /**
     * Store OTP
     */
    async storeOTP(
        identifier: string,
        otp: string,
        expirySeconds: number
    ): Promise<void> {
        const key = `otp:${identifier}`;
        await this.set(key, otp, expirySeconds);
    }

    /**
     * Get OTP
     */
    async getOTP(identifier: string): Promise<string | null> {
        const key = `otp:${identifier}`;
        return await this.get(key);
    }

    /**
     * Delete OTP
     */
    async deleteOTP(identifier: string): Promise<void> {
        const key = `otp:${identifier}`;
        await this.delete(key);
    }

    /**
     * Store reset token
     */
    async storeResetToken(token: string, userId: string, expirySeconds: number): Promise<void> {
        const key = `reset_token:${token}`;
        await this.set(key, userId, expirySeconds);
    }

    /**
     * Get user ID from reset token
     */
    async getResetToken(token: string): Promise<string | null> {
        const key = `reset_token:${token}`;
        return await this.get(key);
    }

    /**
     * Delete reset token
     */
    async deleteResetToken(token: string): Promise<void> {
        const key = `reset_token:${token}`;
        await this.delete(key);
    }
}

export const redisService = new RedisService();
