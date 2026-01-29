import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class AsyncBulkController {
    /**
     * Queue large CSV imports for background processing
     */
    static queueCitizenImport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get import job status
     */
    static getImportStatus(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=asyncBulkController.d.ts.map