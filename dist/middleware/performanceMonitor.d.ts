import { Request, Response, NextFunction } from 'express';
declare class PerformanceMonitor {
    private metrics;
    private maxMetricsSize;
    /**
     * Middleware to track request performance
     */
    middleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Add metric to collection
     */
    private addMetric;
    /**
     * Get performance statistics
     */
    getStats(endpoint?: string): {
        count: number;
        avg: string;
        min: string;
        max: string;
        p50: string;
        p95: string;
        p99: string;
        slowRequests: number;
    } | null;
    /**
     * Get endpoint breakdown
     */
    getEndpointStats(): {
        count?: number | undefined;
        avg?: string | undefined;
        min?: string | undefined;
        max?: string | undefined;
        p50?: string | undefined;
        p95?: string | undefined;
        p99?: string | undefined;
        slowRequests?: number | undefined;
        endpoint: string;
    }[];
    /**
     * Clear metrics
     */
    clear(): void;
}
declare const _default: PerformanceMonitor;
export default _default;
//# sourceMappingURL=performanceMonitor.d.ts.map