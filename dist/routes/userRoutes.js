"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const userController_1 = require("../controllers/userController");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const express_validator_2 = require("express-validator");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *   post:
 *     tags: [Users]
 *     summary: Create user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone, roleCode]
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               roleCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.get('/', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), (0, asyncHandler_1.asyncHandler)(userController_1.listUsers));
/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user details (Admin only)
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.patch('/:id', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), [
    (0, express_validator_2.param)('id').isString().notEmpty(),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('en-IN').withMessage('Invalid phone number'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(userController_1.updateUser));
router.post('/', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), auditMiddleware_1.auditCRUD.create('user'), (0, asyncHandler_1.asyncHandler)(userController_1.createUser));
/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     tags: [Users]
 *     summary: Update user role (Super Admin only)
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
 *             required: [roleCode]
 *             properties:
 *               roleCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role updated
 */
router.put('/:id/role', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), auditMiddleware_1.auditCRUD.update('user_role'), (0, asyncHandler_1.asyncHandler)(userController_1.updateUserRole));
/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Update user status (Active/Inactive)
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch('/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), auditMiddleware_1.auditCRUD.update('user_status'), (0, asyncHandler_1.asyncHandler)(userController_1.updateUserStatus));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map