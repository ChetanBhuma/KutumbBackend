import express from 'express';
import { LeaveController } from '../controllers/leaveController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

const router = express.Router();

router.use(authenticate);

// Create leave request
router.post('/', LeaveController.create);

// Get all leave requests
router.get('/', LeaveController.list);

// Get statistics
router.get('/stats', LeaveController.getStats);

// Get officer's leaves
router.get('/officer/:officerId', LeaveController.getOfficerLeaves);

// Get specific leave
router.get('/:id', LeaveController.getById);

// Approve leave (admin/supervisor only)
router.patch('/:id/approve', requireRole([Role.ADMIN, Role.SUPERVISOR, Role.SUPER_ADMIN]), LeaveController.approve);

// Reject leave (admin/supervisor only)
router.patch('/:id/reject', requireRole([Role.ADMIN, Role.SUPERVISOR, Role.SUPER_ADMIN]), LeaveController.reject);

// Cancel leave
router.patch('/:id/cancel', LeaveController.cancel);

export default router;
