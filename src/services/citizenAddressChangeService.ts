import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import { AuthRequest } from '../middleware/authenticate';

/**
 * Helper Functions for Address Change and Re-Verification
 */

export class CitizenAddressChangeService {
    /**
     * Cancel all pending visits for a citizen
     */
    static async cancelPendingVisits(citizenId: string, reason: string, cancelledBy?: string) {
        const cancelledVisits = await prisma.visit.updateMany({
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

        auditLogger.info('Pending visits cancelled', {
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
    static async createReVerificationVisit(
        citizenId: string,
        officerId: string,
        policeStationId: string,
        previousAddress?: string
    ) {
        const visit = await prisma.visit.create({
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

        auditLogger.info('Re-verification visit created', {
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
    static async resetVerificationStatus(citizenId: string, remarks: string) {
        await prisma.seniorCitizen.update({
            where: { id: citizenId },
            data: {
                idVerificationStatus: 'Pending',
                officialRemarks: remarks
            }
        });

        auditLogger.info('Verification status' +
            ' reset', {
            citizenId,
            newStatus: 'Pending',
            reason: remarks
        });
    }
}

export default CitizenAddressChangeService;
