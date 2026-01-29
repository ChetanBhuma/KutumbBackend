import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class LeaveController {
    /**
     * Create leave request
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get all leave requests with filters
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get leave by ID
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Approve leave request
     */
    static approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Reject leave request
     */
    static reject(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Cancel leave request
     */
    static cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get leave statistics
     */
    static getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get officer's leave balance/history
     */
    static getOfficerLeaves(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=leaveController.d.ts.map