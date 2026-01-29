"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAnyPermission = exports.requirePermission = void 0;
const auth_1 = require("../types/auth");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../config/logger");
/**
 * Middleware to check if user has required permission
 */
const hasDynamicPermission = (user, permission) => {
    return user.permissions && user.permissions.includes(permission);
};
const requirePermission = (permission) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        // Check dynamic permissions first
        if (hasDynamicPermission(req.user, permission)) {
            return next();
        }
        const userRole = req.user.role;
        if (!(0, auth_1.hasPermission)(userRole, permission)) {
            console.log(`[AuthDebug] Check Failed. Role: ${userRole}, Required: ${permission}, HasPermission: ${(0, auth_1.hasPermission)(userRole, permission)}`);
            console.log(`[AuthDebug] RolePermissions:`, auth_1.RolePermissions[userRole]);
            // Log authorization failure
            logger_1.auditLogger.warn('Authorization failed', {
                userId: req.user.id,
                role: userRole,
                requiredPermission: permission,
                path: req.path,
                method: req.method,
                ip: req.ip
            });
            return next(new errorHandler_1.AppError(`Insufficient permissions. Required: ${permission}, Current Role: ${userRole}`, 403));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has any of the required permissions
 */
const requireAnyPermission = (permissions) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        // Check dynamic permissions first
        if (permissions.some(p => hasDynamicPermission(req.user, p))) {
            return next();
        }
        const userRole = req.user.role;
        if (!(0, auth_1.hasAnyPermission)(userRole, permissions)) {
            logger_1.auditLogger.warn('Authorization failed', {
                userId: req.user.id,
                role: userRole,
                requiredPermissions: permissions,
                path: req.path,
                method: req.method,
                ip: req.ip
            });
            return next(new errorHandler_1.AppError('Insufficient permissions', 403));
        }
        next();
    };
};
exports.requireAnyPermission = requireAnyPermission;
/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            logger_1.auditLogger.warn('Authorization failed - role mismatch', {
                userId: req.user.id,
                userRole,
                requiredRoles: allowedRoles,
                path: req.path,
                method: req.method,
                ip: req.ip
            });
            return next(new errorHandler_1.AppError('Insufficient permissions', 403));
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=authorize.js.map