import { Request, Response } from 'express';
export declare class ExportController {
    /**
     * Export Citizens to CSV
     */
    static exportCitizens(req: Request, res: Response): Promise<void>;
    /**
     * Export Visits to Excel
     */
    static exportVisits(req: Request, res: Response): Promise<void>;
    /**
     * Generate PDF Report
     */
    static generateReport(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=exportController.d.ts.map