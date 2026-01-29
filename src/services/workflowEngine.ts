// Workflow Engine - Manages approval processes and automated workflows
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { VisitStatus } from '@prisma/client';

export enum WorkflowType {
    CITIZEN_VERIFICATION = 'CITIZEN_VERIFICATION',
    VISIT_APPROVAL = 'VISIT_APPROVAL',
    SOS_ESCALATION = 'SOS_ESCALATION',
    DOCUMENT_APPROVAL = 'DOCUMENT_APPROVAL',
}

export enum WorkflowStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ESCALATED = 'ESCALATED',
}

export interface WorkflowConfig {
    type: WorkflowType;
    steps: WorkflowStep[];
    escalationRules?: EscalationRule[];
    autoApproveConditions?: AutoApproveCondition[];
}

export interface WorkflowStep {
    id: string;
    name: string;
    approverRole: string[];
    timeoutHours?: number;
    required: boolean;
    order: number;
}

export interface EscalationRule {
    condition: string;
    escalateTo: string[];
    afterHours: number;
}

export interface AutoApproveCondition {
    field: string;
    operator: 'equals' | 'greaterThan' | 'lessThan';
    value: any;
}

class WorkflowEngine {
    // Define workflow configurations
    private workflows: Map<WorkflowType, WorkflowConfig> = new Map([
        [
            WorkflowType.CITIZEN_VERIFICATION,
            {
                type: WorkflowType.CITIZEN_VERIFICATION,
                steps: [
                    {
                        id: 'document_verification',
                        name: 'Document Verification',
                        approverRole: ['OFFICER', 'ADMIN'],
                        timeoutHours: 24,
                        required: true,
                        order: 1,
                    },
                    {
                        id: 'background_check',
                        name: 'Background Check',
                        approverRole: ['ADMIN', 'SUPER_ADMIN'],
                        timeoutHours: 48,
                        required: true,
                        order: 2,
                    },
                    {
                        id: 'final_approval',
                        name: 'Final Approval',
                        approverRole: ['SUPER_ADMIN'],
                        timeoutHours: 24,
                        required: true,
                        order: 3,
                    },
                ],
                escalationRules: [
                    {
                        condition: 'timeout',
                        escalateTo: ['SUPER_ADMIN'],
                        afterHours: 72,
                    },
                ],
                autoApproveConditions: [
                    {
                        field: 'age',
                        operator: 'greaterThan',
                        value: 80,
                    },
                ],
            },
        ],
        [
            WorkflowType.SOS_ESCALATION,
            {
                type: WorkflowType.SOS_ESCALATION,
                steps: [
                    {
                        id: 'immediate_response',
                        name: 'Immediate Response',
                        approverRole: ['OFFICER'],
                        timeoutHours: 0.25, // 15 minutes
                        required: true,
                        order: 1,
                    },
                    {
                        id: 'supervisor_review',
                        name: 'Supervisor Review',
                        approverRole: ['ADMIN'],
                        timeoutHours: 1,
                        required: false,
                        order: 2,
                    },
                ],
                escalationRules: [
                    {
                        condition: 'no_response',
                        escalateTo: ['ADMIN', 'SUPER_ADMIN'],
                        afterHours: 0.25,
                    },
                ],
            },
        ],
    ]);

    // Start a new workflow
    async startWorkflow(
        type: WorkflowType,
        entityId: string,
        entityType: string,
        initiatedBy: string,
        metadata?: any
    ): Promise<any> {
        try {
            const config = this.workflows.get(type);
            if (!config) {
                throw new Error(`Workflow type ${type} not configured`);
            }

            // Check auto-approve conditions
            if (config.autoApproveConditions && await this.checkAutoApprove(config.autoApproveConditions, metadata)) {
                logger.info('Workflow auto-approved', { type, entityId });
                return {
                    id: 'auto-approved',
                    status: WorkflowStatus.APPROVED,
                    autoApproved: true,
                };
            }

            // Create workflow instance (in production, save to database)
            const workflow = {
                id: `wf_${Date.now()}`,
                type,
                entityId,
                entityType,
                status: WorkflowStatus.PENDING,
                currentStep: 0,
                steps: config.steps,
                initiatedBy,
                initiatedAt: new Date(),
                metadata,
            };

            logger.info('Workflow started', { workflowId: workflow.id, type, entityId });

            return workflow;
        } catch (error: any) {
            logger.error('Workflow start failed', { error: error.message, type, entityId });
            throw error;
        }
    }

