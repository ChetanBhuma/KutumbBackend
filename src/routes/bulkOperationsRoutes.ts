import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { BulkOperationsController } from '../controllers/bulkOperationsController';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { Permission } from '../types/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Configure multer for CSV upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// All bulk operations require authentication
router.use(authenticate);

router.post(
    '/import-citizens',
    requirePermission(Permission.CITIZENS_WRITE),
    upload.single('file'),
    BulkOperationsController.importCitizens
);

// Async/Queue-based import for large files
import { AsyncBulkController } from '../controllers/asyncBulkController';

router.post(
    '/import-citizens-async',
    requirePermission(Permission.CITIZENS_WRITE),
    upload.single('file'),
    AsyncBulkController.queueCitizenImport
);

router.get(
    '/import-status',
    requirePermission(Permission.CITIZENS_READ),
    AsyncBulkController.getImportStatus
);

router.post(
    '/assign-officers',
    requirePermission(Permission.OFFICERS_MANAGE),
    [
        body('beatId').notEmpty().withMessage('Beat ID is required'),
        body('officerId').notEmpty().withMessage('Officer ID is required'),
        body('citizenIds').isArray({ min: 1 }).withMessage('At least one citizen ID is required'),
        validate
    ],
    BulkOperationsController.bulkAssignOfficer
);

router.get(
    '/import-template',
    BulkOperationsController.downloadTemplate
);

export default router;
