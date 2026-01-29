import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { auditCRUD } from '../middleware/auditMiddleware';
import {
    listDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation
} from '../controllers/designationController';

const router = Router();

router.use(authenticate);
// Designations can be viewed by more roles, but managed only by Admins
router.get('/', asyncHandler(listDesignations));

router.use(requireRole([Role.SUPER_ADMIN, Role.ADMIN]));
router.post('/', auditCRUD.create('designation'), asyncHandler(createDesignation));
router.patch('/:id', auditCRUD.update('designation'), asyncHandler(updateDesignation));
router.delete('/:id', auditCRUD.delete('designation'), asyncHandler(deleteDesignation));

export default router;
