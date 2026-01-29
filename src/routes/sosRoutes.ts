import { Router } from 'express';
import { SOSController } from '../controllers/sosController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission, requireRole } from '../middleware/authorize';
import { Permission, Role } from '../types/auth';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { ValidationRules } from '../middleware/validation';
import { auditAction } from '../middleware/auditMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /sos:
 *   post:
 *     tags: [SOS]
 *     summary: Create SOS alert (Panic Button)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: SOS alert created
 *   get:
 *     tags: [SOS]
 *     summary: Get all SOS alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Responded, Resolved, False Alarm]
 *     responses:
 *       200:
 *         description: List of SOS alerts
 */
router.post(
    '/',
    requirePermission(Permission.SOS_CREATE),
    auditAction({ action: 'CREATE_SOS_ALERT', resource: 'sos_alert', includeRequestBody: true }),
    [
        ValidationRules.latitude(),
        ValidationRules.longitude(),
        body('address').optional().trim(),
        validate
    ],
    asyncHandler(SOSController.createAlert)
);

router.get(
    '/',
    requirePermission(Permission.SOS_READ),
    [
        ...ValidationRules.pagination(),
        query('status').optional().isIn(['Active', 'Responded', 'Resolved', 'False Alarm']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate
    ],
    asyncHandler(SOSController.list)
);

/**
 * @swagger
 * /sos/active:
 *   get:
 *     tags: [SOS]
 *     summary: Get active alerts (Real-time monitoring)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active alerts
 */
router.get(
    '/active',
    requirePermission(Permission.SOS_RESPOND),
    asyncHandler(SOSController.getActiveAlerts)
);

/**
 * @swagger
 * /sos/statistics:
 *   get:
 *     tags: [SOS]
 *     summary: Get SOS statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SOS statistics
 */
router.get(
    '/statistics',
    requirePermission(Permission.SOS_READ),
    asyncHandler(SOSController.getStatistics)
);

/**
 * @swagger
 * /sos/citizen/{citizenId}:
 *   get:
 *     tags: [SOS]
 *     summary: Get alert history for a citizen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citizen alert history
 */
router.get(
    '/citizen/:citizenId',
    requirePermission(Permission.SOS_READ),
    [
        ValidationRules.id('citizenId'),
        validate
    ],
    asyncHandler(SOSController.getCitizenHistory)
);

/**
 * @swagger
 * /sos/{id}:
 *   get:
 *     tags: [SOS]
 *     summary: Get SOS alert by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SOS alert details
 */
router.get(
    '/:id',
    requirePermission(Permission.SOS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(SOSController.getById)
);

/**
 * @swagger
 * /sos/{id}/status:
 *   patch:
 *     tags: [SOS]
 *     summary: Update alert status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Responded, Resolved, False Alarm]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
    '/:id/status',
    requirePermission(Permission.SOS_RESPOND),
    auditAction({ action: 'UPDATE_SOS_STATUS', resource: 'sos_alert', includeRequestBody: true }),
    [
        ValidationRules.id('id'),
        body('status').isIn(['Active', 'Responded', 'Resolved', 'False Alarm']).withMessage('Valid status required'),
        body('notes').optional().trim(),
        validate
    ],
    asyncHandler(SOSController.updateStatus)
);

/**
 * @swagger
 * /sos/{id}/location:
 *   post:
 *     tags: [SOS]
 *     summary: Update location during SOS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               batteryLevel:
 *                 type: integer
 *               deviceInfo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated
 */
router.post(
    '/:id/location',
    requireRole([Role.CITIZEN, Role.OFFICER, Role.ADMIN, Role.SUPER_ADMIN]),
    auditAction({ action: 'UPDATE_SOS_LOCATION', resource: 'sos_alert' }),
    [
        ValidationRules.id('id'),
        ValidationRules.latitude(),
        ValidationRules.longitude(),
        body('batteryLevel').optional().isInt({ min: 0, max: 100 }).withMessage('Battery level must be 0-100'),
        body('deviceInfo').optional().isString().isLength({ max: 200 }).withMessage('Device info too long'),
        validate
    ],
    asyncHandler(SOSController.updateLocation)
);

export default router;
