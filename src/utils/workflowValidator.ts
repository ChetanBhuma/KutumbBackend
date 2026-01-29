
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

export type RegistrationStatus =
    | 'IN_PROGRESS'
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'CARD_ISSUED';

const VALID_TRANSITIONS: Record<string, string[]> = {
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
export const validateWorkflowTransition = async (
    currentStatus: string,
    newStatus: string,
    citizenId?: string | null
): Promise<void> => {
    // 1. Normalize and basic validation
    const normalizedCurrent = currentStatus.toUpperCase();
    const normalizedNew = newStatus.toUpperCase();

    if (normalizedCurrent === normalizedNew) return; // No change allowed without error? Or just return? Usually idempotent is fine.

    const allowed = VALID_TRANSITIONS[normalizedCurrent];
    if (!allowed || !allowed.includes(normalizedNew)) {
         throw new AppError(
            `Invalid status transition from ${normalizedCurrent} to ${normalizedNew}. Allowed: ${allowed?.join(', ') || 'None'}`,
            400
        );
    }

    // 2. Strict Constraint: PENDING_REVIEW -> APPROVED
    if (normalizedCurrent === 'PENDING_REVIEW' && normalizedNew === 'APPROVED') {
        if (!citizenId) {
             throw new AppError('Cannot approve registration without a linked Citizen ID.', 400);
        }

        // Check for COMPLETED Verification Visit
        const completedVerification = await prisma.visit.findFirst({
            where: {
                seniorCitizenId: citizenId,
                visitType: { equals: 'Verification', mode: 'insensitive' },
                status: 'COMPLETED'
            }
        });

        if (!completedVerification) {
            throw new AppError(
                'Approval denied: A completed Verification Visit by an officer is required before Admin approval.',
                400
            );
        }
    }
};
