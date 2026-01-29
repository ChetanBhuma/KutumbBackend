import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { NotificationType } from '../services/notificationService';

const router = Router();

// All routes require authentication and admin/super_admin role
router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     tags: [Notifications]
 *     summary: Send single notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient, message, type]
 *             properties:
 *               recipient:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SMS, EMAIL, PUSH, IN_APP]
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification sent
 */
router.post(
    '/send',
    [
        body('recipient').notEmpty().withMessage('Recipient is required'),
        body('message').notEmpty().withMessage('Message is required'),
        body('type').isIn(Object.values(NotificationType)).withMessage('Valid notification type required'),
        body('subject').optional().trim(),
        validate
    ],
    NotificationController.sendNotification
);

/**
 * @swagger
 * /notifications/bulk:
 *   post:
 *     tags: [Notifications]
 *     summary: Send bulk notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipients, message, type]
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SMS, EMAIL, PUSH, IN_APP]
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications sent
 */
router.post(
    '/bulk',
    [
        body('recipients').isArray({ min: 1 }).withMessage('At least one recipient required'),
        body('message').notEmpty().withMessage('Message is required'),
        body('type').isIn(Object.values(NotificationType)).withMessage('Valid notification type required'),
        body('subject').optional().trim(),
        validate
    ],
    NotificationController.sendBulkNotifications
);

/**
 * @swagger
 * /notifications/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Send test notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient, type]
 *             properties:
 *               recipient:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SMS, EMAIL, PUSH, IN_APP]
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post(
    '/test',
    [
        body('type').isIn(Object.values(NotificationType)).withMessage('Valid notification type required'),
        body('recipient').notEmpty().withMessage('Recipient is required'),
        validate
    ],
    NotificationController.testNotification
);

export default router;
