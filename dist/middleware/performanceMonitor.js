"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../config/logger");
class PerformanceMonitor {
    metrics = [];
    maxMetricsSize = 1000;
    /**
     * Middleware to track request performance
     */
    middleware() {
        return (req, res, next) => {
            const start = process.hrtime();
            const originalEnd = res.end;
            // Override end function to capture response time
            // @ts-ignore
            res.end = (...args) => {
                const diff = process.hrtime(start);
                const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // in ms
                const memoryUsage = process.memoryUsage().heapUsed;
                const metric = {
                    endpoint: req.path, // Changed from 'path' to 'endpoint' to match interface
                    method: req.method,
                    statusCode: res.statusCode,
                    duration,
                    timestamp: new Date(),
                    memoryUsage,
                };
                // Log slow requests (>1s)
                if (duration > 1000) {
                    logger_1.logger.warn('Slow request detected:', {
                        ...metric,
                        query: req.query,
                        params: req.params,
                    });
                }
                // Store metrics
                this.addMetric(metric);
                return originalEnd.apply(res, args);
            };
            next();
        };
    }
    /**
     * Add metric to collection
     */
    addMetric(metric) {
        this.metrics.push(metric);
        // Keep only last N metrics
        if (this.metrics.length > this.maxMetricsSize) {
            this.metrics.shift();
        }
    }
    /**
     * Get performance statistics
     */
    getStats(endpoint) {
        const filtered = endpoint
            ? this.metrics.filter((m) => m.endpoint === endpoint)
            : this.metrics;
        if (filtered.length === 0) {
            return null;
        }
        const durations = filtered.map((m) => m.duration);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        // Calculate percentiles
        const sorted = [...durations].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        return {
            count: filtered.length,
            avg: avg.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            p50: p50.toFixed(2),
            p95: p95.toFixed(2),
            p99: p99.toFixed(2),
            slowRequests: filtered.filter((m) => m.duration > 1000).length,
        };
    }
    /**
     * Get endpoint breakdown
     */
    getEndpointStats() {
        const endpoints = [...new Set(this.metrics.map((m) => m.endpoint))];
        return endpoints.map((endpoint) => ({
            endpoint,
            ...this.getStats(endpoint),
        }));
    }
    /**
     * Clear metrics
     */
    clear() {
        this.metrics = [];
    }
}
exports.default = new PerformanceMonitor();
//# sourceMappingURL=performanceMonitor.js.map