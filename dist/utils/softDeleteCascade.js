"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCitizenSoftDelete = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
/**
 * Soft delete cascade logic
 * When a citizen is soft-deleted (isActive = false), this handles cleanup of related records
 */
const handleCitizenSoftDelete = async (citizenId) => {
    try {
        return await database_1.prisma.$transaction(async (tx) => {
            // 1. Soft delete the citizen
            await tx.seniorCitizen.update({
                where: { id: citizenId },
                data: { isActive: false }
            });
            // 2. Cancel all scheduled visits
            const cancelledVisits = await tx.visit.updateMany({
                where: {
                    seniorCitizenId: citizenId,
                    status: 'SCHEDULED'
                },
                data: {
                    status: 'CANCELLED',
                    notes: 'Citizen deactivated'
                }
            });
            // 3. Resolve active SOS alerts
            const resolvedAlerts = await tx.sOSAlert.updateMany({
                where: {
                    seniorCitizenId: citizenId,
                    status: 'Active'
                },
                data: {
                    status: 'Resolved',
                    notes: 'Citizen deactivated'
                }
            });
            // 4. Close pending service requests
            const closedRequests = await tx.serviceRequest.updateMany({
                where: {
                    seniorCitizenId: citizenId,
                    status: { in: ['Pending', 'In_Progress'] }
                },
                data: {
                    status: 'Closed',
                    resolution: 'Citizen deactivated'
                }
            });
            logger_1.auditLogger.info('Citizen soft delete cascade completed', {
                citizenId,
                cancelledVisits: cancelledVisits.count,
                resolvedAlerts: resolvedAlerts.count,
                closedRequests: closedRequests.count
            });
            return {
                success: true,
                cancelledVisits: cancelledVisits.count,
                resolvedAlerts: resolvedAlerts.count,
                closedRequests: closedRequests.count
            };
        });
    }
    catch (error) {
        logger_1.auditLogger.error('Citizen soft delete cascade failed', {
            citizenId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
};
exports.handleCitizenSoftDelete = handleCitizenSoftDelete;
//# sourceMappingURL=softDeleteCascade.js.map