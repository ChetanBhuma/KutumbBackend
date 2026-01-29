"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sosController_1 = require("../controllers/sosController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../middleware/validation");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authenticate_1.authenticate);
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
router.post('/', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_CREATE), (0, auditMiddleware_1.auditAction)({ action: 'CREATE_SOS_ALERT', resource: 'sos_alert', includeRequestBody: true }), [
    validation_1.ValidationRules.latitude(),
    validation_1.ValidationRules.longitude(),
    (0, express_validator_1.body)('address').optional().trim(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.createAlert));
router.get('/', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_READ), [
    ...validation_1.ValidationRules.pagination(),
    (0, express_validator_1.query)('status').optional().isIn(['Active', 'Responded', 'Resolved', 'False Alarm']),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.list));
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
router.get('/active', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_RESPOND), (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.getActiveAlerts));
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
router.get('/statistics', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_READ), (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.getStatistics));
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
router.get('/citizen/:citizenId', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_READ), [
    validation_1.ValidationRules.id('citizenId'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.getCitizenHistory));
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
router.get('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.getById));
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
router.patch('/:id/status', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_RESPOND), (0, auditMiddleware_1.auditAction)({ action: 'UPDATE_SOS_STATUS', resource: 'sos_alert', includeRequestBody: true }), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('status').isIn(['Active', 'Responded', 'Resolved', 'False Alarm']).withMessage('Valid status required'),
    (0, express_validator_1.body)('notes').optional().trim(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.updateStatus));
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
router.post('/:id/location', (0, authorize_1.requireRole)([auth_1.Role.CITIZEN, auth_1.Role.OFFICER, auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), (0, auditMiddleware_1.auditAction)({ action: 'UPDATE_SOS_LOCATION', resource: 'sos_alert' }), [
    validation_1.ValidationRules.id('id'),
    validation_1.ValidationRules.latitude(),
    validation_1.ValidationRules.longitude(),
    (0, express_validator_1.body)('batteryLevel').optional().isInt({ min: 0, max: 100 }).withMessage('Battery level must be 0-100'),
    (0, express_validator_1.body)('deviceInfo').optional().isString().isLength({ max: 200 }).withMessage('Device info too long'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(sosController_1.SOSController.updateLocation));
exports.default = router;
//# sourceMappingURL=sosRoutes.js.map