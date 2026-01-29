import { Router } from 'express';
import { VisitController } from '../controllers/visitController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission, requireRole, requireAnyPermission } from '../middleware/authorize';
import { Permission, Role } from '../types/auth';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { ValidationRules } from '../middleware/validation';
import { auditCRUD, auditAction } from '../middleware/auditMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /visits/officer/assignments:
 *   get:
 *     tags: [Visits]
 *     summary: Get visits assigned to current officer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned visits
 */
router.get(
    '/officer/assignments',
    requireAnyPermission([Permission.VISITS_READ, Permission.VISITS_COMPLETE]),
    asyncHandler(VisitController.getOfficerAssignments)
);

/**
 * @swagger
 * /visits:
 *   get:
 *     tags: [Visits]
 *     summary: Get all visits with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Scheduled, In Progress, Completed, Cancelled]
 *       - in: query
 *         name: visitType
 *         schema:
 *           type: string
 *           enum: [Routine, Emergency, Follow-up, Verification]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of visits
 *   post:
 *     tags: [Visits]
 *     summary: Schedule a new visit (Manual)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seniorCitizenId, officerId, scheduledDate, visitType]
 *             properties:
 *               seniorCitizenId:
 *                 type: string
 *               officerId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               visitType:
 *                 type: string
 *                 enum: [Routine, Emergency, Follow-up, Verification]
 *     responses:
 *       201:
 *         description: Visit scheduled
 */
router.get(
    '/',
    requirePermission(Permission.VISITS_READ),
    [
        ...ValidationRules.pagination(),
        query('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']),
        query('visitType').optional().isIn(['Routine', 'Emergency', 'Follow-up', 'Verification']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate
    ],
    asyncHandler(VisitController.list)
);

/**
 * @swagger
 * /visits/statistics:
 *   get:
 *     tags: [Visits]
 *     summary: Get visit statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visit statistics
 */
router.get(
    '/statistics',
    requirePermission(Permission.VISITS_READ),
    asyncHandler(VisitController.getStatistics)
);

/**
 * @swagger
 * /visits/calendar:
 *   get:
 *     tags: [Visits]
 *     summary: Get visit calendar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Calendar events
 */
router.get(
    '/calendar',
    requirePermission(Permission.VISITS_READ),
    [
        query('startDate').notEmpty().isISO8601().withMessage('Valid start date required'),
        query('endDate').notEmpty().isISO8601().withMessage('Valid end date required'),
        validate
    ],
    asyncHandler(VisitController.getCalendar)
);

/**
 * @swagger
 * /visits/{id}:
 *   get:
 *     tags: [Visits]
 *     summary: Get visit by ID
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
 *         description: Visit details
 *   put:
 *     tags: [Visits]
 *     summary: Update visit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Visit'
 *     responses:
 *       200:
 *         description: Visit updated
 */
router.get(
    '/:id',
    requirePermission(Permission.VISITS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(VisitController.getById)
);

router.post(
    '/',
    requirePermission(Permission.VISITS_SCHEDULE),
    auditCRUD.create('visit'),
    [
        body('seniorCitizenId').notEmpty().withMessage('Citizen ID is required'),
        body('officerId').notEmpty().withMessage('Officer ID is required'),
        body('scheduledDate').isISO8601().withMessage('Valid scheduled date required'),
        body('visitType').isIn(['Routine', 'Emergency', 'Follow-up', 'Verification']).withMessage('Valid visit type required'),
        validate
    ],
    asyncHandler(VisitController.create)
);

/**
 * @swagger
 * /visits/auto-schedule:
 *   post:
 *     tags: [Visits]
 *     summary: Auto-schedule visits based on rules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Auto-schedule result
 */
router.post(
    '/auto-schedule',
    requirePermission(Permission.VISITS_SCHEDULE),
    [
        body('startDate').isISO8601().withMessage('Valid start date required'),
        body('endDate').isISO8601().withMessage('Valid end date required'),
        validate
    ],
    asyncHandler(VisitController.autoSchedule)
);

router.put(
    '/:id',
    requirePermission(Permission.VISITS_SCHEDULE),
    auditCRUD.update('visit'),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(VisitController.update)
);

/**
 * @swagger
 * /visits/{id}/complete:
 *   post:
 *     tags: [Visits]
 *     summary: Mark visit as completed (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               photoUrl:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Visit marked as completed
 */
router.post(
    '/:id/complete',
    requirePermission(Permission.VISITS_SCHEDULE),
    auditAction({ action: 'COMPLETE_VISIT', resource: 'visit', includeRequestBody: true }),
    [
        ValidationRules.id('id'),
        body('notes').optional().trim(),
        body('photoUrl').optional().trim(),
        ValidationRules.latitude(),
        ValidationRules.longitude(),
        body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
        validate
    ],
    asyncHandler(VisitController.complete)
);

/**
 * @swagger
 * /visits/{id}/start:
 *   post:
 *     tags: [Visits]
 *     summary: Start a visit (Officer)
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
 *     responses:
 *       200:
 *         description: Visit started
 */
router.post(
    '/:id/start',
    requireAnyPermission([Permission.VISITS_COMPLETE, Permission.VISITS_SCHEDULE]),
    [
        ValidationRules.id('id'),
        ValidationRules.latitude(),
        ValidationRules.longitude(),
        validate
    ],
    asyncHandler(VisitController.startVisit)
);


/**
 * @swagger
 * /visits/{id}/officer-complete:
 *   post:
 *     tags: [Visits]
 *     summary: Complete a visit (Officer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               photoUrl:
 *                 type: string
 *               riskScore:
 *                 type: integer
 *               assessmentData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Visit completed by officer
 */
router.post(
    '/:id/officer-complete',
    requirePermission(Permission.VISITS_COMPLETE),
    [
        ValidationRules.id('id'),
        body('notes').optional().trim(),
        body('photoUrl').optional().trim(),
        body('assessmentData').optional().isObject(),
        body('gpsLatitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be valid').toFloat(),
        body('gpsLongitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be valid').toFloat(),
        body('riskScore').optional().isInt({ min: 0, max: 100 }).withMessage('Risk score must be between 0 and 100'),
        body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
        validate
    ],
    asyncHandler(VisitController.completeAsOfficer)
);

/**
 * @swagger
 * /visits/{id}/cancel:
 *   post:
 *     tags: [Visits]
 *     summary: Cancel a visit
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit cancelled
 */
router.post(
    '/:id/cancel',
    requirePermission(Permission.VISITS_SCHEDULE),
    auditAction({ action: 'CANCEL_VISIT', resource: 'visit', includeRequestBody: true }),
    [
        ValidationRules.id('id'),
        body('reason').notEmpty().withMessage('Cancellation reason is required'),
        validate
    ],
    asyncHandler(VisitController.cancel)
);

export default router;
