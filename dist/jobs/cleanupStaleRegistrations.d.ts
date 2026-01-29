/**
 * Cleanup job to purge stale 'Unknown' citizen records
 * This is a safety net for failed or abandoned registrations.
 * Older than 24 hours.
 */
export declare const cleanupStaleRegistrations: () => Promise<void>;
//# sourceMappingURL=cleanupStaleRegistrations.d.ts.map