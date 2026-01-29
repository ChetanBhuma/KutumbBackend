"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenAddressChangeService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
/**
 * Helper Functions for Address Change and Re-Verification
 */
class CitizenAddressChangeService {
    /**
     * Cancel all pending visits for a citizen
     */
    static async cancelPendingVisits(citizenId, reason, cancelledBy) {
        const cancelledVisits = await database_1.prisma.visit.updateMany({
            where: {
                seniorCitizenId: citizenId,
                status: { in: ['SCHEDULED'] }
            },
            data: {
                status: 'CANCELLED',
                notes: `${reason}`,
                cancelledAt: new Date(),
                cancelledBy: cancelledBy || 'SYSTEM'
            }
        });
        logger_1.auditLogger.info('Pending visits cancelled', {
            citizenId,
            count: cancelledVisits.count,
            reason,
            cancelledBy
        });
        return cancelledVisits.count;
    }
    /**
     * Create a re-verification visit after address change
     */
    static async createReVerificationVisit(citizenId, officerId, policeStationId, previousAddress) {
        const visit = await database_1.prisma.visit.create({
            data: {
                seniorCitizenId: citizenId,
                officerId: officerId,
                policeStationId: policeStationId,
                visitType: 'Re-verification',
                status: 'SCHEDULED',
                scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days
                priority: 'HIGH',
                notes: 'Re-verification required due to address change',
                previousAddress: previousAddress || undefined
            },
            include: {
                officer: { select: { id: true, name: true, rank: true } },
                SeniorCitizen: { select: { id: true, fullName: true } }
            }
        });
        logger_1.auditLogger.info('Re-verification visit created', {
            visitId: visit.id,
            citizenId,
            officerId,
            scheduledDate: visit.scheduledDate
        });
        return visit;
    }
    /**
     * Reset citizen verification status
     */
    static async resetVerificationStatus(citizenId, remarks) {
        await database_1.prisma.seniorCitizen.update({
            where: { id: citizenId },
            data: {
                idVerificationStatus: 'Pending',
                officialRemarks: remarks
            }
        });
        logger_1.auditLogger.info('Verification status' +
            ' reset', {
            citizenId,
            newStatus: 'Pending',
            reason: remarks
        });
    }
}
exports.CitizenAddressChangeService = CitizenAddressChangeService;
exports.default = CitizenAddressChangeService;
//# sourceMappingURL=citizenAddressChangeService.js.map