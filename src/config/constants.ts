/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers
 */

export const OTP_CONFIG = {
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
    RESEND_COOLDOWN_SECONDS: 60,
    LENGTH: 6
} as const;

export const SESSION_CONFIG = {
    TOKEN_EXPIRY_MINUTES: 30,
    REFRESH_TOKEN_EXPIRY_DAYS: 7,
    MAX_CONCURRENT_SESSIONS: 3
} as const;

export const VISIT_CONFIG = {
    MIN_DURATION_MINUTES: 10,
    MAX_DURATION_MINUTES: 480,
    DEFAULT_DURATION_MINUTES: 30
} as const;

export const SOS_CONFIG = {
    RESPONSE_SLA_MINUTES: 15,
    RESOLUTION_SLA_MINUTES: 60,
    MAX_ACTIVE_ALERTS_PER_CITIZEN: 1
} as const;

export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
} as const;

export const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: 5,
    ACCOUNT_LOCKOUT_MINUTES: 30,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_SPECIAL_CHAR: true
} as const;

export const GEO_CONFIG = {
    FENCE_THRESHOLD_METERS: 30,
    BEAT_RADIUS_METERS: 5000
} as const;
