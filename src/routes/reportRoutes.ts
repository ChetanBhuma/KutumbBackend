import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { dataScopeMiddleware } from '../middleware/dataScopeMiddleware';
import { Permission } from '../types/auth';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication and data scope filtering
router.use(authenticate);
router.use(dataScopeMiddleware);

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     tags: [Reports]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policeStationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: beatId
 *         schema:
 *           type: string
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
 *         description: Dashboard stats
 */
router.get(
    '/dashboard',
    requirePermission(Permission.REPORTS_READ),
    [
        query('policeStationId').optional().trim(),
        query('beatId').optional().trim(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate
    ],
    ReportController.getDashboardStats
);

/**
 * @swagger
 * /reports/demographics:
 *   get:
 *     tags: [Reports]
 *     summary: Get citizen demographics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demographics data
 */
router.get(
    '/demographics',
    requirePermission(Permission.REPORTS_READ),
    ReportController.getCitizenDemographics
);

/**
 * @swagger
 * /reports/visits:
 *   get:
 *     tags: [Reports]
 *     summary: Get visit analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policeStationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: beatId
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Visit analytics
 */
router.get(
    '/visits',
    requirePermission(Permission.REPORTS_READ),
    [
        query('policeStationId').optional().trim(),
        query('beatId').optional().trim(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('groupBy').optional().isIn(['day', 'week', 'month']),
        validate
    ],
    ReportController.getVisitAnalytics
);

/**
 * @swagger
 * /reports/performance:
 *   get:
 *     tags: [Reports]
 *     summary: Get officer performance report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policeStationId
 *         schema:
 *           type: string
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
 *         description: Performance report
 */
router.get(
    '/performance',
    requirePermission(Permission.REPORTS_READ),
    [
        query('policeStationId').optional().trim(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate
    ],
    ReportController.getOfficerPerformance
);

/**
 * @swagger
 * /reports/export:
 *   get:
 *     tags: [Reports]
 *     summary: Export data (CSV/JSON)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [citizens, visits, sos]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *       - in: query
 *         name: policeStationId
 *         schema:
 *           type: string
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
 *         description: Exported data file
 */
router.get(
    '/export',
    requirePermission(Permission.REPORTS_EXPORT),
    [
        query('type').isIn(['citizens', 'visits', 'sos']).withMessage('Valid export type required'),
        query('format').optional().isIn(['csv', 'json']),
        query('policeStationId').optional().trim(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate
    ],
    ReportController.exportData
);

export default router;
