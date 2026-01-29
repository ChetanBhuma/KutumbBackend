export type EntityType = 'CITIZEN' | 'CITIZEN_VERIFICATION' | 'VISIT' | 'SOS';

export const WORKFLOW_STATES = {
    CITIZEN: {
        PENDING: 'Pending',
        VERIFIED: 'Verified',
        INACTIVE: 'Inactive',
        DECEASED: 'Deceased'
    },
    CITIZEN_VERIFICATION: {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        REJECTED: 'Rejected'
    },
    VISIT: {
        SCHEDULED: 'SCHEDULED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED'
    },
    SOS: {
        ACTIVE: 'Active',
        RESPONDED: 'Responded',
        RESOLVED: 'Resolved',
        FALSE_ALARM: 'False Alarm'
    }
};

const ALLOWED_TRANSITIONS: Record<EntityType, Record<string, string[]>> = {
    CITIZEN: {
        [WORKFLOW_STATES.CITIZEN.PENDING]: [WORKFLOW_STATES.CITIZEN.VERIFIED, WORKFLOW_STATES.CITIZEN.INACTIVE], // Can go to Inactive if rejected?
        [WORKFLOW_STATES.CITIZEN.VERIFIED]: [WORKFLOW_STATES.CITIZEN.INACTIVE, WORKFLOW_STATES.CITIZEN.DECEASED],
        [WORKFLOW_STATES.CITIZEN.INACTIVE]: [WORKFLOW_STATES.CITIZEN.VERIFIED, WORKFLOW_STATES.CITIZEN.DECEASED],
        [WORKFLOW_STATES.CITIZEN.DECEASED]: []
    },
    CITIZEN_VERIFICATION: {
        [WORKFLOW_STATES.CITIZEN_VERIFICATION.PENDING]: [WORKFLOW_STATES.CITIZEN_VERIFICATION.APPROVED, WORKFLOW_STATES.CITIZEN_VERIFICATION.REJECTED],
        [WORKFLOW_STATES.CITIZEN_VERIFICATION.APPROVED]: [WORKFLOW_STATES.CITIZEN_VERIFICATION.REJECTED], // Can be revoked?
        [WORKFLOW_STATES.CITIZEN_VERIFICATION.REJECTED]: [WORKFLOW_STATES.CITIZEN_VERIFICATION.PENDING, WORKFLOW_STATES.CITIZEN_VERIFICATION.APPROVED] // Re-verify
    },
    VISIT: {
        [WORKFLOW_STATES.VISIT.SCHEDULED]: [WORKFLOW_STATES.VISIT.IN_PROGRESS, WORKFLOW_STATES.VISIT.CANCELLED, WORKFLOW_STATES.VISIT.COMPLETED], // Allow direct completion for manual entry
        [WORKFLOW_STATES.VISIT.IN_PROGRESS]: [WORKFLOW_STATES.VISIT.COMPLETED, WORKFLOW_STATES.VISIT.CANCELLED],
        [WORKFLOW_STATES.VISIT.COMPLETED]: [],
        [WORKFLOW_STATES.VISIT.CANCELLED]: [WORKFLOW_STATES.VISIT.SCHEDULED]
    },
    SOS: {
        [WORKFLOW_STATES.SOS.ACTIVE]: [WORKFLOW_STATES.SOS.RESPONDED, WORKFLOW_STATES.SOS.FALSE_ALARM, WORKFLOW_STATES.SOS.RESOLVED], // Allow direct resolve
        [WORKFLOW_STATES.SOS.RESPONDED]: [WORKFLOW_STATES.SOS.RESOLVED, WORKFLOW_STATES.SOS.FALSE_ALARM],
        [WORKFLOW_STATES.SOS.RESOLVED]: [],
        [WORKFLOW_STATES.SOS.FALSE_ALARM]: []
    }
};

export class WorkflowError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkflowError';
    }
}

export const validateTransition = (entity: EntityType, currentStatus: string, newStatus: string): void => {
    // If status isn't changing, it's valid
    if (currentStatus === newStatus) return;

    const allowed = ALLOWED_TRANSITIONS[entity][currentStatus];

    if (!allowed) {
        // If current status is unknown/invalid, strictly maybe we should allow fixing it? 
        // For now, let's assume strict validation.
        throw new WorkflowError(`Invalid current status '${currentStatus}' for ${entity}`);
    }

    if (!allowed.includes(newStatus)) {
        throw new WorkflowError(
            `Invalid state transition for ${entity}: '${currentStatus}' -> '${newStatus}'. Allowed: ${allowed.join(', ')}`
        );
    }
};
