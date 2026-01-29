"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOfficerSchedule = exports.checkVisitConflict = void 0;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
/**
 * Check if a new visit conflicts with existing visits for an officer
 * Logic: Two visits conflict if their time ranges overlap
 * Visit A: [start, end], Visit B: [start, end]
 * Conflict if: A.start < B.end AND A.end > B.start
 */
const checkVisitConflict = async (officerId, scheduledDate, duration = 30, // default 30 minutes
excludeVisitId) => {
    const visitStart = new Date(scheduledDate);
    const visitEnd = new Date(visitStart.getTime() + duration * 60 * 1000);
    // Find all visits for this officer on the same day that are not cancelled/completed
    const dayStart = new Date(visitStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(visitStart);
    dayEnd.setHours(23, 59, 59, 999);
    const existingVisits = await database_1.prisma.visit.findMany({
        where: {
            officerId,
            scheduledDate: {
                gte: dayStart,
                lte: dayEnd
            },
            status: {
                in: [client_1.VisitStatus.SCHEDULED, client_1.VisitStatus.IN_PROGRESS]
            },
            ...(excludeVisitId ? { id: { not: excludeVisitId } } : {})
        },
        select: {
            id: true,
            scheduledDate: true,
            duration: true,
            seniorCitizenId: true,
            status: true
        }
    });
    const conflictingVisits = existingVisits.filter(visit => {
        const existingStart = new Date(visit.scheduledDate);
        const existingDuration = visit.duration || 30;
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60 * 1000);
        // Check overlap: visitStart < existingEnd AND visitEnd > existingStart
        return visitStart < existingEnd && visitEnd > existingStart;
    });
    return {
        hasConflict: conflictingVisits.length > 0,
        conflictingVisits: conflictingVisits.length > 0 ? conflictingVisits : undefined
    };
};
exports.checkVisitConflict = checkVisitConflict;
/**
 * Get officer's schedule for a date range
 */
const getOfficerSchedule = async (officerId, startDate, endDate) => {
    return await database_1.prisma.visit.findMany({
        where: {
            officerId,
            scheduledDate: {
                gte: startDate,
                lte: endDate
            },
            status: {
                in: [client_1.VisitStatus.SCHEDULED, client_1.VisitStatus.IN_PROGRESS]
            }
        },
        include: {
            SeniorCitizen: {
                select: {
                    id: true,
                    fullName: true,
                    permanentAddress: true,
                    vulnerabilityLevel: true
                }
            }
        },
        orderBy: {
            scheduledDate: 'asc'
        }
    });
};
exports.getOfficerSchedule = getOfficerSchedule;
//# sourceMappingURL=visitScheduler.js.map