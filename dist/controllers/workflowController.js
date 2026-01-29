"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowStatus = exports.getPendingApprovals = exports.rejectWorkflowStep = exports.approveWorkflowStep = exports.startWorkflow = void 0;
const asyncHandler_1 = require("../middleware/asyncHandler");
const workflowEngine_1 = __importDefault(require("../services/workflowEngine"));
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
const workflowValidator_1 = require("../utils/workflowValidator");
// Start a workflow
exports.startWorkflow = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { type, entityId, entityType, metadata } = req.body;
    if (!type || !entityId || !entityType) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: type, entityId, entityType'
        });
    }
    const workflow = await workflowEngine_1.default.startWorkflow(type, entityId, entityType, req.user.id, metadata);
    return res.status(201).json({
        success: true,
        message: 'Workflow started successfully',
        data: { workflow }
    });
});
// Approve workflow step
exports.approveWorkflowStep = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workflowId, stepId, comments } = req.body;
    if (!workflowId || !stepId) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: workflowId, stepId'
        });
    }
    // VALIDATE WORKFLOW TRANSITION
    if (stepId === 'admin_approval') {
        const registration = await database_1.prisma.citizenRegistration.findUnique({
            where: { id: workflowId }
        });
        if (registration) {
            // Validate transition to APPROVED
            // Note: 'citizenId' is needed for the check.
            await (0, workflowValidator_1.validateWorkflowTransition)(registration.status, 'APPROVED', registration.citizenId);
        }
    }
    const result = await workflowEngine_1.default.approveStep(workflowId, stepId, req.user.id, comments);
    logger_1.logger.info('Workflow step approved', {
        workflowId,
        stepId,
        approverId: req.user.id
    });
    return res.status(200).json({
        success: true,
        message: 'Workflow step approved',
        data: result
    });
});
// Reject workflow step
exports.rejectWorkflowStep = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workflowId, stepId, reason } = req.body;
    if (!workflowId || !stepId || !reason) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: workflowId, stepId, reason'
        });
    }
    const result = await workflowEngine_1.default.rejectStep(workflowId, stepId, req.user.id, reason);
    logger_1.logger.info('Workflow step rejected', {
        workflowId,
        stepId,
        approverId: req.user.id,
        reason
    });
    return res.status(200).json({
        success: true,
        message: 'Workflow step rejected',
        data: result
    });
});
// Get pending approvals for current user
exports.getPendingApprovals = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const approvals = await workflowEngine_1.default.getPendingApprovals(req.user.id, req.user.role);
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
exports.getWorkflowStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workflowId } = req.params;
    // Try to find registration
    const registration = await database_1.prisma.citizenRegistration.findUnique({
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
    const verificationReq = registration.visitRequests.find((v) => v.visitType === 'Verification');
    if (verificationReq) {
        if (verificationReq.status === 'Completed') {
            steps[1].status = 'COMPLETED';
        }
        else if (verificationReq.status === 'Scheduled' || verificationReq.status === 'In Progress') {
            steps[1].status = 'IN_PROGRESS';
        }
    }
    // Check approval
    if (registration.status === 'APPROVED') {
        steps[1].status = 'COMPLETED'; // Implicitly done
        steps[2].status = 'COMPLETED';
    }
    else if (registration.status === 'REJECTED') {
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
//# sourceMappingURL=workflowController.js.map