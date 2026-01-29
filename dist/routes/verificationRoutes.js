"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verificationController_1 = require("../controllers/verificationController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../middleware/validation");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authenticate_1.authenticate);
/**
 * @route   POST /api/v1/verifications
 * @desc    Create verification request
 * @access  Private (CITIZENS_WRITE permission)
 */
router.post('/', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), [
    (0, express_validator_1.body)('entityType').isIn(['HouseholdHelp', 'EmergencyContact', 'Tenant', 'Other']).withMessage('Valid entity type required'),
    (0, express_validator_1.body)('entityId').trim().notEmpty().withMessage('Entity ID required'),
    (0, express_validator_1.body)('seniorCitizenId').trim().notEmpty().withMessage('Citizen ID required'),
    (0, express_validator_1.body)('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']),
    (0, express_validator_1.body)('remarks').optional().trim(),
    (0, express_validator_1.body)('documents').optional().isArray(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(verificationController_1.VerificationController.createRequest));
/**
 * @route   GET /api/v1/verifications
 * @desc    Get all verification requests
 * @access  Private (CITIZENS_READ permission)
 */
router.get('/', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    (0, express_validator_1.query)('status').optional().isIn(['Pending', 'InProgress', 'Approved', 'Rejected']),
    (0, express_validator_1.query)('entityType').optional().isIn(['HouseholdHelp', 'EmergencyContact', 'Tenant', 'Other']),
    (0, express_validator_1.query)('assignedTo').optional().trim(),
    (0, express_validator_1.query)('seniorCitizenId').optional().trim(),
    (0, express_validator_1.query)('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(verificationController_1.VerificationController.list));
/**
 * @route   GET /api/v1/verifications/statistics
 * @desc    Get verification statistics
 * @access  Private (CITIZENS_READ permission)
 */
router.get('/statistics', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    (0, express_validator_1.query)('entityType').optional().isIn(['HouseholdHelp', 'EmergencyContact', 'Tenant', 'Other']),
    (0, express_validator_1.query)('assignedTo').optional().trim(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(verificationController_1.VerificationController.getStatistics));
/**
 * @route   GET /api/v1/verifications/:id
 * @desc    Get verification request by ID
 * @access  Private (CITIZENS_READ permission)
 */
router.get('/:id', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), [
    validation_1.ValidationRules.id('id'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(verificationController_1.VerificationController.getById));
/**
 * @route   PATCH /api/v1/verifications/:id/assign
 * @desc    Assign verification request to officer
 * @access  Private (ADMIN or SUPER_ADMIN)
 */
router.patch('/:id/assign', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('officerId').trim().notEmpty().withMessage('Officer ID required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(verificationController_1.VerificationController.assign));
/**
 * @route   PATCH /api/v1/verifications/:id/status
 * @desc    Update verification status
 * @access  Private (ADMIN or SUPER_ADMIN)
 */
router.patch('/:id/status', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]), [
    validation_1.ValidationRules.id('id'),
    (0, express_validator_1.body)('status').isIn(['Pending', 'InProgress', 'Approved', 'Rejected']).withMessage('Valid status required'),
    (0, express_validator_1.body)('verificationMethod').optional().isIn(['Physical', 'Document', 'Phone', 'BackgroundCheck']),
    (0, express_validator_1.body)('verificationNotes').optional().trim(),
    (0, express_validator_1.body)('rejectionReason').optional().trim(),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(verificationController_1.VerificationController.updateStatus));
exports.default = router;
//# sourceMappingURL=verificationRoutes.js.map