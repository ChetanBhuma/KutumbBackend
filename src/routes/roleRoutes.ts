import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { Role, Permission } from '../types/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { auditCRUD } from '../middleware/auditMiddleware';
import {
    listRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    listSystemPermissions,
    getRoleMatrix
} from '../controllers/roleController';

const router = Router();

router.use(authenticate);
// Allow users with SYSTEM_SETTINGS permission to manage roles
router.use(requirePermission(Permission.SYSTEM_SETTINGS));

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
router.get('/matrix', asyncHandler(getRoleMatrix));

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
router.get('/', asyncHandler(listRoles));

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
router.get('/permissions', asyncHandler(listSystemPermissions));

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
router.get('/:id', asyncHandler(getRoleById));

router.post('/', auditCRUD.create('role'), asyncHandler(createRole));
router.patch('/:id', auditCRUD.update('role'), asyncHandler(updateRole));
router.delete('/:id', auditCRUD.delete('role'), asyncHandler(deleteRole));

export default router;
