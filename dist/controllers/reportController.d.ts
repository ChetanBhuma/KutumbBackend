import { Request, Response, NextFunction } from 'express';
export declare class ReportController {
    /**
     * Get dashboard overview statistics
     */
    static getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get citizen demographics report
     */
    static getCitizenDemographics(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get visit analytics
     */
    static getVisitAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get officer performance report
     */
    static getOfficerPerformance(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Export data to CSV/Excel
     */
    static exportData(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=reportController.d.ts.map