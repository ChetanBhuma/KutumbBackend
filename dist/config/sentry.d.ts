import * as Sentry from '@sentry/node';
import { Application } from 'express';
/**
 * Initialize Sentry for error tracking
 */
export declare const initializeSentry: (app: Application) => void;
/**
 * Sentry request handler (must be first middleware)
 */
export declare const sentryRequestHandler: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (error?: any) => void) => void;
/**
 * Sentry tracing handler
 */
export declare const sentryTracingHandler: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (error?: any) => void) => void;
/**
 * Sentry error handler (must be before other error handlers)
 */
export declare const sentryErrorHandler: any;
/**
 * Capture exception manually
 */
export declare const captureException: (error: Error, context?: Record<string, any>) => void;
/**
 * Capture message
 */
export declare const captureMessage: (message: string, level?: Sentry.SeverityLevel) => void;
/**
 * Add breadcrumb
 */
export declare const addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) => void;
/**
 * Set user context
 */
export declare const setUserContext: (user: {
    id: string;
    email?: string;
    username?: string;
}) => void;
/**
 * Clear user context
 */
export declare const clearUserContext: () => void;
//# sourceMappingURL=sentry.d.ts.map