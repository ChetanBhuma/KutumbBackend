import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class ServiceRequestController {
    /**
     * Create a new service request
     */
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get all service requests with filters
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get request by ID
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update service request status
     */
    static updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Assign request to officer
     */
    static assign(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get statistics
     */
    static getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete service request
     */
    static delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=serviceRequestController.d.ts.map