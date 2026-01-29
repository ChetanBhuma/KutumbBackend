import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class VisitController {
    /**
     * Get all visits with pagination and filters
     */
    /**
     * Get all visits with pagination and filters
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get visit by ID
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create new visit (manual scheduling)
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get visits assigned to the logged-in officer
     */
    static getOfficerAssignments(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Officer starts a visit (geo-fence validation)
     */
    static startVisit(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Officer completes visit with assessment data
     */
    static completeAsOfficer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Auto-schedule visits based on workload and priority
     */
    static autoSchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update visit
     */
    static update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Complete visit (mark as completed with details)
     */
    static complete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Cancel visit
     */
    static cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get calendar view (visits by date range)
     */
    static getCalendar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get visit statistics
     */
    static getStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=visitController.d.ts.map