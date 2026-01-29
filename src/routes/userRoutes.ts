import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';
import { listUsers, updateUserRole, updateUserStatus, updateUser, createUser } from '../controllers/userController';
import { auditCRUD } from '../middleware/auditMiddleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);

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
router.get('/', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), asyncHandler(listUsers));

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
router.patch(
    '/:id',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    [
        param('id').isString().notEmpty(),
        body('email').optional().isEmail().withMessage('Invalid email format'),
        body('phone').optional().isMobilePhone('en-IN').withMessage('Invalid phone number'),
        validate
    ],
    asyncHandler(updateUser)
);

router.post('/', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), auditCRUD.create('user'), asyncHandler(createUser));

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
router.put('/:id/role', requireRole([Role.SUPER_ADMIN]), auditCRUD.update('user_role'), asyncHandler(updateUserRole));

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
router.patch('/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), auditCRUD.update('user_status'), asyncHandler(updateUserStatus));

export default router;
