"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const dataScopeMiddleware_1 = require("../middleware/dataScopeMiddleware");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// All routes require authentication and data scope filtering
router.use(authenticate_1.authenticate);
router.use(dataScopeMiddleware_1.dataScopeMiddleware);
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
router.get('/dashboard', (0, authorize_1.requirePermission)(auth_1.Permission.REPORTS_READ), [
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    (0, express_validator_1.query)('beatId').optional().trim(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    validate_1.validate
], reportController_1.ReportController.getDashboardStats);
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
router.get('/demographics', (0, authorize_1.requirePermission)(auth_1.Permission.REPORTS_READ), reportController_1.ReportController.getCitizenDemographics);
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
router.get('/visits', (0, authorize_1.requirePermission)(auth_1.Permission.REPORTS_READ), [
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    (0, express_validator_1.query)('beatId').optional().trim(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('groupBy').optional().isIn(['day', 'week', 'month']),
    validate_1.validate
], reportController_1.ReportController.getVisitAnalytics);
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
router.get('/performance', (0, authorize_1.requirePermission)(auth_1.Permission.REPORTS_READ), [
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    validate_1.validate
], reportController_1.ReportController.getOfficerPerformance);
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
router.get('/export', (0, authorize_1.requirePermission)(auth_1.Permission.REPORTS_EXPORT), [
    (0, express_validator_1.query)('type').isIn(['citizens', 'visits', 'sos']).withMessage('Valid export type required'),
    (0, express_validator_1.query)('format').optional().isIn(['csv', 'json']),
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    validate_1.validate
], reportController_1.ReportController.exportData);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map