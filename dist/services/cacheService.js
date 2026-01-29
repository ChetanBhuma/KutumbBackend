"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Enhanced Caching Service with Redis
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
/**
 * Cache service with TTL, invalidation, and patterns
 */
class CacheService {
    defaultTTL = 3600; // 1 hour in seconds
    /**
     * Get cached data
     */
    async get(key) {
        try {
            const data = await redis_1.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            return null;
        }
    }
    /**
     * Set cache with TTL
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            await redis_1.redisClient.setex(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
        }
    }
    /**
     * Delete cache key
     */
    async del(key) {
        try {
            await redis_1.redisClient.del(key);
        }
        catch (error) {
            logger_1.logger.error('Cache delete error:', error);
        }
    }
    /**
     * Delete multiple keys by pattern
     */
    async delPattern(pattern) {
        try {
            const keys = await redis_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await redis_1.redisClient.del(...keys);
            }
        }
        catch (error) {
            logger_1.logger.error('Cache delete pattern error:', error);
        }
    }
    /**
     * Cache wrapper for functions
     */
    async wrap(key, fn, ttl = this.defaultTTL) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        // Execute function and cache result
        const result = await fn();
        await this.set(key, result, ttl);
        return result;
    }
    /**
     * Cache keys generator
     */
    keys = {
        citizen: (id) => `citizen:${id}`,
        citizens: (page, filters) => `citizens:${page}:${filters}`,
        citizenStats: (id) => `citizen:${id}:stats`,
        dashboardStats: () => 'dashboard:stats',
        officerPerformance: (id) => `officer:${id}:performance`,
        sosAlerts: (status) => `sos:alerts:${status}`,
        visitSchedule: (date) => `visits:schedule:${date}`,
    };
    /**
     * Invalidation strategies
     */
    async invalidateCitizen(citizenId) {
        await Promise.all([
            this.del(this.keys.citizen(citizenId)),
            this.del(this.keys.citizenStats(citizenId)),
            this.delPattern('citizens:*'), // Invalidate all citizen lists
            this.del(this.keys.dashboardStats()),
        ]);
    }
    async invalidateVisit(_visitId) {
        await Promise.all([
            this.delPattern('visits:*'),
            this.del(this.keys.dashboardStats()),
        ]);
    }
    async invalidateSOS() {
        await Promise.all([
            this.delPattern('sos:*'),
            this.del(this.keys.dashboardStats()),
        ]);
    }
    /**
     * Multi-level cache (Redis + in-memory)
     */
    memoryCache = new Map();
    async getMultiLevel(key) {
        // Check memory cache first
        const memCached = this.memoryCache.get(key);
        if (memCached && memCached.expires > Date.now()) {
            return memCached.data;
        }
        // Check Redis cache
        const redisCached = await this.get(key);
        if (redisCached !== null) {
            // Store in memory for quick access (5 min)
            this.memoryCache.set(key, {
                data: redisCached,
                expires: Date.now() + 300000,
            });
            return redisCached;
        }
        return null;
    }
    async setMultiLevel(key, value, ttl = this.defaultTTL) {
        // Store in both caches
        await this.set(key, value, ttl);
        this.memoryCache.set(key, {
            data: value,
            expires: Date.now() + Math.min(300000, ttl * 1000), // Max 5 min for memory
        });
    }
    /**
     * Clear memory cache (call periodically)
     */
    clearMemoryCache() {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (value.expires <= now) {
                this.memoryCache.delete(key);
            }
        }
    }
}
exports.default = new CacheService();
// Clear memory cache every 5 minutes
setInterval(() => {
    new CacheService().clearMemoryCache();
}, 300000);
//# sourceMappingURL=cacheService.js.map