import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';
import { getHierarchyTree } from '../controllers/hierarchyController';

const router = Router();

// Public or Authenticated? 
// Usually hierarchy is for Admin/Config, so Authenticated.
// But if used by public map visualization, might need to be public.
// Following `userRoutes.ts` open state, let's keep it authenticated for now.
router.use(authenticate);

router.get('/', asyncHandler(getHierarchyTree));

export default router;
