import express from 'express';
import { ExportController } from '../controllers/exportController';
import { authenticate } from '../middleware/authenticate';
import { requireRole, requirePermission } from '../middleware/authorize';
import { Role, Permission } from '../types/auth';

const router = express.Router();

// Protect all export routes
router.use(authenticate);

// Export Citizens (CSV) - Requires REPORTS_EXPORT permission
router.get(
    '/citizens',
    requirePermission(Permission.REPORTS_EXPORT),
    ExportController.exportCitizens
);

// Export Visits (Excel) - Requires REPORTS_EXPORT permission
router.get(
    '/visits',
    requirePermission(Permission.REPORTS_EXPORT),
    ExportController.exportVisits
);

// Generate Report (PDF) - Admin, Super Admin
router.get(
    '/reports',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permission.REPORTS_EXPORT),
    ExportController.generateReport
);

export default router;
