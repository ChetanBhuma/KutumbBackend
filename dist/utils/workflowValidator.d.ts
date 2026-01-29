export type RegistrationStatus = 'IN_PROGRESS' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CARD_ISSUED';
/**
 * Validates if a status transition is allowed based on the strict state machine.
 * Also performs async checks for database constraints (e.g. Verification Visit required).
 */
export declare const validateWorkflowTransition: (currentStatus: string, newStatus: string, citizenId?: string | null) => Promise<void>;
//# sourceMappingURL=workflowValidator.d.ts.map