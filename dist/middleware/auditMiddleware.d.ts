import { Response, NextFunction } from 'express';
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
export declare function auditAction(options: AuditOptions): (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Quick audit wrapper for common CRUD operations
 */
export declare const auditCRUD: {
    create: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    update: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    delete: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    read: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    list: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
};
/**
 * Audit decorator for controller methods
 * Can be used with TypeScript decorators
 */
export declare function Audit(action: string, resource: string): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=auditMiddleware.d.ts.map