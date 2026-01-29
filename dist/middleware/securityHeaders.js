"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSecurityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
/**
 * Configure comprehensive security headers using Helmet
 */
const configureSecurityHeaders = (app) => {
    // Use Helmet with custom configuration
    app.use((0, helmet_1.default)({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts (adjust for production)
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        },
        // DNS Prefetch Control
        dnsPrefetchControl: {
            allow: false
        },
        // Frameguard (prevent clickjacking)
        frameguard: {
            action: 'deny'
        },
        // Hide Powered-By header
        hidePoweredBy: true,
        // HSTS (HTTP Strict Transport Security)
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        // IE No Open
        ieNoOpen: true,
        // No Sniff
        noSniff: true,
        // Permitted Cross-Domain Policies
        permittedCrossDomainPolicies: {
            permittedPolicies: 'none'
        },
        // Referrer Policy
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin'
        },
        // XSS Filter
        xssFilter: true
    }));
    // Additional custom security headers
    app.use((req, res, next) => {
        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');
        // Enable XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // Disable caching for sensitive data, but allow for static assets
        if (req.path.startsWith('/uploads') || req.path.startsWith('/static')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        }
        else {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        // Permissions Policy (formerly Feature Policy)
        res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=(), payment=()');
        next();
    });
};
exports.configureSecurityHeaders = configureSecurityHeaders;
//# sourceMappingURL=securityHeaders.js.map