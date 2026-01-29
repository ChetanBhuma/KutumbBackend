"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTransition = exports.WorkflowError = exports.WORKFLOW_STATES = void 0;
exports.WORKFLOW_STATES = {
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
const ALLOWED_TRANSITIONS = {
    CITIZEN: {
        [exports.WORKFLOW_STATES.CITIZEN.PENDING]: [exports.WORKFLOW_STATES.CITIZEN.VERIFIED, exports.WORKFLOW_STATES.CITIZEN.INACTIVE], // Can go to Inactive if rejected?
        [exports.WORKFLOW_STATES.CITIZEN.VERIFIED]: [exports.WORKFLOW_STATES.CITIZEN.INACTIVE, exports.WORKFLOW_STATES.CITIZEN.DECEASED],
        [exports.WORKFLOW_STATES.CITIZEN.INACTIVE]: [exports.WORKFLOW_STATES.CITIZEN.VERIFIED, exports.WORKFLOW_STATES.CITIZEN.DECEASED],
        [exports.WORKFLOW_STATES.CITIZEN.DECEASED]: []
    },
    CITIZEN_VERIFICATION: {
        [exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.PENDING]: [exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.APPROVED, exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.REJECTED],
        [exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.APPROVED]: [exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.REJECTED], // Can be revoked?
        [exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.REJECTED]: [exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.PENDING, exports.WORKFLOW_STATES.CITIZEN_VERIFICATION.APPROVED] // Re-verify
    },
    VISIT: {
        [exports.WORKFLOW_STATES.VISIT.SCHEDULED]: [exports.WORKFLOW_STATES.VISIT.IN_PROGRESS, exports.WORKFLOW_STATES.VISIT.CANCELLED, exports.WORKFLOW_STATES.VISIT.COMPLETED], // Allow direct completion for manual entry
        [exports.WORKFLOW_STATES.VISIT.IN_PROGRESS]: [exports.WORKFLOW_STATES.VISIT.COMPLETED, exports.WORKFLOW_STATES.VISIT.CANCELLED],
        [exports.WORKFLOW_STATES.VISIT.COMPLETED]: [],
        [exports.WORKFLOW_STATES.VISIT.CANCELLED]: [exports.WORKFLOW_STATES.VISIT.SCHEDULED]
    },
    SOS: {
        [exports.WORKFLOW_STATES.SOS.ACTIVE]: [exports.WORKFLOW_STATES.SOS.RESPONDED, exports.WORKFLOW_STATES.SOS.FALSE_ALARM, exports.WORKFLOW_STATES.SOS.RESOLVED], // Allow direct resolve
        [exports.WORKFLOW_STATES.SOS.RESPONDED]: [exports.WORKFLOW_STATES.SOS.RESOLVED, exports.WORKFLOW_STATES.SOS.FALSE_ALARM],
        [exports.WORKFLOW_STATES.SOS.RESOLVED]: [],
        [exports.WORKFLOW_STATES.SOS.FALSE_ALARM]: []
    }
};
class WorkflowError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WorkflowError';
    }
}
exports.WorkflowError = WorkflowError;
const validateTransition = (entity, currentStatus, newStatus) => {
    // If status isn't changing, it's valid
    if (currentStatus === newStatus)
        return;
    const allowed = ALLOWED_TRANSITIONS[entity][currentStatus];
    if (!allowed) {
        // If current status is unknown/invalid, strictly maybe we should allow fixing it? 
        // For now, let's assume strict validation.
        throw new WorkflowError(`Invalid current status '${currentStatus}' for ${entity}`);
    }
    if (!allowed.includes(newStatus)) {
        throw new WorkflowError(`Invalid state transition for ${entity}: '${currentStatus}' -> '${newStatus}'. Allowed: ${allowed.join(', ')}`);
    }
};
exports.validateTransition = validateTransition;
//# sourceMappingURL=workflowValidation.js.map