import express from 'express';
import { ServiceRequestController } from '../controllers/serviceRequestController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

const router = express.Router();

router.use(authenticate);

// Create service request
router.post('/', ServiceRequestController.create);

// List all service requests with filters
router.get('/', ServiceRequestController.list);

// Get statistics
router.get('/stats', ServiceRequestController.getStats);

// Get specific service request
router.get('/:id', ServiceRequestController.getById);

// Update service request status
router.patch('/:id/status', requireRole([Role.ADMIN, Role.OFFICER, Role.SUPERVISOR]), ServiceRequestController.updateStatus);

// Assign request to officer
router.patch('/:id/assign', requireRole([Role.ADMIN, Role.SUPERVISOR]), ServiceRequestController.assign);

// Delete service request (admin only)
router.delete('/:id', requireRole([Role.SUPER_ADMIN, Role.ADMIN]), ServiceRequestController.delete);

export default router;
