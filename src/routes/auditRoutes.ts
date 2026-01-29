import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

/**
 * @swagger
 * /audit/logs:
 *   get:
 *     tags: [Audit]
 *     summary: Get audit logs
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
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of audit logs
 */
router.get('/logs', AuditController.getLogs);

export default router;
