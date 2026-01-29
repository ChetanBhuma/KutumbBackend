"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const notificationService_1 = require("../services/notificationService");
const router = (0, express_1.Router)();
// All routes require authentication and admin/super_admin role
router.use(authenticate_1.authenticate);
router.use((0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]));
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
router.post('/send', [
    (0, express_validator_1.body)('recipient').notEmpty().withMessage('Recipient is required'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('type').isIn(Object.values(notificationService_1.NotificationType)).withMessage('Valid notification type required'),
    (0, express_validator_1.body)('subject').optional().trim(),
    validate_1.validate
], notificationController_1.NotificationController.sendNotification);
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
router.post('/bulk', [
    (0, express_validator_1.body)('recipients').isArray({ min: 1 }).withMessage('At least one recipient required'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('type').isIn(Object.values(notificationService_1.NotificationType)).withMessage('Valid notification type required'),
    (0, express_validator_1.body)('subject').optional().trim(),
    validate_1.validate
], notificationController_1.NotificationController.sendBulkNotifications);
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
router.post('/test', [
    (0, express_validator_1.body)('type').isIn(Object.values(notificationService_1.NotificationType)).withMessage('Valid notification type required'),
    (0, express_validator_1.body)('recipient').notEmpty().withMessage('Recipient is required'),
    validate_1.validate
], notificationController_1.NotificationController.testNotification);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map