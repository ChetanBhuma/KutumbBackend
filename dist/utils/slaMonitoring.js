"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSLAMetrics = exports.monitorSLABreaches = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
/**
 * SLA Configuration (in minutes)
 */
const SLA_CONFIG = {
    SOS_RESPONSE: 15, // 15 minutes to respond
    SOS_RESOLUTION: 60, // 60 minutes to resolve
    VERIFICATION_VISIT: 7 * 24 * 60, // 7 days
    ROUTINE_VISIT: 30 * 24 * 60 // 30 days
};
/**
 * Monitor SLA breaches in real-time
 */
const monitorSLABreaches = async () => {
    const breaches = [];
    const now = new Date();
    try {
        // Check SOS Response SLA
        const pendingSOSAlerts = await database_1.prisma.sOSAlert.findMany({
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
                logger_1.auditLogger.error('SLA BREACH: SOS Response', {
                    alertId: alert.id,
                    citizenName: alert.SeniorCitizen.fullName,
                    breachDuration: `${breachDuration} minutes`
                });
            }
        }
        // Check SOS Resolution SLA
        const respondedSOSAlerts = await database_1.prisma.sOSAlert.findMany({
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
        const pendingVerifications = await database_1.prisma.seniorCitizen.findMany({
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
    }
    catch (error) {
        logger_1.auditLogger.error('Failed to monitor SLA breaches', { error });
        return breaches;
    }
};
exports.monitorSLABreaches = monitorSLABreaches;
/**
 * Get SLA compliance metrics
 */
const getSLAMetrics = async () => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [totalSOSAlerts, sosOnTime, totalVisits, visitsOnTime] = await Promise.all([
        database_1.prisma.sOSAlert.count({
            where: { createdAt: { gte: last30Days } }
        }),
        database_1.prisma.sOSAlert.count({
            where: {
                createdAt: { gte: last30Days },
                respondedAt: {
                    not: null,
                    lte: database_1.prisma.$queryRaw `"createdAt" + interval '15 minutes'`
                }
            }
        }),
        database_1.prisma.visit.count({
            where: {
                createdAt: { gte: last30Days },
                status: 'COMPLETED'
            }
        }),
        database_1.prisma.visit.count({
            where: {
                createdAt: { gte: last30Days },
                status: 'COMPLETED',
                // completedAt does not exist on Visit, using updatedAt as proxy or skipping if not available
                updatedAt: {
                    lte: database_1.prisma.$queryRaw `"scheduledDate" + interval '2 hours'`
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
exports.getSLAMetrics = getSLAMetrics;
//# sourceMappingURL=slaMonitoring.js.map