/**
 * Workflow State Machines
 * Define valid state transitions for key workflows
 */
export declare enum VisitStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    RESCHEDULED = "RESCHEDULED"
}
export declare enum SOSStatus {
    Active = "Active",
    Responded = "Responded",
    Resolved = "Resolved",
    FalseAlarm = "FalseAlarm"
}
export declare enum VerificationStatus {
    Pending = "Pending",
    InProgress = "In Progress",
    Verified = "Verified",
    Rejected = "Rejected"
}
/**
 * Validate state transition
 */
export declare const isValidTransition: (workflow: "VISIT" | "SOS" | "VERIFICATION", currentState: string, newState: string) => boolean;
/**
 * Get allowed next states
 */
export declare const getAllowedTransitions: (workflow: "VISIT" | "SOS" | "VERIFICATION", currentState: string) => string[];
/**
 * State transition error
 */
export declare class InvalidStateTransitionError extends Error {
    constructor(workflow: string, from: string, to: string);
}
//# sourceMappingURL=stateMachine.d.ts.map