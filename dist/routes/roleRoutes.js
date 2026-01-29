"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const asyncHandler_1 = require("../middleware/asyncHandler");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const roleController_1 = require("../controllers/roleController");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Allow users with SYSTEM_SETTINGS permission to manage roles
router.use((0, authorize_1.requirePermission)(auth_1.Permission.SYSTEM_SETTINGS));
/**
 * @swagger
 * /roles/matrix:
 *   get:
 *     tags: [Roles]
 *     summary: Get role matrix with user counts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role matrix
 */
router.get('/matrix', (0, asyncHandler_1.asyncHandler)(roleController_1.getRoleMatrix));
/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *   post:
 *     tags: [Roles]
 *     summary: Create new role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Role created
 */
router.get('/', (0, asyncHandler_1.asyncHandler)(roleController_1.listRoles));
/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: List available system permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/permissions', (0, asyncHandler_1.asyncHandler)(roleController_1.listSystemPermissions));
/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
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
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *   patch:
 *     tags: [Roles]
 *     summary: Update role
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
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
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
 *         description: Role deleted
 */
router.get('/:id', (0, asyncHandler_1.asyncHandler)(roleController_1.getRoleById));
router.post('/', auditMiddleware_1.auditCRUD.create('role'), (0, asyncHandler_1.asyncHandler)(roleController_1.createRole));
router.patch('/:id', auditMiddleware_1.auditCRUD.update('role'), (0, asyncHandler_1.asyncHandler)(roleController_1.updateRole));
router.delete('/:id', auditMiddleware_1.auditCRUD.delete('role'), (0, asyncHandler_1.asyncHandler)(roleController_1.deleteRole));
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map