import { Router } from 'express';
import { BeatController } from '../controllers/beatController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';
import { Permission } from '../types/auth';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { ValidationRules } from '../middleware/validation';
import { dataModificationLogger } from '../middleware/requestLogger';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(dataScopeMiddleware);

/**
 * @swagger
 * /beats:
 *   get:
 *     tags: [Beats]
 *     summary: Get all beats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policeStationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of beats
 *   post:
 *     tags: [Beats]
 *     summary: Create new beat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, policeStationId]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               policeStationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Beat created
 */
router.get(
    '/',
    requirePermission(Permission.OFFICERS_READ),
    [
        query('policeStationId').optional().trim(),
        validate
    ],
    BeatController.list
);

/**
 * @swagger
 * /beats/{id}:
 *   get:
 *     tags: [Beats]
 *     summary: Get beat by ID
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
 *         description: Beat details
 *   put:
 *     tags: [Beats]
 *     summary: Update beat
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
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Beat updated
 *   delete:
 *     tags: [Beats]
 *     summary: Delete beat
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
 *         description: Beat deleted
 */
router.get(
    '/:id',
    requirePermission(Permission.OFFICERS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    BeatController.getById
);

router.post(
    '/',
    requirePermission(Permission.OFFICERS_MANAGE),
    dataModificationLogger('CREATE', 'Beat'),
    [
        body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
        body('code').trim().notEmpty().withMessage('Code is required'),
        body('policeStationId').notEmpty().withMessage('Police station is required'),
        validate
    ],
    BeatController.create
);

router.put(
    '/:id',
    requirePermission(Permission.OFFICERS_MANAGE),
    dataModificationLogger('UPDATE', 'Beat'),
    [
        ValidationRules.id('id'),
        validate
    ],
    BeatController.update
);

router.delete(
    '/:id',
    requirePermission(Permission.OFFICERS_MANAGE),
    dataModificationLogger('DELETE', 'Beat'),
    [
        ValidationRules.id('id'),
        validate
    ],
    BeatController.delete
);

export default router;
