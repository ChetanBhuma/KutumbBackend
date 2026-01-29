/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers
 */
export declare const OTP_CONFIG: {
    readonly EXPIRY_MINUTES: 10;
    readonly MAX_ATTEMPTS: 3;
    readonly RESEND_COOLDOWN_SECONDS: 60;
    readonly LENGTH: 6;
};
export declare const SESSION_CONFIG: {
    readonly TOKEN_EXPIRY_MINUTES: 30;
    readonly REFRESH_TOKEN_EXPIRY_DAYS: 7;
    readonly MAX_CONCURRENT_SESSIONS: 3;
};
export declare const VISIT_CONFIG: {
    readonly MIN_DURATION_MINUTES: 10;
    readonly MAX_DURATION_MINUTES: 480;
    readonly DEFAULT_DURATION_MINUTES: 30;
};
export declare const SOS_CONFIG: {
    readonly RESPONSE_SLA_MINUTES: 15;
    readonly RESOLUTION_SLA_MINUTES: 60;
    readonly MAX_ACTIVE_ALERTS_PER_CITIZEN: 1;
};
export declare const PAGINATION_CONFIG: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
};
export declare const SECURITY_CONFIG: {
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly ACCOUNT_LOCKOUT_MINUTES: 30;
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_REQUIRE_SPECIAL_CHAR: true;
};
export declare const GEO_CONFIG: {
    readonly FENCE_THRESHOLD_METERS: 30;
    readonly BEAT_RADIUS_METERS: 5000;
};
//# sourceMappingURL=constants.d.ts.map