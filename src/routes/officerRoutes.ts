import { Router } from 'express';
import { OfficerController } from '../controllers/officerController';
import { authenticate } from '../middleware/authenticate';
import { requireAnyPermission, requirePermission } from '../middleware/authorize';
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';
import { Permission } from '../types/auth';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { ValidationRules } from '../middleware/validation';
import { auditCRUD, auditAction } from '../middleware/auditMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication and data scope filtering
router.use(authenticate);
router.use(dataScopeMiddleware);

/**
 * @swagger
 * /officers:
 *   get:
 *     tags: [Officers]
 *     summary: Get all officers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of officers
 *   post:
 *     tags: [Officers]
 *     summary: Create new officer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rank, badgeNumber, mobileNumber, policeStationId]
 *             properties:
 *               name:
 *                 type: string
 *               rank:
 *                 type: string
 *               badgeNumber:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               policeStationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Officer created
 */
router.get(
    '/',
    requireAnyPermission([Permission.OFFICERS_READ, Permission.VISITS_SCHEDULE, Permission.VISITS_READ]),
    [
        ...ValidationRules.pagination(),
        validate
    ],
    asyncHandler(OfficerController.list)
);

/**
 * @swagger
 * /officers/statistics:
 *   get:
 *     tags: [Officers]
 *     summary: Get officer statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Officer statistics
 */
router.get(
    '/statistics',
    requirePermission(Permission.OFFICERS_READ),
    asyncHandler(OfficerController.getStatistics)
);

/**
 * @swagger
 * /officers/workload:
 *   get:
 *     tags: [Officers]
 *     summary: Get workload distribution
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workload distribution
 */
router.get(
    '/workload',
    requirePermission(Permission.OFFICERS_READ),
    asyncHandler(OfficerController.getWorkloadDistribution)
);

/**
 * @swagger
 * /officers/{id}:
 *   get:
 *     tags: [Officers]
 *     summary: Get officer by ID
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
 *         description: Officer details
 *   put:
 *     tags: [Officers]
 *     summary: Update officer
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
 *               name:
 *                 type: string
 *               rank:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Officer updated
 *   delete:
 *     tags: [Officers]
 *     summary: Delete officer
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
 *         description: Officer deleted
 */
router.get(
    '/:id',
    requirePermission(Permission.OFFICERS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(OfficerController.getById)
);

router.post(
    '/',
    requirePermission(Permission.OFFICERS_WRITE),
    auditCRUD.create('officer'),
    [
        body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
        body('rank').notEmpty().withMessage('Rank is required'),
        body('badgeNumber').notEmpty().withMessage('Badge number is required'),
        body('mobileNumber').matches(/^\+?91?[6-9]\d{9}$/).withMessage('Valid mobile number required'),
        body('policeStationId').notEmpty().withMessage('Police station is required'),
        validate
    ],
    asyncHandler(OfficerController.create)
);

router.put(
    '/:id',
    requirePermission(Permission.OFFICERS_WRITE),
    auditCRUD.update('officer'),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(OfficerController.update)
);

router.delete(
    '/:id',
    requirePermission(Permission.OFFICERS_DELETE),
    auditCRUD.delete('officer'),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(OfficerController.delete)
);

/**
 * @swagger
 * /officers/{id}/assign-beat:
 *   post:
 *     tags: [Officers]
 *     summary: Assign officer to beat
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
 *             required: [beatId]
 *             properties:
 *               beatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Beat assigned
 */
router.post(
    '/:id/assign-beat',
    requirePermission(Permission.OFFICERS_MANAGE),
    auditAction({ action: 'ASSIGN_BEAT', resource: 'officer', includeRequestBody: true }),
    [
        ValidationRules.id('id'),
        body('beatId').optional({ nullable: true }), // Allow null/undefined for unassignment
        validate
    ],
    asyncHandler(OfficerController.assignToBeat)
);

/**
 * @swagger
 * /officers/{id}/transfer:
 *   post:
 *     tags: [Officers]
 *     summary: Transfer officer to new beat/station
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
 *             required: [newBeatId, newPoliceStationId, effectiveDate, reason]
 *             properties:
 *               newBeatId:
 *                 type: string
 *               newPoliceStationId:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Officer transferred
 */
router.post(
    '/:id/transfer',
    requirePermission(Permission.OFFICERS_MANAGE),
    auditAction({ action: 'TRANSFER_OFFICER', resource: 'officer', includeRequestBody: true }),
    [
        ValidationRules.id('id'),
        body('newBeatId').isString().notEmpty().withMessage('New beat ID is required'),
        body('newPoliceStationId').isString().notEmpty().withMessage('New police station ID is required'),
        body('effectiveDate').isISO8601().withMessage('Valid effective date is required'),
        body('reason').isString().notEmpty().withMessage('Transfer reason is required'),
        validate
    ],
    asyncHandler(OfficerController.transferOfficer)
);

/**
 * @swagger
 * /officers/{id}/transfer/preview:
 *   post:
 *     tags: [Officers]
 *     summary: Preview officer transfer impact
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
 *             required: [newBeatId]
 *             properties:
 *               newBeatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer preview
 */
router.post(
    '/:id/transfer/preview',
    requirePermission(Permission.OFFICERS_MANAGE),
    [
        ValidationRules.id('id'),
        body('newBeatId').isString().notEmpty().withMessage('New beat ID is required'),
        validate
    ],
    asyncHandler(OfficerController.previewTransfer)
);

/**
 * @swagger
 * /officers/{id}/transfer-history:
 *   get:
 *     tags: [Officers]
 *     summary: Get officer transfer history
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
 *         description: Transfer history
 */
router.get(
    '/:id/transfer-history',
    requirePermission(Permission.OFFICERS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(OfficerController.getTransferHistory)
);

export default router;
