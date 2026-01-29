import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class NotificationController {
    /**
     * Send notification (admin/system use)
     */
    static sendNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Send bulk notifications
     */
    static sendBulkNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Test notification
     */
    static testNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=notificationController.d.ts.map