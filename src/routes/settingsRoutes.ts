import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

router.get('/', SettingsController.getSettings);
router.put('/:key', SettingsController.updateSetting);

export default router;
