import { validateWorkflowTransition } from '../utils/workflowValidator';
import { prisma } from '../config/database';

// Mock prisma
jest.mock('../config/database', () => ({
    prisma: {
        visit: {
            findFirst: jest.fn()
        }
    }
}));

describe('Workflow Validator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow valid transition IN_PROGRESS -> PENDING_REVIEW', async () => {
        await expect(validateWorkflowTransition('IN_PROGRESS', 'PENDING_REVIEW', 'cit1'))
            .resolves.not.toThrow();
    });

    it('should block PENDING_REVIEW -> APPROVED if no verification visit exists', async () => {
        (prisma.visit.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(validateWorkflowTransition('PENDING_REVIEW', 'APPROVED', 'cit1'))
            .rejects.toThrow('Approval denied: A completed Verification Visit by an officer is required before Admin approval.');
    });

    it('should allow PENDING_REVIEW -> APPROVED if verification visit exists', async () => {
        (prisma.visit.findFirst as jest.Mock).mockResolvedValue({ id: 'visit1' });

        await expect(validateWorkflowTransition('PENDING_REVIEW', 'APPROVED', 'cit1'))
            .resolves.not.toThrow();
    });

    it('should throw error for invalid transition', async () => {
        await expect(validateWorkflowTransition('DRAFT', 'APPROVED', 'cit1'))
            .rejects.toThrow(/Invalid status transition from DRAFT to APPROVED/);
    });
});
