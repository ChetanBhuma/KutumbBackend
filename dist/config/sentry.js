"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserContext = exports.setUserContext = exports.addBreadcrumb = exports.captureMessage = exports.captureException = exports.sentryErrorHandler = exports.sentryTracingHandler = exports.sentryRequestHandler = exports.initializeSentry = void 0;
const Sentry = __importStar(require("@sentry/node"));
const index_1 = require("./index");
const logger_1 = require("./logger");
/**
 * Initialize Sentry for error tracking
 */
const initializeSentry = (app) => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: index_1.config.env,
            integrations: [
                // Enable HTTP calls tracing
                new Sentry.Integrations.Http({ tracing: true }),
                // Enable Express.js middleware tracing
                new Sentry.Integrations.Express({ app }),
                // Enable Profiling
                // new ProfilingIntegration()
            ],
            // Performance Monitoring
            tracesSampleRate: index_1.config.env === 'production' ? 0.1 : 1.0,
            // Profiling
            profilesSampleRate: index_1.config.env === 'production' ? 0.1 : 1.0,
            // Release tracking
            release: process.env.npm_package_version,
            // Before send hook to filter sensitive data
            beforeSend(event, hint) {
                // Remove sensitive data
                if (event.request) {
                    delete event.request.cookies;
                    if (event.request.headers) {
                        delete event.request.headers.authorization;
                        delete event.request.headers.cookie;
                    }
                }
                // Filter out certain errors
                if (event.exception) {
                    const error = hint.originalException;
                    if (error instanceof Error) {
                        // Don't send validation errors to Sentry
                        if (error.message.includes('validation') || error.message.includes('Invalid')) {
                            return null;
                        }
                    }
                }
                return event;
            }
        });
        logger_1.logger.info('✅ Sentry initialized');
    }
    else {
        logger_1.logger.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    }
};
exports.initializeSentry = initializeSentry;
/**
 * Sentry request handler (must be first middleware)
 */
exports.sentryRequestHandler = Sentry.Handlers.requestHandler();
/**
 * Sentry tracing handler
 */
exports.sentryTracingHandler = Sentry.Handlers.tracingHandler();
/**
 * Sentry error handler (must be before other error handlers)
 */
exports.sentryErrorHandler = Sentry.Handlers.errorHandler();
/**
 * Capture exception manually
 */
const captureException = (error, context) => {
    Sentry.captureException(error, {
        extra: context
    });
};
exports.captureException = captureException;
/**
 * Capture message
 */
const captureMessage = (message, level = 'info') => {
    Sentry.captureMessage(message, level);
};
exports.captureMessage = captureMessage;
/**
 * Add breadcrumb
 */
const addBreadcrumb = (breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb);
};
exports.addBreadcrumb = addBreadcrumb;
/**
 * Set user context
 */
const setUserContext = (user) => {
    Sentry.setUser(user);
};
exports.setUserContext = setUserContext;
/**
 * Clear user context
 */
const clearUserContext = () => {
    Sentry.setUser(null);
};
exports.clearUserContext = clearUserContext;
//# sourceMappingURL=sentry.js.map