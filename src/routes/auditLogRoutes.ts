import { Router } from 'express';
import { query, param } from 'express-validator';
import { AuditLogController } from '../controllers/auditLogController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { Permission } from '../types/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All audit log routes require authentication and AUDIT_LOGS permission
router.use(authenticate);
router.use(requirePermission(Permission.AUDIT_LOGS));

router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('userId').optional().isString(),
        query('action').optional().isString(),
        query('entityType').optional().isString(),
        query('entityId').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('sortBy').optional().isString(),
        query('sortOrder').optional().isIn(['asc', 'desc']),
        validate
    ],
    AuditLogController.getLogs
);

router.get(
    '/:id',
    [
        param('id').notEmpty().withMessage('Audit log ID is required'),
        validate
    ],
    AuditLogController.getById
);

export default router;
