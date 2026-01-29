/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP (5000 in dev)
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP (100 in dev)
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * OTP rate limiter
 * 3 OTP requests per 10 minutes per identifier
 */
export declare const otpLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export declare const passwordResetLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map