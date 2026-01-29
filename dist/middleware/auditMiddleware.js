"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditCRUD = void 0;
exports.auditAction = auditAction;
exports.Audit = Audit;
const logger_1 = require("../config/logger");
/**
 * Audit logging middleware
 * Eliminates repeated audit logging patterns in 10+ controllers
 *
 * @example
 * router.post('/citizens',
 *   authenticate,
 *   auditAction({ action: 'CREATE_CITIZEN', resource: 'citizen' }),
 *   citizenController.create
 * );
 */
function auditAction(options) {
    const { action, resource = 'unknown', includeRequestBody = false, includeResponseBody = false, excludeFields = ['password', 'token', 'accessToken', 'refreshToken'] } = options;
    return (req, res, next) => {
        const startTime = Date.now();
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method to capture response
        res.json = function (body) {
            const duration = Date.now() - startTime;
            // Build audit log entry
            const auditEntry = {
                action,
                resource,
                userId: req.user?.id,
                userEmail: req.user?.email,
                userRole: req.user?.role,
                method: req.method,
                path: req.path,
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.get('user-agent'),
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
                success: res.statusCode >= 200 && res.statusCode < 400
            };
            // Add request body if enabled
            if (includeRequestBody && req.body) {
                auditEntry.requestBody = sanitizeObject(req.body, excludeFields);
            }
            // Add response body if enabled
            if (includeResponseBody && body) {
                auditEntry.responseBody = sanitizeObject(body, excludeFields);
            }
            // Extract entity ID from response if available
            if (body?.data) {
                const data = body.data;
                if (data.id) {
                    auditEntry.entityId = data.id;
                }
                if (data.citizen?.id) {
                    auditEntry.entityId = data.citizen.id;
                    auditEntry.entityName = data.citizen.fullName;
                }
                if (data.visit?.id) {
                    auditEntry.entityId = data.visit.id;
                }
                if (data.officer?.id) {
                    auditEntry.entityId = data.officer.id;
                    auditEntry.entityName = data.officer.name;
                }
            }
            // Log based on success/failure
            if (auditEntry.success) {
                logger_1.auditLogger.info(action, auditEntry);
            }
            else {
                logger_1.auditLogger.warn(`${action}_FAILED`, auditEntry);
            }
            // Call original json method
            return originalJson(body);
        };
        next();
    };
}
/**
 * Quick audit wrapper for common CRUD operations
 */
exports.auditCRUD = {
    create: (resource) => auditAction({
        action: `CREATE_${resource.toUpperCase()}`,
        resource,
        includeRequestBody: true
    }),
    update: (resource) => auditAction({
        action: `UPDATE_${resource.toUpperCase()}`,
        resource,
        includeRequestBody: true
    }),
    delete: (resource) => auditAction({
        action: `DELETE_${resource.toUpperCase()}`,
        resource
    }),
    read: (resource) => auditAction({
        action: `READ_${resource.toUpperCase()}`,
        resource
    }),
    list: (resource) => auditAction({
        action: `LIST_${resource.toUpperCase()}`,
        resource
    })
};
/**
 * Sanitize object by removing sensitive fields
 */
function sanitizeObject(obj, excludeFields) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, excludeFields));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (!excludeFields.includes(key)) {
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value, excludeFields);
            }
            else {
                sanitized[key] = value;
            }
        }
        else {
            sanitized[key] = '[REDACTED]';
        }
    }
    return sanitized;
}
/**
 * Audit decorator for controller methods
 * Can be used with TypeScript decorators
 */
function Audit(action, resource) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const [req] = args;
            const startTime = Date.now();
            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - startTime;
                logger_1.auditLogger.info(action, {
                    action,
                    resource,
                    userId: req.user?.id,
                    userEmail: req.user?.email,
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString(),
                    success: true
                });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.auditLogger.error(`${action}_FAILED`, {
                    action,
                    resource,
                    userId: req.user?.id,
                    userEmail: req.user?.email,
                    duration: `${duration}ms`,
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString(),
                    success: false
                });
                throw error;
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=auditMiddleware.js.map