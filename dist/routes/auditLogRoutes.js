"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auditLogController_1 = require("../controllers/auditLogController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// All audit log routes require authentication and AUDIT_LOGS permission
router.use(authenticate_1.authenticate);
router.use((0, authorize_1.requirePermission)(auth_1.Permission.AUDIT_LOGS));
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('userId').optional().isString(),
    (0, express_validator_1.query)('action').optional().isString(),
    (0, express_validator_1.query)('entityType').optional().isString(),
    (0, express_validator_1.query)('entityId').optional().isString(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('sortBy').optional().isString(),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
    validate_1.validate
], auditLogController_1.AuditLogController.getLogs);
router.get('/:id', [
    (0, express_validator_1.param)('id').notEmpty().withMessage('Audit log ID is required'),
    validate_1.validate
], auditLogController_1.AuditLogController.getById);
exports.default = router;
//# sourceMappingURL=auditLogRoutes.js.map