import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class BeatController {
    /**
     * Get all beats with full hierarchy
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get beat by ID with full details
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create new beat with hierarchy validation
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update beat
     */
    static update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete beat (soft delete)
     */
    static delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export default BeatController;
//# sourceMappingURL=beatController.d.ts.map