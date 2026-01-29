"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSOSSLABreach = exports.calculateSOSMetrics = exports.SOS_SLA_CONFIG = void 0;
/**
 * SLA (Service Level Agreement) Configuration for SOS Response
 */
exports.SOS_SLA_CONFIG = {
    RESPONSE_TIME_MINUTES: 15, // Target: Respond within 15 minutes
    RESOLUTION_TIME_MINUTES: 60, // Target: Resolve within 60 minutes
};
/**
 * Calculate response time metrics for an SOS alert
 */
const calculateSOSMetrics = (alert) => {
    const responseTimeMinutes = alert.respondedAt
        ? Math.round((alert.respondedAt.getTime() - alert.createdAt.getTime()) / 1000 / 60)
        : null;
    const resolutionTimeMinutes = alert.resolvedAt
        ? Math.round((alert.resolvedAt.getTime() - alert.createdAt.getTime()) / 1000 / 60)
        : null;
    return {
        alertId: alert.id,
        responseTimeMinutes,
        resolutionTimeMinutes,
        isResponseSLABreached: responseTimeMinutes !== null && responseTimeMinutes > exports.SOS_SLA_CONFIG.RESPONSE_TIME_MINUTES,
        isResolutionSLABreached: resolutionTimeMinutes !== null && resolutionTimeMinutes > exports.SOS_SLA_CONFIG.RESOLUTION_TIME_MINUTES,
    };
};
exports.calculateSOSMetrics = calculateSOSMetrics;
/**
 * Check if an active SOS alert has breached SLA
 */
const checkSOSSLABreach = (alert) => {
    const now = new Date();
    const minutesElapsed = Math.round((now.getTime() - alert.createdAt.getTime()) / 1000 / 60);
    // If not yet responded and time exceeds SLA
    const isBreached = alert.status === 'Active' && !alert.respondedAt && minutesElapsed > exports.SOS_SLA_CONFIG.RESPONSE_TIME_MINUTES;
    return {
        isBreached,
        minutesElapsed,
    };
};
exports.checkSOSSLABreach = checkSOSSLABreach;
//# sourceMappingURL=sosSLA.js.map