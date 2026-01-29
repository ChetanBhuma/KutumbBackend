import rateLimit from 'express-rate-limit';
import { config } from '../config';

const isDevEnv = config.env === 'development';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP (5000 in dev)
 */
export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: isDevEnv ? 50000 : config.rateLimit.maxRequests,
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP, please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for trusted IPs (optional)
    skip: (req) => {
        const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
        return trustedIPs.includes(req.ip || '');
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP (100 in dev)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevEnv ? 100 : 5,
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts, please try again after 15 minutes.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * OTP rate limiter
 * 3 OTP requests per 10 minutes per identifier
 */

export const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: isDevEnv ? 2000 : 5,
    message: {
        success: false,
        error: {
            message: 'Too many OTP requests, please try again after a short cooldown.'
        }
    },
    keyGenerator: (req) => {
        // Rate limit by identifier (phone/email) instead of IP
        return req.body.identifier || req.ip || 'unknown';
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        error: {
            message: 'Too many password reset attempts, please try again after 1 hour.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});
