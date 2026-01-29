"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const officerController_1 = require("../controllers/officerController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const dataScopeMiddleware_1 = require("../middleware/dataScopeMiddleware");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../middleware/validation");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
// All routes require authentication and data scope filtering
router.use(authenticate_1.authenticate);
router.use(dataScopeMiddleware_1.dataScopeMiddleware);
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
router.get('/', (0, authorize_1.requireAnyPermission)([auth_1.Permission.OFFICERS_READ, auth_1.Permission.VISITS_SCHEDULE, auth_1.Permission.VISITS_READ]), [
    ...validation_1.ValidationRules.pagination(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.list));
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
router.get('/statistics', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_READ), (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.getStatistics));
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
router.get('/workload', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_READ), (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.getWorkloadDistribution));
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
router.get('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.getById));
router.post('/', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_WRITE), auditMiddleware_1.auditCRUD.create('officer'), [
    (0, express_validator_1.body)('name').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
    (0, express_validator_1.body)('rank').notEmpty().withMessage('Rank is required'),
    (0, express_validator_1.body)('badgeNumber').notEmpty().withMessage('Badge number is required'),
    (0, express_validator_1.body)('mobileNumber').matches(/^\+?91?[6-9]\d{9}$/).withMessage('Valid mobile number required'),
    (0, express_validator_1.body)('policeStationId').notEmpty().withMessage('Police station is required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.create));
router.put('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_WRITE), auditMiddleware_1.auditCRUD.update('officer'), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.update));
router.delete('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_DELETE), auditMiddleware_1.auditCRUD.delete('officer'), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.delete));
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
router.post('/:id/assign-beat', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), (0, auditMiddleware_1.auditAction)({ action: 'ASSIGN_BEAT', resource: 'officer', includeRequestBody: true }), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('beatId').optional({ nullable: true }), // Allow null/undefined for unassignment
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.assignToBeat));
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
router.post('/:id/transfer', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), (0, auditMiddleware_1.auditAction)({ action: 'TRANSFER_OFFICER', resource: 'officer', includeRequestBody: true }), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('newBeatId').isString().notEmpty().withMessage('New beat ID is required'),
    (0, express_validator_1.body)('newPoliceStationId').isString().notEmpty().withMessage('New police station ID is required'),
    (0, express_validator_1.body)('effectiveDate').isISO8601().withMessage('Valid effective date is required'),
    (0, express_validator_1.body)('reason').isString().notEmpty().withMessage('Transfer reason is required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.transferOfficer));
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
router.post('/:id/transfer/preview', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('newBeatId').isString().notEmpty().withMessage('New beat ID is required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.previewTransfer));
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
router.get('/:id/transfer-history', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(officerController_1.OfficerController.getTransferHistory));
exports.default = router;
//# sourceMappingURL=officerRoutes.js.map