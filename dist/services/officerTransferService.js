"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerTransferService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const client_1 = require("@prisma/client");
/**
 * Service for handling beat officer transfers and bulk citizen reassignment
 */
class OfficerTransferService {
    /**
     * Find available officer in a beat (excluding specific officer)
     * Returns officer with least workload
     */
    static async findAvailableOfficerInBeat(beatId, excludeOfficerId) {
        const officers = await database_1.prisma.beatOfficer.findMany({
            where: {
                beatId,
                isActive: true,
                id: excludeOfficerId ? { not: excludeOfficerId } : undefined
            },
            include: {
                Beat: {
                    include: {
                        SeniorCitizen: {
                            where: { isActive: true },
                            select: { id: true }
                        }
                    }
                }
            }
        });
        if (officers.length === 0)
            return null;
        // Sort by workload (count of assigned citizens)
        officers.sort((a, b) => {
            const aLoad = a.Beat?.SeniorCitizen?.length || 0;
            const bLoad = b.Beat?.SeniorCitizen?.length || 0;
            return aLoad - bLoad;
        });
        return officers[0]; // Return officer with least workload
    }
    /**
     * Reassign citizens to available officers when officer transfers
     */
    static async reassignCitizensToNewOfficers(citizenIds, beatId, excludeOfficerId) {
        const results = [];
        for (const citizenId of citizenIds) {
            // Find another active officer in the same beat
            const newOfficer = await this.findAvailableOfficerInBeat(beatId, excludeOfficerId);
            if (newOfficer) {
                // Note: Citizens are automatically assigned to beat
                // We just need to log the reassignment
                results.push({
                    citizenId,
                    newOfficerId: newOfficer.id,
                    newOfficerName: newOfficer.name,
                    status: 'REASSIGNED'
                });
                logger_1.auditLogger.info('Citizen reassigned during officer transfer', {
                    citizenId,
                    fromOfficerId: excludeOfficerId,
                    toOfficerId: newOfficer.id,
                    beatId
                });
            }
            else {
                // No available officer - flag for manual assignment
                results.push({
                    citizenId,
                    status: 'PENDING_MANUAL_ASSIGNMENT',
                    reason: 'No available officers in beat'
                });
                logger_1.auditLogger.warn('Citizen requires manual assignment - no officers available', {
                    citizenId,
                    beatId,
                    fromOfficerId: excludeOfficerId
                });
            }
        }
        return results;
    }
    /**
     * Handle scheduled visits when officer transfers
     * Reassign or cancel based on availability
     */
    static async handleOfficerTransferVisits(scheduledVisits, reassignments) {
        const results = {
            reassigned: 0,
            cancelled: 0
        };
        for (const visit of scheduledVisits) {
            const reassignment = reassignments.find((r) => r.citizenId === visit.seniorCitizenId && r.status === 'REASSIGNED');
            if (reassignment && reassignment.newOfficerId) {
                // Reassign visit to new officer
                await database_1.prisma.visit.update({
                    where: { id: visit.id },
                    data: {
                        officerId: reassignment.newOfficerId,
                        notes: `${visit.notes || ''}\n[AUTO-REASSIGNED] Officer transferred, visit reassigned to ${reassignment.newOfficerName}`
                    }
                });
                results.reassigned++;
                logger_1.auditLogger.info('Visit reassigned due to officer transfer', {
                    visitId: visit.id,
                    newOfficerId: reassignment.newOfficerId
                });
            }
            else {
                // Cancel visit if no officer available
                await database_1.prisma.visit.update({
                    where: { id: visit.id },
                    data: {
                        status: client_1.VisitStatus.CANCELLED,
                        cancelledAt: new Date(),
                        cancelledBy: 'SYSTEM',
                        notes: `${visit.notes || ''}\n[CANCELLED] Officer transferred, no replacement available in beat`
                    }
                });
                results.cancelled++;
                logger_1.auditLogger.warn('Visit cancelled - officer transferred, no replacement', {
                    visitId: visit.id,
                    citizenId: visit.seniorCitizenId
                });
            }
        }
        return results;
    }
    /**
     * Preview transfer impact before execution
     */
    static async previewTransfer(officerId, newBeatId) {
        const officer = await database_1.prisma.beatOfficer.findUnique({
            where: { id: officerId },
            include: {
                Beat: {
                    include: {
                        SeniorCitizen: {
                            where: { isActive: true },
                            select: { id: true, fullName: true }
                        }
                    }
                },
                Visit: {
                    where: { status: client_1.VisitStatus.SCHEDULED },
                    select: { id: true, visitType: true, scheduledDate: true }
                }
            }
        });
        if (!officer || !officer.Beat) {
            return {
                success: false,
                message: 'Officer or beat not found'
            };
        }
        const citizensAffected = officer.Beat.SeniorCitizen.length;
        const visitsAffected = officer.Visit.length;
        // Check available officers in old beat
        const availableOfficers = await this.findAvailableOfficerInBeat(officer.beatId, officerId);
        // Check officers in new beat
        const newBeatOfficers = await database_1.prisma.beatOfficer.count({
            where: {
                beatId: newBeatId,
                isActive: true
            }
        });
        return {
            success: true,
            data: {
                currentBeat: officer.Beat.name,
                citizensCount: citizensAffected,
                scheduledVisitsCount: visitsAffected,
                availableOfficersInOldBeat: availableOfficers ? 1 : 0,
                officersInNewBeat: newBeatOfficers,
                canReassignCitizens: !!availableOfficers,
                citizens: officer.Beat.SeniorCitizen.map((c) => ({
                    id: c.id,
                    name: c.fullName
                })),
                scheduledVisits: officer.Visit.map((v) => ({
                    id: v.id,
                    type: v.visitType,
                    scheduledDate: v.scheduledDate
                }))
            }
        };
    }
}
exports.OfficerTransferService = OfficerTransferService;
exports.default = OfficerTransferService;
//# sourceMappingURL=officerTransferService.js.map