"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visitController_1 = require("../controllers/visitController");
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
router.get('/officer/assignments', (0, authorize_1.requireRole)(auth_1.Role.OFFICER), (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.getOfficerAssignments));
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
router.get('/', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_READ), [
    ...validation_1.ValidationRules.pagination(),
    (0, express_validator_1.query)('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']),
    (0, express_validator_1.query)('visitType').optional().isIn(['Routine', 'Emergency', 'Follow-up', 'Verification']),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.list));
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
router.get('/statistics', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_READ), (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.getStatistics));
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
router.get('/calendar', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_READ), [
    (0, express_validator_1.query)('startDate').notEmpty().isISO8601().withMessage('Valid start date required'),
    (0, express_validator_1.query)('endDate').notEmpty().isISO8601().withMessage('Valid end date required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.getCalendar));
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
router.get('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.getById));
router.post('/', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_SCHEDULE), auditMiddleware_1.auditCRUD.create('visit'), [
    (0, express_validator_1.body)('seniorCitizenId').notEmpty().withMessage('Citizen ID is required'),
    (0, express_validator_1.body)('officerId').notEmpty().withMessage('Officer ID is required'),
    (0, express_validator_1.body)('scheduledDate').isISO8601().withMessage('Valid scheduled date required'),
    (0, express_validator_1.body)('visitType').isIn(['Routine', 'Emergency', 'Follow-up', 'Verification']).withMessage('Valid visit type required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.create));
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
router.post('/auto-schedule', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_SCHEDULE), [
    (0, express_validator_1.body)('startDate').isISO8601().withMessage('Valid start date required'),
    (0, express_validator_1.body)('endDate').isISO8601().withMessage('Valid end date required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.autoSchedule));
router.put('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_SCHEDULE), auditMiddleware_1.auditCRUD.update('visit'), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.update));
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
router.post('/:id/complete', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_SCHEDULE), (0, auditMiddleware_1.auditAction)({ action: 'COMPLETE_VISIT', resource: 'visit', includeRequestBody: true }), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('notes').optional().trim(),
    (0, express_validator_1.body)('photoUrl').optional().trim(),
    validation_1.ValidationRules.latitude(),
    validation_1.ValidationRules.longitude(),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.complete));
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
router.post('/:id/start', (0, authorize_1.requireRole)([auth_1.Role.OFFICER, auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), [
    validation_1.ValidationRules.id('id'),
    validation_1.ValidationRules.latitude(),
    validation_1.ValidationRules.longitude(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.startVisit));
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
router.post('/:id/officer-complete', (0, authorize_1.requireRole)(auth_1.Role.OFFICER), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('notes').optional().trim(),
    (0, express_validator_1.body)('photoUrl').optional().trim(),
    (0, express_validator_1.body)('assessmentData').optional().isObject(),
    (0, express_validator_1.body)('gpsLatitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be valid').toFloat(),
    (0, express_validator_1.body)('gpsLongitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be valid').toFloat(),
    (0, express_validator_1.body)('riskScore').optional().isInt({ min: 0, max: 100 }).withMessage('Risk score must be between 0 and 100'),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.completeAsOfficer));
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
router.post('/:id/cancel', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_SCHEDULE), (0, auditMiddleware_1.auditAction)({ action: 'CANCEL_VISIT', resource: 'visit', includeRequestBody: true }), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('reason').notEmpty().withMessage('Cancellation reason is required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(visitController_1.VisitController.cancel));
exports.default = router;
//# sourceMappingURL=visitRoutes.js.map