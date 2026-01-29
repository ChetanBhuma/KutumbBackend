import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { Permission, Role } from '../types/auth';
export declare const requirePermission: (permission: Permission) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has any of the required permissions
 */
export declare const requireAnyPermission: (permissions: Permission[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has specific role
 */
export declare const requireRole: (roles: Role | Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorize.d.ts.map