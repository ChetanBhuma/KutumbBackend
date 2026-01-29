"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const beatController_1 = require("../controllers/beatController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const dataScopeMiddleware_1 = require("../middleware/dataScopeMiddleware");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../middleware/validation");
const requestLogger_1 = require("../middleware/requestLogger");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authenticate_1.authenticate);
router.use(dataScopeMiddleware_1.dataScopeMiddleware);
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
router.get('/', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_READ), [
    (0, express_validator_1.query)('policeStationId').optional().trim(),
    validate_1.validate
], beatController_1.BeatController.list);
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
router.get('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], beatController_1.BeatController.getById);
router.post('/', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), (0, requestLogger_1.dataModificationLogger)('CREATE', 'Beat'), [
    (0, express_validator_1.body)('name').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
    (0, express_validator_1.body)('code').trim().notEmpty().withMessage('Code is required'),
    (0, express_validator_1.body)('policeStationId').notEmpty().withMessage('Police station is required'),
    validate_1.validate
], beatController_1.BeatController.create);
router.put('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), (0, requestLogger_1.dataModificationLogger)('UPDATE', 'Beat'), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], beatController_1.BeatController.update);
router.delete('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), (0, requestLogger_1.dataModificationLogger)('DELETE', 'Beat'), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], beatController_1.BeatController.delete);
exports.default = router;
//# sourceMappingURL=beatRoutes.js.map