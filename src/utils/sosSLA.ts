/**
 * SLA (Service Level Agreement) Configuration for SOS Response
 */
export const SOS_SLA_CONFIG = {
    RESPONSE_TIME_MINUTES: 15, // Target: Respond within 15 minutes
    RESOLUTION_TIME_MINUTES: 60, // Target: Resolve within 60 minutes
};

export interface SOSResponseMetrics {
    alertId: string;
    responseTimeMinutes: number | null;
    resolutionTimeMinutes: number | null;
    isResponseSLABreached: boolean;
    isResolutionSLABreached: boolean;
}

/**
 * Calculate response time metrics for an SOS alert
 */
export const calculateSOSMetrics = (alert: {
    createdAt: Date;
    respondedAt: Date | null;
    resolvedAt: Date | null;
    id: string;
}): SOSResponseMetrics => {
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
        isResponseSLABreached: responseTimeMinutes !== null && responseTimeMinutes > SOS_SLA_CONFIG.RESPONSE_TIME_MINUTES,
        isResolutionSLABreached: resolutionTimeMinutes !== null && resolutionTimeMinutes > SOS_SLA_CONFIG.RESOLUTION_TIME_MINUTES,
    };
};

/**
 * Check if an active SOS alert has breached SLA
 */
export const checkSOSSLABreach = (alert: {
    createdAt: Date;
    respondedAt: Date | null;
    status: string;
}): { isBreached: boolean; minutesElapsed: number } => {
    const now = new Date();
    const minutesElapsed = Math.round((now.getTime() - alert.createdAt.getTime()) / 1000 / 60);

    // If not yet responded and time exceeds SLA
    const isBreached = alert.status === 'Active' && !alert.respondedAt && minutesElapsed > SOS_SLA_CONFIG.RESPONSE_TIME_MINUTES;

    return {
        isBreached,
        minutesElapsed,
    };
};
