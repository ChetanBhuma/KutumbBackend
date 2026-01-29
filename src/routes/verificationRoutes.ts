import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission, requireRole } from '../middleware/authorize';
import { Permission, Role } from '../types/auth';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { ValidationRules } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/verifications
 * @desc    Create verification request
 * @access  Private (CITIZENS_WRITE permission)
 */
router.post(
    '/',
    requirePermission(Permission.CITIZENS_WRITE),
    [
        body('entityType').isIn(['HouseholdHelp', 'EmergencyContact', 'Tenant', 'Other']).withMessage('Valid entity type required'),
        body('entityId').trim().notEmpty().withMessage('Entity ID required'),
        body('seniorCitizenId').trim().notEmpty().withMessage('Citizen ID required'),
        body('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']),
        body('remarks').optional().trim(),
        body('documents').optional().isArray(),
        validate
    ],
    asyncHandler(VerificationController.createRequest)
);

/**
 * @route   GET /api/v1/verifications
 * @desc    Get all verification requests
 * @access  Private (CITIZENS_READ permission)
 */
router.get(
    '/',
    requirePermission(Permission.CITIZENS_READ),
    [
        query('status').optional().isIn(['Pending', 'InProgress', 'Approved', 'Rejected']),
        query('entityType').optional().isIn(['HouseholdHelp', 'EmergencyContact', 'Tenant', 'Other']),
        query('assignedTo').optional().trim(),
        query('seniorCitizenId').optional().trim(),
        query('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']),
        validate
    ],
    asyncHandler(VerificationController.list)
);

/**
 * @route   GET /api/v1/verifications/statistics
 * @desc    Get verification statistics
 * @access  Private (CITIZENS_READ permission)
 */
router.get(
    '/statistics',
    requirePermission(Permission.CITIZENS_READ),
    [
        query('entityType').optional().isIn(['HouseholdHelp', 'EmergencyContact', 'Tenant', 'Other']),
        query('assignedTo').optional().trim(),
        validate
    ],
    asyncHandler(VerificationController.getStatistics)
);

/**
 * @route   GET /api/v1/verifications/:id
 * @desc    Get verification request by ID
 * @access  Private (CITIZENS_READ permission)
 */
router.get(
    '/:id',
    requirePermission(Permission.CITIZENS_READ),
    [
        ValidationRules.id('id'),
        validate
    ],
    asyncHandler(VerificationController.getById)
);

/**
 * @route   PATCH /api/v1/verifications/:id/assign
 * @desc    Assign verification request to officer
 * @access  Private (ADMIN or SUPER_ADMIN)
 */
router.patch(
    '/:id/assign',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    [
        ValidationRules.id('id'),
        body('officerId').trim().notEmpty().withMessage('Officer ID required'),
        validate
    ],
    asyncHandler(VerificationController.assign)
);

/**
 * @route   PATCH /api/v1/verifications/:id/status
 * @desc    Update verification status
 * @access  Private (ADMIN or SUPER_ADMIN)
 */
router.patch(
    '/:id/status',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    [
        ValidationRules.id('id'),
        body('status').isIn(['Pending', 'InProgress', 'Approved', 'Rejected']).withMessage('Valid status required'),
        body('verificationMethod').optional().isIn(['Physical', 'Document', 'Phone', 'BackgroundCheck']),
        body('verificationNotes').optional().trim(),
        body('rejectionReason').optional().trim(),
        validate
    ],
    asyncHandler(VerificationController.updateStatus)
);

export default router;
