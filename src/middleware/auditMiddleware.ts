import { Response, NextFunction } from 'express';
import { auditLogger } from '../config/logger';
import { AuthRequest } from './authenticate';

export interface AuditOptions {
    action: string;
    resource?: string;
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    excludeFields?: string[];
}

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
export function auditAction(options: AuditOptions) {
    const {
        action,
        resource = 'unknown',
        includeRequestBody = false,
        includeResponseBody = false,
        excludeFields = ['password', 'token', 'accessToken', 'refreshToken']
    } = options;

    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to capture response
        res.json = function (body: any) {
            const duration = Date.now() - startTime;

            // Build audit log entry
            const auditEntry: any = {
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
                auditLogger.info(action, auditEntry);
            } else {
                auditLogger.warn(`${action}_FAILED`, auditEntry);
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
export const auditCRUD = {
    create: (resource: string) => auditAction({
        action: `CREATE_${resource.toUpperCase()}`,
        resource,
        includeRequestBody: true
    }),

    update: (resource: string) => auditAction({
        action: `UPDATE_${resource.toUpperCase()}`,
        resource,
        includeRequestBody: true
    }),

    delete: (resource: string) => auditAction({
        action: `DELETE_${resource.toUpperCase()}`,
        resource
    }),

    read: (resource: string) => auditAction({
        action: `READ_${resource.toUpperCase()}`,
        resource
    }),

    list: (resource: string) => auditAction({
        action: `LIST_${resource.toUpperCase()}`,
        resource
    })
};

/**
 * Sanitize object by removing sensitive fields
 */
function sanitizeObject(obj: any, excludeFields: string[]): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, excludeFields));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (!excludeFields.includes(key)) {
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value, excludeFields);
            } else {
                sanitized[key] = value;
            }
        } else {
            sanitized[key] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Audit decorator for controller methods
 * Can be used with TypeScript decorators
 */
export function Audit(action: string, resource: string) {
    return function (
        _target: any,
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const [req] = args as [AuthRequest, Response, NextFunction];
            const startTime = Date.now();

            try {
                const result = await originalMethod.apply(this, args);

                const duration = Date.now() - startTime;
                auditLogger.info(action, {
                    action,
                    resource,
                    userId: req.user?.id,
                    userEmail: req.user?.email,
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString(),
                    success: true
                });

                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                auditLogger.error(`${action}_FAILED`, {
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
