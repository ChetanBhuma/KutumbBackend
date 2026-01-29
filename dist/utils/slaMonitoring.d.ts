interface SLABreach {
    type: 'SOS_RESPONSE' | 'SOS_RESOLUTION' | 'VERIFICATION_VISIT' | 'ROUTINE_VISIT';
    entityId: string;
    expectedBy: Date;
    actualTime?: Date;
    breachDuration: number;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}
/**
 * Monitor SLA breaches in real-time
 */
export declare const monitorSLABreaches: () => Promise<SLABreach[]>;
/**
 * Get SLA compliance metrics
 */
export declare const getSLAMetrics: () => Promise<{
    sos: {
        total: number;
        onTime: number;
        compliance: number;
    };
    visits: {
        total: number;
        onTime: number;
        compliance: number;
    };
}>;
export {};
//# sourceMappingURL=slaMonitoring.d.ts.map