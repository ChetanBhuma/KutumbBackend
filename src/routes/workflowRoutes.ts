import express from 'express';
import {
    startWorkflow,
    approveWorkflowStep,
    rejectWorkflowStep,
    getPendingApprovals,
    getWorkflowStatus
} from '../controllers/workflowController';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Start a new workflow
router.post('/start', startWorkflow);

// Approve workflow step
router.post('/approve', approveWorkflowStep);

// Reject workflow step
router.post('/reject', rejectWorkflowStep);

// Get pending approvals for current user
router.get('/pending', getPendingApprovals);

// Get workflow status
router.get('/:workflowId/status', getWorkflowStatus);

export default router;
