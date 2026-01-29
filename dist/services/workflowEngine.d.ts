export declare enum WorkflowType {
    CITIZEN_VERIFICATION = "CITIZEN_VERIFICATION",
    VISIT_APPROVAL = "VISIT_APPROVAL",
    SOS_ESCALATION = "SOS_ESCALATION",
    DOCUMENT_APPROVAL = "DOCUMENT_APPROVAL"
}
export declare enum WorkflowStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    ESCALATED = "ESCALATED"
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
declare class WorkflowEngine {
    private workflows;
    startWorkflow(type: WorkflowType, entityId: string, entityType: string, initiatedBy: string, metadata?: any): Promise<any>;
    approveStep(workflowId: string, stepId: string, approverId: string, _comments?: string): Promise<any>;
    rejectStep(workflowId: string, stepId: string, approverId: string, reason: string): Promise<any>;
    private checkAutoApprove;
    getPendingApprovals(userId: string, userRole: string): Promise<any[]>;
    checkEscalations(): Promise<void>;
}
export declare const workflowEngine: WorkflowEngine;
export default workflowEngine;
//# sourceMappingURL=workflowEngine.d.ts.map