/**
 * Cache service with TTL, invalidation, and patterns
 */
declare class CacheService {
    private defaultTTL;
    /**
     * Get cached data
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cache with TTL
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Delete cache key
     */
    del(key: string): Promise<void>;
    /**
     * Delete multiple keys by pattern
     */
    delPattern(pattern: string): Promise<void>;
    /**
     * Cache wrapper for functions
     */
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Cache keys generator
     */
    keys: {
        citizen: (id: string) => string;
        citizens: (page: number, filters: string) => string;
        citizenStats: (id: string) => string;
        dashboardStats: () => string;
        officerPerformance: (id: string) => string;
        sosAlerts: (status: string) => string;
        visitSchedule: (date: string) => string;
    };
    /**
     * Invalidation strategies
     */
    invalidateCitizen(citizenId: string): Promise<void>;
    invalidateVisit(_visitId: string): Promise<void>;
    invalidateSOS(): Promise<void>;
    /**
     * Multi-level cache (Redis + in-memory)
     */
    private memoryCache;
    getMultiLevel<T>(key: string): Promise<T | null>;
    setMultiLevel(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Clear memory cache (call periodically)
     */
    clearMemoryCache(): void;
}
declare const _default: CacheService;
export default _default;
//# sourceMappingURL=cacheService.d.ts.map