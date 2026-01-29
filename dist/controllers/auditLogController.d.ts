import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class AuditLogController {
    /**
     * Get audit logs with filtering and pagination
     */
    static getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get audit log entry by ID
     */
    static getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
//# sourceMappingURL=auditLogController.d.ts.map