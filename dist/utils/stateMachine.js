"use strict";
/**
 * Workflow State Machines
 * Define valid state transitions for key workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidStateTransitionError = exports.getAllowedTransitions = exports.isValidTransition = exports.VerificationStatus = exports.SOSStatus = exports.VisitStatus = void 0;
var VisitStatus;
(function (VisitStatus) {
    VisitStatus["SCHEDULED"] = "SCHEDULED";
    VisitStatus["IN_PROGRESS"] = "IN_PROGRESS";
    VisitStatus["COMPLETED"] = "COMPLETED";
    VisitStatus["CANCELLED"] = "CANCELLED";
    VisitStatus["RESCHEDULED"] = "RESCHEDULED";
})(VisitStatus || (exports.VisitStatus = VisitStatus = {}));
var SOSStatus;
(function (SOSStatus) {
    SOSStatus["Active"] = "Active";
    SOSStatus["Responded"] = "Responded";
    SOSStatus["Resolved"] = "Resolved";
    SOSStatus["FalseAlarm"] = "FalseAlarm";
})(SOSStatus || (exports.SOSStatus = SOSStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["Pending"] = "Pending";
    VerificationStatus["InProgress"] = "In Progress";
    VerificationStatus["Verified"] = "Verified";
    VerificationStatus["Rejected"] = "Rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
/**
 * State transition rules
 */
const VISIT_TRANSITIONS = {
    [VisitStatus.SCHEDULED]: [VisitStatus.IN_PROGRESS, VisitStatus.CANCELLED, VisitStatus.RESCHEDULED],
    [VisitStatus.IN_PROGRESS]: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
    [VisitStatus.COMPLETED]: [], // Terminal state
    [VisitStatus.CANCELLED]: [VisitStatus.RESCHEDULED], // Can reschedule after cancel
    [VisitStatus.RESCHEDULED]: [VisitStatus.SCHEDULED]
};
const SOS_TRANSITIONS = {
    [SOSStatus.Active]: [SOSStatus.Responded, SOSStatus.FalseAlarm],
    [SOSStatus.Responded]: [SOSStatus.Resolved],
    [SOSStatus.Resolved]: [], // Terminal state
    [SOSStatus.FalseAlarm]: [] // Terminal state
};
const VERIFICATION_TRANSITIONS = {
    [VerificationStatus.Pending]: [VerificationStatus.InProgress, VerificationStatus.Rejected],
    [VerificationStatus.InProgress]: [VerificationStatus.Verified, VerificationStatus.Rejected],
    [VerificationStatus.Verified]: [], // Terminal state
    [VerificationStatus.Rejected]: [VerificationStatus.Pending] // Can retry
};
/**
 * Validate state transition
 */
const isValidTransition = (workflow, currentState, newState) => {
    let transitions;
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
exports.isValidTransition = isValidTransition;
/**
 * Get allowed next states
 */
const getAllowedTransitions = (workflow, currentState) => {
    switch (workflow) {
        case 'VISIT':
            return VISIT_TRANSITIONS[currentState] || [];
        case 'SOS':
            return SOS_TRANSITIONS[currentState] || [];
        case 'VERIFICATION':
            return VERIFICATION_TRANSITIONS[currentState] || [];
        default:
            return [];
    }
};
exports.getAllowedTransitions = getAllowedTransitions;
/**
 * State transition error
 */
class InvalidStateTransitionError extends Error {
    constructor(workflow, from, to) {
        super(`Invalid ${workflow} transition: ${from} → ${to}`);
        this.name = 'InvalidStateTransitionError';
    }
}
exports.InvalidStateTransitionError = InvalidStateTransitionError;
//# sourceMappingURL=stateMachine.js.map