import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class OfficerController {
    /**
     * Get all officers with pagination and filters
     */
    /**
     * Get all officers with pagination and filters
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get officer by ID with assigned citizens
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create new officer
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update officer
     */
    /**
     * Update officer and sync with User account
     */
    static update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete (soft delete) officer
     */
    static delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Assign officer to beat
     */
    static assignToBeat(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get officer workload distribution
     */
    static getWorkloadDistribution(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get officer statistics
     */
    static getStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Transfer officer to new beat with automatic citizen reassignment
     */
    static transferOfficer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Preview transfer impact before execution
     */
    static previewTransfer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get transfer history for an officer
     */
    static getTransferHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=officerController.d.ts.map