"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
class RedisService {
    get isConnected() {
        return redis_1.redisClient.status === 'ready';
    }
    constructor() {
        // Event listeners are already attached in config/redis.ts
        // We can add service-specific listeners if needed
    }
    async connect() {
        // @ts-ignore - ioredis types might be slightly off or strict
        if (redis_1.redisClient.status === 'ready')
            return;
        // @ts-ignore - ioredis types might be slightly off or strict
        if (redis_1.redisClient.status !== 'ready') {
            if (redis_1.redisClient.status === 'wait' || redis_1.redisClient.status === 'close' || redis_1.redisClient.status === 'end') {
                await redis_1.redisClient.connect();
            }
        }
        // Wait for ready state
        // @ts-ignore
        if (redis_1.redisClient.status !== 'ready') {
            await new Promise((resolve) => {
                redis_1.redisClient.once('ready', () => resolve());
            });
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await redis_1.redisClient.quit();
        }
    }
    /**
     * Set a key-value pair with optional expiration
     */
    async set(key, value, expirySeconds) {
        if (!this.isConnected) {
            logger_1.logger.warn('Redis not connected - skipping set operation');
            return;
        }
        try {
            if (expirySeconds) {
                await redis_1.redisClient.set(key, value, 'EX', expirySeconds);
            }
            else {
                await redis_1.redisClient.set(key, value);
            }
        }
        catch (error) {
            logger_1.logger.error(`Redis set error for key ${key}:`, error);
        }
    }
    /**
     * Get value by key
     */
    async get(key) {
        if (!this.isConnected) {
            logger_1.logger.warn('Redis not connected - skipping get operation');
            return null;
        }
        try {
            return await redis_1.redisClient.get(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    }
    /**
     * Delete a key
     */
    async delete(key) {
        if (!this.isConnected)
            return;
        try {
            await redis_1.redisClient.del(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis delete error for key ${key}:`, error);
        }
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        if (!this.isConnected) {
            logger_1.logger.warn('Redis not connected - returning false for exists check');
            return false;
        }
        try {
            const result = await redis_1.redisClient.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Redis exists error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Set expiration on a key
     */
    async expire(key, seconds) {
        if (!this.isConnected)
            return;
        try {
            await redis_1.redisClient.expire(key, seconds);
        }
        catch (error) {
            logger_1.logger.error(`Redis expire error for key ${key}:`, error);
        }
    }
    /**
     * Get time to live for a key
     */
    async ttl(key) {
        if (!this.isConnected)
            return -2;
        try {
            return await redis_1.redisClient.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis ttl error for key ${key}:`, error);
            return -2;
        }
    }
    /**
     * Store refresh token
     */
    async storeRefreshToken(userId, refreshToken, expirySeconds) {
        const key = `refresh_token:${userId}`;
        await this.set(key, refreshToken, expirySeconds);
    }
    /**
     * Get refresh token
     */
    async getRefreshToken(userId) {
        const key = `refresh_token:${userId}`;
        return await this.get(key);
    }
    /**
     * Delete refresh token (logout)
     */
    async deleteRefreshToken(userId) {
        const key = `refresh_token:${userId}`;
        await this.delete(key);
    }
    /**
     * Store OTP
     */
    async storeOTP(identifier, otp, expirySeconds) {
        const key = `otp:${identifier}`;
        await this.set(key, otp, expirySeconds);
    }
    /**
     * Get OTP
     */
    async getOTP(identifier) {
        const key = `otp:${identifier}`;
        return await this.get(key);
    }
    /**
     * Delete OTP
     */
    async deleteOTP(identifier) {
        const key = `otp:${identifier}`;
        await this.delete(key);
    }
    /**
     * Store reset token
     */
    async storeResetToken(token, userId, expirySeconds) {
        const key = `reset_token:${token}`;
        await this.set(key, userId, expirySeconds);
    }
    /**
     * Get user ID from reset token
     */
    async getResetToken(token) {
        const key = `reset_token:${token}`;
        return await this.get(key);
    }
    /**
     * Delete reset token
     */
    async deleteResetToken(token) {
        const key = `reset_token:${token}`;
        await this.delete(key);
    }
}
exports.redisService = new RedisService();
//# sourceMappingURL=redisService.js.map