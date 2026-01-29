import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { Permission, Role, hasPermission, hasAnyPermission, RolePermissions } from '../types/auth';
import { AppError } from './errorHandler';
import { auditLogger } from '../config/logger';

/**
 * Middleware to check if user has required permission
 */
const hasDynamicPermission = (user: any, permission: string) => {
    return user.permissions && user.permissions.includes(permission);
};

export const requirePermission = (permission: Permission) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        // Check dynamic permissions first
        if (hasDynamicPermission(req.user, permission)) {
            return next();
        }

        const userRole = req.user.role as Role;

        if (!hasPermission(userRole, permission)) {
            console.log(`[AuthDebug] Check Failed. Role: ${userRole}, Required: ${permission}, HasPermission: ${hasPermission(userRole, permission)}`);
            console.log(`[AuthDebug] RolePermissions:`, RolePermissions[userRole]);

            // Log authorization failure
            auditLogger.warn('Authorization failed', {
                userId: req.user.id,
                role: userRole,
                requiredPermission: permission,
                path: req.path,
                method: req.method,
                ip: req.ip
            });

            return next(new AppError(`Insufficient permissions. Required: ${permission}, Current Role: ${userRole}`, 403));
        }

        next();
    };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        // Check dynamic permissions first
        if (permissions.some(p => hasDynamicPermission(req.user, p))) {
            return next();
        }

        const userRole = req.user.role as Role;

        if (!hasAnyPermission(userRole, permissions)) {
            auditLogger.warn('Authorization failed', {
                userId: req.user.id,
                role: userRole,
                requiredPermissions: permissions,
                path: req.path,
                method: req.method,
                ip: req.ip
            });

            return next(new AppError('Insufficient permissions', 403));
        }

        next();
    };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: Role | Role[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        const userRole = req.user.role as Role;

        if (!allowedRoles.includes(userRole)) {
            auditLogger.warn('Authorization failed - role mismatch', {
                userId: req.user.id,
                userRole,
                requiredRoles: allowedRoles,
                path: req.path,
                method: req.method,
                ip: req.ip
            });

            return next(new AppError('Insufficient permissions', 403));
        }

        next();
    };
};
