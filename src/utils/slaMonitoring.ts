import { prisma } from '../config/database';
import { auditLogger } from '../config/logger';

/**
 * SLA Configuration (in minutes)
 */
const SLA_CONFIG = {
    SOS_RESPONSE: 15, // 15 minutes to respond
    SOS_RESOLUTION: 60, // 60 minutes to resolve
    VERIFICATION_VISIT: 7 * 24 * 60, // 7 days
    ROUTINE_VISIT: 30 * 24 * 60 // 30 days
};

interface SLABreach {
    type: 'SOS_RESPONSE' | 'SOS_RESOLUTION' | 'VERIFICATION_VISIT' | 'ROUTINE_VISIT';
    entityId: string;
    expectedBy: Date;
    actualTime?: Date;
    breachDuration: number; // minutes
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

/**
 * Monitor SLA breaches in real-time
 */
export const monitorSLABreaches = async (): Promise<SLABreach[]> => {
    const breaches: SLABreach[] = [];
    const now = new Date();

    try {
        // Check SOS Response SLA
        const pendingSOSAlerts = await prisma.sOSAlert.findMany({
            where: {
                status: 'Active',
                respondedAt: null
            },
            include: {
                SeniorCitizen: {
                    select: { fullName: true }
                }
            }
        });

        for (const alert of pendingSOSAlerts) {
            const expectedResponseTime = new Date(alert.createdAt.getTime() + SLA_CONFIG.SOS_RESPONSE * 60 * 1000);
            if (now > expectedResponseTime) {
                const breachDuration = Math.floor((now.getTime() - expectedResponseTime.getTime()) / (60 * 1000));
                breaches.push({
                    type: 'SOS_RESPONSE',
                    entityId: alert.id,
                    expectedBy: expectedResponseTime,
                    breachDuration,
                    severity: 'CRITICAL'
                });

                auditLogger.error('SLA BREACH: SOS Response', {
                    alertId: alert.id,
                    citizenName: alert.SeniorCitizen.fullName,
                    breachDuration: `${breachDuration} minutes`
                });
            }
        }

        // Check SOS Resolution SLA
        const respondedSOSAlerts = await prisma.sOSAlert.findMany({
            where: {
                status: 'Responded',
                resolvedAt: null,
                respondedAt: { not: null }
            }
        });

        for (const alert of respondedSOSAlerts) {
            const expectedResolutionTime = new Date(alert.createdAt.getTime() + SLA_CONFIG.SOS_RESOLUTION * 60 * 1000);
            if (now > expectedResolutionTime) {
                const breachDuration = Math.floor((now.getTime() - expectedResolutionTime.getTime()) / (60 * 1000));
                breaches.push({
                    type: 'SOS_RESOLUTION',
                    entityId: alert.id,
                    expectedBy: expectedResolutionTime,
                    breachDuration,
                    severity: 'HIGH'
                });
            }
        }

        // Check Verification Visit SLA
        const pendingVerifications = await prisma.seniorCitizen.findMany({
            where: {
                isActive: true,
                idVerificationStatus: 'Pending',
                createdAt: {
                    lt: new Date(now.getTime() - SLA_CONFIG.VERIFICATION_VISIT * 60 * 1000)
                }
            }
        });

        for (const citizen of pendingVerifications) {
            const expectedVerificationTime = new Date(citizen.createdAt.getTime() + SLA_CONFIG.VERIFICATION_VISIT * 60 * 1000);
            const breachDuration = Math.floor((now.getTime() - expectedVerificationTime.getTime()) / (60 * 1000));
            breaches.push({
                type: 'VERIFICATION_VISIT',
                entityId: citizen.id,
                expectedBy: expectedVerificationTime,
                breachDuration,
                severity: 'MEDIUM'
            });
        }

        return breaches;
    } catch (error) {
        auditLogger.error('Failed to monitor SLA breaches', { error });
        return breaches;
    }
};

/**
 * Get SLA compliance metrics
 */
export const getSLAMetrics = async () => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        totalSOSAlerts,
        sosOnTime,
        totalVisits,
        visitsOnTime
    ] = await Promise.all([
        prisma.sOSAlert.count({
            where: { createdAt: { gte: last30Days } }
        }),
        prisma.sOSAlert.count({
            where: {
                createdAt: { gte: last30Days },
                respondedAt: {
                    not: null,
                    lte: prisma.$queryRaw`"createdAt" + interval '15 minutes'` as any
                }
            }
        }),
        prisma.visit.count({
            where: {
                createdAt: { gte: last30Days },
                status: 'COMPLETED'
            }
        }),
        prisma.visit.count({
            where: {
                createdAt: { gte: last30Days },
                status: 'COMPLETED',
                // completedAt does not exist on Visit, using updatedAt as proxy or skipping if not available
                updatedAt: {
                    lte: prisma.$queryRaw`"scheduledDate" + interval '2 hours'` as any
                }
            }
        })
    ]);

    return {
        sos: {
            total: totalSOSAlerts,
            onTime: sosOnTime,
            compliance: totalSOSAlerts > 0 ? (sosOnTime / totalSOSAlerts) * 100 : 100
        },
        visits: {
            total: totalVisits,
            onTime: visitsOnTime,
            compliance: totalVisits > 0 ? (visitsOnTime / totalVisits) * 100 : 100
        }
    };
};
