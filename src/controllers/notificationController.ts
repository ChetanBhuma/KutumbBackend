import { Response, NextFunction } from 'express';
import { NotificationService, NotificationType, NotificationPriority } from '../services/notificationService';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import { AuthRequest } from '../middleware/authenticate';

export class NotificationController {
    /**
     * Send notification (admin/system use)
     */
    static async sendNotification(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { recipient, subject, message, type, priority, data } = req.body;

            const success = await NotificationService.send({
                recipient,
                subject,
                message,
                type,
                priority,
                data
            });

            if (!success) {
                throw new AppError('Failed to send notification', 500);
            }

            auditLogger.info('Notification sent', {
                type,
                recipient,
                sentBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Notification sent successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send bulk notifications
     */
    static async sendBulkNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { recipients, subject, message, type } = req.body;

            const results = await Promise.allSettled(
                recipients.map((recipient: string) =>
                    NotificationService.send({
                        recipient,
                        subject,
                        message,
                        type,
                        priority: NotificationPriority.NORMAL
                    })
                )
            );

            const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
            const failureCount = results.length - successCount;

            auditLogger.info('Bulk notifications sent', {
                type,
                total: recipients.length,
                success: successCount,
                failed: failureCount,
                sentBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: {
                    total: recipients.length,
                    sent: successCount,
                    failed: failureCount
                },
                message: `Sent ${successCount} out of ${recipients.length} notifications`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Test notification
     */
    static async testNotification(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { type, recipient } = req.body;

            let success = false;
            let testMessage = 'This is a test notification from Delhi Police Senior Citizen Portal';

            switch (type) {
                case NotificationType.SMS:
                    success = await NotificationService.sendSMS(recipient, testMessage);
                    break;
                case NotificationType.EMAIL:
                    success = await NotificationService.sendEmail(
                        recipient,
                        'Test Notification',
                        testMessage
                    );
                    break;
                case NotificationType.PUSH:
                    success = await NotificationService.sendPushNotification(
                        recipient,
                        'Test Notification',
                        testMessage
                    );
                    break;
                default:
                    throw new AppError('Invalid notification type', 400);
            }

            res.json({
                success,
                message: success ? 'Test notification sent successfully' : 'Failed to send test notification'
            });
        } catch (error) {
            next(error);
        }
    }
}
