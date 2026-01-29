import { prisma } from '../config/database';
import { VisitStatus } from '@prisma/client';

export interface VisitConflict {
    hasConflict: boolean;
    conflictingVisits?: Array<{
        id: string;
        scheduledDate: Date;
        duration?: number | null;
        seniorCitizenId: string;
        status: string;
    }>;
}

/**
 * Check if a new visit conflicts with existing visits for an officer
 * Logic: Two visits conflict if their time ranges overlap
 * Visit A: [start, end], Visit B: [start, end]
 * Conflict if: A.start < B.end AND A.end > B.start
 */
export const checkVisitConflict = async (
    officerId: string,
    scheduledDate: Date,
    duration: number = 30, // default 30 minutes
    excludeVisitId?: string
): Promise<VisitConflict> => {
    const visitStart = new Date(scheduledDate);
    const visitEnd = new Date(visitStart.getTime() + duration * 60 * 1000);

    // Find all visits for this officer on the same day that are not cancelled/completed
    const dayStart = new Date(visitStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(visitStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existingVisits = await prisma.visit.findMany({
        where: {
            officerId,
            scheduledDate: {
                gte: dayStart,
                lte: dayEnd
            },
            status: {
                in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS]
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

/**
 * Get officer's schedule for a date range
 */
export const getOfficerSchedule = async (
    officerId: string,
    startDate: Date,
    endDate: Date
) => {
    return await prisma.visit.findMany({
        where: {
            officerId,
            scheduledDate: {
                gte: startDate,
                lte: endDate
            },
            status: {
                in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS]
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
