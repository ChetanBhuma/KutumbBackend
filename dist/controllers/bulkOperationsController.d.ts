import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class BulkOperationsController {
    /**
     * Bulk import citizens from CSV
     * Expected CSV format: fullName,dateOfBirth,mobileNumber,aadhaarNumber,address,pinCode
     */
    static importCitizens(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk assign officers to citizens in a beat
     */
    static bulkAssignOfficer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Download CSV template for citizen import
     */
    static downloadTemplate(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=bulkOperationsController.d.ts.map