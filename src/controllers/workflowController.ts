import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import workflowEngine, { WorkflowType } from '../services/workflowEngine';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { validateWorkflowTransition } from '../utils/workflowValidator';

// Start a workflow
export const startWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const { type, entityId, entityType, metadata } = req.body;

    if (!type || !entityId || !entityType) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: type, entityId, entityType'
        });
    }

    const workflow = await workflowEngine.startWorkflow(
        type as WorkflowType,
        entityId,
        entityType,
        req.user!.id,
        metadata
    );

    return res.status(201).json({
        success: true,
        message: 'Workflow started successfully',
        data: { workflow }
    });
});

// Approve workflow step
export const approveWorkflowStep = asyncHandler(async (req: Request, res: Response) => {
    const { workflowId, stepId, comments } = req.body;

    if (!workflowId || !stepId) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: workflowId, stepId'
        });
    }

    // VALIDATE WORKFLOW TRANSITION
    if (stepId === 'admin_approval') {
        const registration = await prisma.citizenRegistration.findUnique({
             where: { id: workflowId }
        });

        if (registration) {
             // Validate transition to APPROVED
             // Note: 'citizenId' is needed for the check.
             await validateWorkflowTransition(registration.status, 'APPROVED', registration.citizenId);
        }
    }

    const result = await workflowEngine.approveStep(
        workflowId,
        stepId,
        req.user!.id,
        comments
    );

    logger.info('Workflow step approved', {
        workflowId,
        stepId,
        approverId: req.user!.id
    });

    return res.status(200).json({
        success: true,
        message: 'Workflow step approved',
        data: result
    });
});

// Reject workflow step
export const rejectWorkflowStep = asyncHandler(async (req: Request, res: Response) => {
    const { workflowId, stepId, reason } = req.body;

    if (!workflowId || !stepId || !reason) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: workflowId, stepId, reason'
        });
    }

    const result = await workflowEngine.rejectStep(
        workflowId,
        stepId,
        req.user!.id,
        reason
    );

    logger.info('Workflow step rejected', {
        workflowId,
        stepId,
        approverId: req.user!.id,
        reason
    });

    return res.status(200).json({
        success: true,
        message: 'Workflow step rejected',
        data: result
    });
});

// Get pending approvals for current user
export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
    const approvals = await workflowEngine.getPendingApprovals(
        req.user!.id,
        req.user!.role
    );

    res.status(200).json({
        success: true,
        data: {
            count: approvals.length,
            approvals
        }
    });
});

// Get workflow status
// Get workflow status
export const getWorkflowStatus = asyncHandler(async (req: Request, res: Response) => {
    const { workflowId } = req.params;

    // Try to find registration
    const registration = await prisma.citizenRegistration.findUnique({
        where: { id: workflowId },
        include: { citizen: true, visitRequests: true }
    });

    if (!registration) {
        return res.status(404).json({ success: false, message: 'Workflow/Registration not found' });
    }

    // Determine steps status
    const steps = [
        {
            id: 'registration_submission',
            name: 'Registration Submission',
            status: 'COMPLETED',
            assignee: 'Citizen'
        },
        {
            id: 'verification_visit',
            name: 'Verification Visit',
            status: 'PENDING',
            assignee: 'Officer'
        },
        {
            id: 'admin_approval',
            name: 'Admin Approval',
            status: 'PENDING',
            assignee: 'Admin'
        }
    ];

    // Check verification visit
    const verificationReq = registration.visitRequests.find((v: any) => v.visitType === 'Verification');
    if (verificationReq) {
        if ((verificationReq.status as string) === 'Completed') {
            steps[1].status = 'COMPLETED';
        } else if ((verificationReq.status as string) === 'Scheduled' || (verificationReq.status as string) === 'In Progress') {
            steps[1].status = 'IN_PROGRESS';
        }
    }

    // Check approval
    if (registration.status === 'APPROVED') {
        steps[1].status = 'COMPLETED'; // Implicitly done
        steps[2].status = 'COMPLETED';
    } else if (registration.status === 'REJECTED') {
        steps[2].status = 'REJECTED';
    }

    return res.status(200).json({
        success: true,
        data: {
            workflow: {
                id: workflowId,
                status: registration.status,
                currentStep: registration.status === 'APPROVED' ? 'completed' : (steps[1].status === 'COMPLETED' ? 'admin_approval' : 'verification_visit'),
                steps
            }
        }
    });
});