    // Approve a workflow step
    async approveStep(
        workflowId: string,
        stepId: string,
        approverId: string,
        _comments?: string
    ): Promise<any> {
        try {
            // In production, fetch workflow from database
            logger.info('Workflow step approved', { workflowId, stepId, approverId });

            return {
                success: true,
                message: 'Step approved',
                nextStep: 'background_check', // Next step in workflow
            };
        } catch (error: any) {
            logger.error('Workflow approval failed', { error: error.message, workflowId });
            throw error;
        }
    }

    // Reject a workflow step
    async rejectStep(
        workflowId: string,
        stepId: string,
        approverId: string,
        reason: string
    ): Promise<any> {
        try {
            logger.info('Workflow step rejected', { workflowId, stepId, approverId, reason });

            return {
                success: true,
                status: WorkflowStatus.REJECTED,
                reason,
            };
        } catch (error: any) {
            logger.error('Workflow rejection failed', { error: error.message, workflowId });
            throw error;
        }
    }

    // Check auto-approve conditions
    private async checkAutoApprove(conditions: AutoApproveCondition[], metadata: any): Promise<boolean> {
        for (const condition of conditions) {
            const value = metadata[condition.field];

            switch (condition.operator) {
                case 'equals':
                    if (value !== condition.value) return false;
                    break;
                case 'greaterThan':
                    if (value <= condition.value) return false;
                    break;
                case 'lessThan':
                    if (value >= condition.value) return false;
                    break;
            }
        }
        return true;
    }

    // Get pending approvals for a user
    async getPendingApprovals(userId: string, userRole: string): Promise<any[]> {
        try {
            const approvals = [];

            // 1. For Officers: Pending Verification Visits
            if (userRole === 'OFFICER') {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { officerProfile: true }
                });

                if (user?.officerProfile) {
                    const visits = await prisma.visit.findMany({
                        where: {
                            officerId: user.officerProfile.id,
                            visitType: 'Verification',
                            status: { in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS] }
                        },
                        include: { SeniorCitizen: true }
                    });

                    approvals.push(...visits.map(v => ({
                        id: v.id,
                        type: WorkflowType.CITIZEN_VERIFICATION,
                        entityId: v.seniorCitizenId,
                        currentStep: 'verification_visit',
                        initiatedAt: v.createdAt,
                        metadata: {
                            citizenName: (v as any).SeniorCitizen?.fullName,
                            address: (v as any).SeniorCitizen?.permanentAddress,
                            visitId: v.id
                        }
                    })));
                }
            }

            // 2. For Admins: Pending Registration Reviews
            if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
                const registrations = await prisma.citizenRegistration.findMany({
                    where: { status: 'PENDING_REVIEW' },
                    include: { citizen: true }
                });

                approvals.push(...registrations.map(r => ({
                    id: r.id,
                    type: WorkflowType.CITIZEN_VERIFICATION,
                    entityId: r.id,
                    currentStep: 'admin_approval',
                    initiatedAt: r.createdAt,
                    metadata: {
                        citizenName: r.citizen?.fullName || r.fullName,
                        mobileNumber: r.mobileNumber,
                        verificationStatus: r.citizen?.idVerificationStatus
                    }
                })));
            }

            return approvals;
        } catch (error: any) {
            logger.error('Error fetching approvals', { error: error.message });
            return [];
        }
    }

    // Check and escalate overdue workflows
    async checkEscalations(): Promise<void> {
        try {
            logger.info('Checking workflow escalations');

            // In production:
            // 1. Query workflows past timeout
            // 2. Apply escalation rules
            // 3. Notify escalation recipients
            // 4. Update workflow status
        } catch (error: any) {
            logger.error('Escalation check failed', { error: error.message });
        }
    }
}

export const workflowEngine = new WorkflowEngine();
export default workflowEngine;
