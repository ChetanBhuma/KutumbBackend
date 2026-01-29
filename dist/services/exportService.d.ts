import { Response } from 'express';
export declare class ExportService {
    /**
     * Generate CSV for Citizens
     */
    static generateCitizensCSV(citizens: any[]): Promise<string>;
    /**
     * Generate Excel for Visits
     */
    static generateVisitsExcel(visits: any[]): Promise<Buffer>;
    /**
     * Generate PDF Report
     */
    static generateReportPDF(data: any, res: Response): void;
}
//# sourceMappingURL=exportService.d.ts.map