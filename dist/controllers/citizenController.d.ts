import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class CitizenController {
    /**
     * Get all citizens with pagination and filters
     */
    /**
     * Get all citizens with pagination and filters
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get citizens for map view
     */
    static map(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get single citizen by ID
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create new citizen
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update citizen profile
     */
    static updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete (soft delete) citizen
     */
    static delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update verification status
     */
    static updateVerificationStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Issue digital card
     */
    static issueDigitalCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get statistics
     */
    static getStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Check for duplicate citizens
     */
    static checkDuplicates(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Find all potential duplicates in the system
     */
    static findAllDuplicates(_req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=citizenController.d.ts.map