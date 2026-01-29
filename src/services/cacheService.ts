// Enhanced Caching Service with Redis
import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Cache service with TTL, invalidation, and patterns
 */
class CacheService {
    private defaultTTL = 3600; // 1 hour in seconds

    /**
     * Get cached data
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cache with TTL
     */
    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
        try {
            await redisClient.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            logger.error('Cache set error:', error);
        }
    }

    /**
     * Delete cache key
     */
    async del(key: string): Promise<void> {
        try {
            await redisClient.del(key);
        } catch (error) {
            logger.error('Cache delete error:', error);
        }
    }

    /**
     * Delete multiple keys by pattern
     */
    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } catch (error) {
            logger.error('Cache delete pattern error:', error);
        }
    }

    /**
     * Cache wrapper for functions
     */
    async wrap<T>(
        key: string,
        fn: () => Promise<T>,
        ttl: number = this.defaultTTL
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get<T>(key);
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
        citizen: (id: string) => `citizen:${id}`,
        citizens: (page: number, filters: string) => `citizens:${page}:${filters}`,
        citizenStats: (id: string) => `citizen:${id}:stats`,
        dashboardStats: () => 'dashboard:stats',
        officerPerformance: (id: string) => `officer:${id}:performance`,
        sosAlerts: (status: string) => `sos:alerts:${status}`,
        visitSchedule: (date: string) => `visits:schedule:${date}`,
    };

    /**
     * Invalidation strategies
     */
    async invalidateCitizen(citizenId: string): Promise<void> {
        await Promise.all([
            this.del(this.keys.citizen(citizenId)),
            this.del(this.keys.citizenStats(citizenId)),
            this.delPattern('citizens:*'), // Invalidate all citizen lists
            this.del(this.keys.dashboardStats()),
        ]);
    }

    async invalidateVisit(_visitId: string): Promise<void> {
        await Promise.all([
            this.delPattern('visits:*'),
            this.del(this.keys.dashboardStats()),
        ]);
    }

    async invalidateSOS(): Promise<void> {
        await Promise.all([
            this.delPattern('sos:*'),
            this.del(this.keys.dashboardStats()),
        ]);
    }

    /**
     * Multi-level cache (Redis + in-memory)
     */
    private memoryCache = new Map<string, { data: any; expires: number }>();

    async getMultiLevel<T>(key: string): Promise<T | null> {
        // Check memory cache first
        const memCached = this.memoryCache.get(key);
        if (memCached && memCached.expires > Date.now()) {
            return memCached.data;
        }

        // Check Redis cache
        const redisCached = await this.get<T>(key);
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

    async setMultiLevel(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
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
    clearMemoryCache(): void {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (value.expires <= now) {
                this.memoryCache.delete(key);
            }
        }
    }
}

export default new CacheService();

// Clear memory cache every 5 minutes
setInterval(() => {
    new CacheService().clearMemoryCache();
}, 300000);
