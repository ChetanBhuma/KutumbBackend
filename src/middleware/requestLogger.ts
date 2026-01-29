import { Request, Response, NextFunction } from 'express';
import { logger, auditLogger } from '../config/logger';
import { AuthRequest } from './authenticate';

/**
 * Middleware to log all API requests and responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log request
    const requestLog = {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    };

    logger.info('Incoming request', requestLog);

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
        const duration = Date.now() - startTime;

        // Log response
        logger.info('Outgoing response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Log to audit trail for sensitive operations
        if (req.method !== 'GET' && res.statusCode < 400) {
            auditLogger.info('API operation', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                userId: (req as AuthRequest).user?.id,
                ip: req.ip,
                duration: `${duration}ms`
            });
        }

        return originalSend.call(this, data);
    };

    next();
};

/**
 * Middleware to log data modifications
 */
export const dataModificationLogger = (
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string
) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        // Store original send
        const originalSend = res.send;

        res.send = function (data: any) {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                auditLogger.info('Data modification', {
                    operation,
                    resource,
                    userId: req.user?.id,
                    userEmail: req.user?.email,
                    resourceId: req.params.id || 'N/A',
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    timestamp: new Date().toISOString(),
                    requestBody: operation !== 'DELETE' ? req.body : undefined
                });
            }

            return originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Middleware to log authentication events
 */
export const authEventLogger = (event: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'OTP_SENT' | 'OTP_VERIFIED') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send;

        res.send = function (data: any) {
            const success = res.statusCode >= 200 && res.statusCode < 300;

            auditLogger.info('Authentication event', {
                event,
                success,
                identifier: req.body.identifier || req.body.email || req.body.phone,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                timestamp: new Date().toISOString(),
                statusCode: res.statusCode
            });

            return originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Middleware to log security incidents
 */
export const securityIncidentLogger = (
    incidentType: 'BRUTE_FORCE' | 'MALICIOUS_INPUT' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        auditLogger.warn('Security incident', {
            incidentType,
            severity,
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        next();
    };
};
