/**
 * Workflow State Machines
 * Define valid state transitions for key workflows
 */

export enum VisitStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    RESCHEDULED = 'RESCHEDULED'
}

export enum SOSStatus {
    Active = 'Active',
    Responded = 'Responded',
    Resolved = 'Resolved',
    FalseAlarm = 'FalseAlarm'
}

export enum VerificationStatus {
    Pending = 'Pending',
    InProgress = 'In Progress',
    Verified = 'Verified',
    Rejected = 'Rejected'
}

/**
 * State transition rules
 */
const VISIT_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
    [VisitStatus.SCHEDULED]: [VisitStatus.IN_PROGRESS, VisitStatus.CANCELLED, VisitStatus.RESCHEDULED],
    [VisitStatus.IN_PROGRESS]: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
    [VisitStatus.COMPLETED]: [], // Terminal state
    [VisitStatus.CANCELLED]: [VisitStatus.RESCHEDULED], // Can reschedule after cancel
    [VisitStatus.RESCHEDULED]: [VisitStatus.SCHEDULED]
};

const SOS_TRANSITIONS: Record<SOSStatus, SOSStatus[]> = {
    [SOSStatus.Active]: [SOSStatus.Responded, SOSStatus.FalseAlarm],
    [SOSStatus.Responded]: [SOSStatus.Resolved],
    [SOSStatus.Resolved]: [], // Terminal state
    [SOSStatus.FalseAlarm]: [] // Terminal state
};

const VERIFICATION_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
    [VerificationStatus.Pending]: [VerificationStatus.InProgress, VerificationStatus.Rejected],
    [VerificationStatus.InProgress]: [VerificationStatus.Verified, VerificationStatus.Rejected],
    [VerificationStatus.Verified]: [], // Terminal state
    [VerificationStatus.Rejected]: [VerificationStatus.Pending] // Can retry
};

/**
 * Validate state transition
 */
export const isValidTransition = (
    workflow: 'VISIT' | 'SOS' | 'VERIFICATION',
    currentState: string,
    newState: string
): boolean => {
    let transitions: Record<string, string[]>;

    switch (workflow) {
        case 'VISIT':
            transitions = VISIT_TRANSITIONS;
            break;
        case 'SOS':
            transitions = SOS_TRANSITIONS;
            break;
        case 'VERIFICATION':
            transitions = VERIFICATION_TRANSITIONS;
            break;
        default:
            return false;
    }

    return transitions[currentState]?.includes(newState) || false;
};

/**
 * Get allowed next states
 */
export const getAllowedTransitions = (
    workflow: 'VISIT' | 'SOS' | 'VERIFICATION',
    currentState: string
): string[] => {
    switch (workflow) {
        case 'VISIT':
            return VISIT_TRANSITIONS[currentState as VisitStatus] || [];
        case 'SOS':
            return SOS_TRANSITIONS[currentState as SOSStatus] || [];
        case 'VERIFICATION':
            return VERIFICATION_TRANSITIONS[currentState as VerificationStatus] || [];
        default:
            return [];
    }
};

/**
 * State transition error
 */
export class InvalidStateTransitionError extends Error {
    constructor(workflow: string, from: string, to: string) {
        super(`Invalid ${workflow} transition: ${from} → ${to}`);
        this.name = 'InvalidStateTransitionError';
    }
}
