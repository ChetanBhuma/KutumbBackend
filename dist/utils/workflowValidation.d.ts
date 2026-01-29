export type EntityType = 'CITIZEN' | 'CITIZEN_VERIFICATION' | 'VISIT' | 'SOS';
export declare const WORKFLOW_STATES: {
    CITIZEN: {
        PENDING: string;
        VERIFIED: string;
        INACTIVE: string;
        DECEASED: string;
    };
    CITIZEN_VERIFICATION: {
        PENDING: string;
        APPROVED: string;
        REJECTED: string;
    };
    VISIT: {
        SCHEDULED: string;
        IN_PROGRESS: string;
        COMPLETED: string;
        CANCELLED: string;
    };
    SOS: {
        ACTIVE: string;
        RESPONDED: string;
        RESOLVED: string;
        FALSE_ALARM: string;
    };
};
export declare class WorkflowError extends Error {
    constructor(message: string);
}
export declare const validateTransition: (entity: EntityType, currentStatus: string, newStatus: string) => void;
//# sourceMappingURL=workflowValidation.d.ts.map