import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';
import { Application } from 'express';
import { config } from './index';
import { logger } from './logger';

/**
 * Initialize Sentry for error tracking
 */
export const initializeSentry = (app: Application) => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: config.env,
            integrations: [
                // Enable HTTP calls tracing
                new Sentry.Integrations.Http({ tracing: true }),
                // Enable Express.js middleware tracing
                new Sentry.Integrations.Express({ app }),
                // Enable Profiling
                // new ProfilingIntegration()
            ],
            // Performance Monitoring
            tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
            // Profiling
            profilesSampleRate: config.env === 'production' ? 0.1 : 1.0,
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

        logger.info('✅ Sentry initialized');
    } else {
        logger.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    }
};

/**
 * Sentry request handler (must be first middleware)
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler();

/**
 * Sentry tracing handler
 */
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();

/**
 * Sentry error handler (must be before other error handlers)
 */
export const sentryErrorHandler: any = Sentry.Handlers.errorHandler();

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, {
        extra: context
    });
};

/**
 * Capture message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set user context
 */
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
    Sentry.setUser(user);
};

/**
 * Clear user context
 */
export const clearUserContext = () => {
    Sentry.setUser(null);
};
