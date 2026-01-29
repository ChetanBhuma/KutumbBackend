"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const bulkOperationsController_1 = require("../controllers/bulkOperationsController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Configure multer for CSV upload
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});
// All bulk operations require authentication
router.use(authenticate_1.authenticate);
router.post('/import-citizens', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), upload.single('file'), bulkOperationsController_1.BulkOperationsController.importCitizens);
// Async/Queue-based import for large files
const asyncBulkController_1 = require("../controllers/asyncBulkController");
router.post('/import-citizens-async', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_WRITE), upload.single('file'), asyncBulkController_1.AsyncBulkController.queueCitizenImport);
router.get('/import-status', (0, authorize_1.requirePermission)(auth_1.Permission.CITIZENS_READ), asyncBulkController_1.AsyncBulkController.getImportStatus);
router.post('/assign-officers', (0, authorize_1.requirePermission)(auth_1.Permission.OFFICERS_MANAGE), [
    (0, express_validator_1.body)('beatId').notEmpty().withMessage('Beat ID is required'),
    (0, express_validator_1.body)('officerId').notEmpty().withMessage('Officer ID is required'),
    (0, express_validator_1.body)('citizenIds').isArray({ min: 1 }).withMessage('At least one citizen ID is required'),
    validate_1.validate
], bulkOperationsController_1.BulkOperationsController.bulkAssignOfficer);
router.get('/import-template', bulkOperationsController_1.BulkOperationsController.downloadTemplate);
exports.default = router;
//# sourceMappingURL=bulkOperationsRoutes.js.map