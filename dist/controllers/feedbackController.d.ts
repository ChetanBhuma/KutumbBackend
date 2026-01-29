import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class FeedbackController {
    /**
     * Submit visit feedback
     */
    static submitFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Get feedback for a visit
     */
    static getByVisit(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Get officer performance metrics
     */
    static getOfficerMetrics(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Get all feedbacks with filters
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
//# sourceMappingURL=feedbackController.d.ts.map