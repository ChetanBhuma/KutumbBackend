import { prisma } from '../config/database';
import { auditLogger } from '../config/logger';
import { eventBus, AppEvent } from '../events/eventBus';

/**
 * Handle officer leave - reassign scheduled visits to backup officer
 */
export const handleLeaveReassignment = async (officerId: string, leaveStartDate: Date, leaveEndDate: Date) => {
    try {
        // Find all scheduled visits for this officer during leave period
        const affectedVisits = await prisma.visit.findMany({
            where: {
                officerId,
                status: 'SCHEDULED',
                scheduledDate: {
                    gte: leaveStartDate,
                    lte: leaveEndDate
                }
            },
            include: {
                SeniorCitizen: true,
                officer: {
                    include: {
                        Beat: true
                    }
                }
            }
        });

        if (affectedVisits.length === 0) {
            return { reassignedCount: 0 };
        }

        // Find backup officer in the same beat
        const backupOfficer = await prisma.beatOfficer.findFirst({
            where: {
                beatId: affectedVisits[0].officer.beatId,
                isActive: true,
                id: { not: officerId },
                // Not on leave during this period
                Leave: {
                    none: {
                        status: 'Approved',
                        startDate: { lte: leaveEndDate },
                        endDate: { gte: leaveStartDate }
                    }
                }
            }
        });

        if (!backupOfficer) {
            auditLogger.warn('No backup officer available for reassignment', {
                officerId,
                beatId: affectedVisits[0].officer.beatId,
                affectedVisits: affectedVisits.length
            });
            return { reassignedCount: 0, error: 'No backup officer available' };
        }

        // Reassign visits
        const result = await prisma.visit.updateMany({
            where: {
                id: { in: affectedVisits.map(v => v.id) }
            },
            data: {
                officerId: backupOfficer.id,
                notes: 'Reassigned due to officer leave'
            }
        });

        auditLogger.info('Visits reassigned due to officer leave', {
            originalOfficerId: officerId,
            backupOfficerId: backupOfficer.id,
            reassignedCount: result.count,
            leaveStartDate,
            leaveEndDate
        });

        // Emit event for notifications
        eventBus.emit(AppEvent.OFFICER_ASSIGNED, {
            officerId: backupOfficer.id,
            visitIds: affectedVisits.map(v => v.id),
            reason: 'Leave reassignment'
        });

        return { reassignedCount: result.count, backupOfficerId: backupOfficer.id };
    } catch (error) {
        auditLogger.error('Failed to reassign visits for officer leave', { error, officerId });
        throw error;
    }
};
