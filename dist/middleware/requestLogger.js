"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityIncidentLogger = exports.authEventLogger = exports.dataModificationLogger = exports.requestLogger = void 0;
const logger_1 = require("../config/logger");
/**
 * Middleware to log all API requests and responses
 */
const requestLogger = (req, res, next) => {
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
    logger_1.logger.info('Incoming request', requestLog);
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        // Log response
        logger_1.logger.info('Outgoing response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        // Log to audit trail for sensitive operations
        if (req.method !== 'GET' && res.statusCode < 400) {
            logger_1.auditLogger.info('API operation', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                userId: req.user?.id,
                ip: req.ip,
                duration: `${duration}ms`
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.requestLogger = requestLogger;
/**
 * Middleware to log data modifications
 */
const dataModificationLogger = (operation, resource) => {
    return (req, res, next) => {
        // Store original send
        const originalSend = res.send;
        res.send = function (data) {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logger_1.auditLogger.info('Data modification', {
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
exports.dataModificationLogger = dataModificationLogger;
/**
 * Middleware to log authentication events
 */
const authEventLogger = (event) => {
    return (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            const success = res.statusCode >= 200 && res.statusCode < 300;
            logger_1.auditLogger.info('Authentication event', {
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
exports.authEventLogger = authEventLogger;
/**
 * Middleware to log security incidents
 */
const securityIncidentLogger = (incidentType, severity) => {
    return (req, _res, next) => {
        logger_1.auditLogger.warn('Security incident', {
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
exports.securityIncidentLogger = securityIncidentLogger;
//# sourceMappingURL=requestLogger.js.map