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

    /**
     * Get user notifications
     */
    static async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            // Check if user exists (should exist due to AuthRequest but good to be safe with !)
            if (!req.user?.id) {
                throw new AppError('User not authenticated', 401);
            }

            const result = await NotificationService.getUserNotifications(
                req.user.id,
                page,
                limit
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     */
    static async markRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!req.user?.id) throw new AppError('User not authenticated', 401);

            await NotificationService.markAsRead(id, req.user.id);
            res.json({ success: true, message: 'Notification marked as read' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?.id) throw new AppError('User not authenticated', 401);

            await NotificationService.markAllAsRead(req.user.id);
            res.json({ success: true, message: 'All notifications marked as read' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete notification
     */
    static async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!req.user?.id) throw new AppError('User not authenticated', 401);

            await NotificationService.deleteNotification(id, req.user.id);
            res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            next(error);
        }
    }
}
