/**
 * SLA (Service Level Agreement) Configuration for SOS Response
 */
export declare const SOS_SLA_CONFIG: {
    RESPONSE_TIME_MINUTES: number;
    RESOLUTION_TIME_MINUTES: number;
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
export declare const calculateSOSMetrics: (alert: {
    createdAt: Date;
    respondedAt: Date | null;
    resolvedAt: Date | null;
    id: string;
}) => SOSResponseMetrics;
/**
 * Check if an active SOS alert has breached SLA
 */
export declare const checkSOSSLABreach: (alert: {
    createdAt: Date;
    respondedAt: Date | null;
    status: string;
}) => {
    isBreached: boolean;
    minutesElapsed: number;
};
//# sourceMappingURL=sosSLA.d.ts.map