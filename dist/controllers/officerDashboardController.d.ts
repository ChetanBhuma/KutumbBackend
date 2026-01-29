import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class OfficerDashboardController {
    /**
     * Helper to get scoping filter
     */
    private static getScopeFilter;
    /**
     * Get dashboard metrics (Assigned vs Completed, etc.)
     */
    static getMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get visit suggestions (prioritized by risk and duration)
     */
    static getSuggestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get nearby citizens for Map View
     */
    static getNearbyCitizens(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get officer profile
     */
    static getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get citizens in the officer's beat (Paginated list for "My Beat" view)
     */
    static getMyBeatCitizens(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=officerDashboardController.d.ts.map