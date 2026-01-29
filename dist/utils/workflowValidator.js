"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkflowTransition = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const database_1 = require("../config/database");
const VALID_TRANSITIONS = {
    'IN_PROGRESS': ['PENDING_REVIEW'],
    'PENDING_REVIEW': ['APPROVED', 'REJECTED'],
    'APPROVED': ['CARD_ISSUED'],
    'REJECTED': ['PENDING_REVIEW', 'IN_PROGRESS'], // Allow going back to IN_PROGRESS if they need to edit invalid data
    'CARD_ISSUED': [] // Terminal state
};
/**
 * Validates if a status transition is allowed based on the strict state machine.
 * Also performs async checks for database constraints (e.g. Verification Visit required).
 */
const validateWorkflowTransition = async (currentStatus, newStatus, citizenId) => {
    // 1. Normalize and basic validation
    const normalizedCurrent = currentStatus.toUpperCase();
    const normalizedNew = newStatus.toUpperCase();
    if (normalizedCurrent === normalizedNew)
        return; // No change allowed without error? Or just return? Usually idempotent is fine.
    const allowed = VALID_TRANSITIONS[normalizedCurrent];
    if (!allowed || !allowed.includes(normalizedNew)) {
        throw new errorHandler_1.AppError(`Invalid status transition from ${normalizedCurrent} to ${normalizedNew}. Allowed: ${allowed?.join(', ') || 'None'}`, 400);
    }
    // 2. Strict Constraint: PENDING_REVIEW -> APPROVED
    if (normalizedCurrent === 'PENDING_REVIEW' && normalizedNew === 'APPROVED') {
        if (!citizenId) {
            throw new errorHandler_1.AppError('Cannot approve registration without a linked Citizen ID.', 400);
        }
        // Check for COMPLETED Verification Visit
        const completedVerification = await database_1.prisma.visit.findFirst({
            where: {
                seniorCitizenId: citizenId,
                visitType: { equals: 'Verification', mode: 'insensitive' },
                status: 'COMPLETED'
            }
        });
        if (!completedVerification) {
            throw new errorHandler_1.AppError('Approval denied: A completed Verification Visit by an officer is required before Admin approval.', 400);
        }
    }
};
exports.validateWorkflowTransition = validateWorkflowTransition;
//# sourceMappingURL=workflowValidator.js.map