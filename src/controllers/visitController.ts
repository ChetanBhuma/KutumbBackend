import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { VisitStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import { AuthRequest } from '../middleware/authenticate';
import { Role } from '../types/auth';
import { paginatedQuery } from '../utils/pagination';
import { buildWhereClause, buildOrderBy } from '../utils/queryBuilder';
import { validateTransition } from '../utils/workflowValidation';
import { checkVisitConflict } from '../services/visitScheduler';
import { NotificationService } from '../services/notificationService';
import { validateVisitDuration } from '../utils/dataValidation';

const GEO_FENCE_THRESHOLD_METERS = 25;

const calculateDistanceMeters = (
    lat1?: number | null,
    lon1?: number | null,
    lat2?: number | null,
    lon2?: number | null
): number | null => {
    if (
        lat1 === undefined || lat1 === null ||
        lon1 === undefined || lon1 === null ||
        lat2 === undefined || lat2 === null ||
        lon2 === undefined || lon2 === null
    ) {
        return null;
    }

    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const ensureOfficerAccess = async (req: AuthRequest, visitOfficerId: string) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    if (req.user.role === Role.OFFICER) {
        const officerProfile = await prisma.beatOfficer.findFirst({ where: { user: { id: req.user.id } } });
        if (!officerProfile || officerProfile.id !== visitOfficerId) {
            throw new AppError('Unauthorized access to visit', 403);
        }
        return officerProfile;
    }

    return null;
};

const enforceGeofence = (citizen: any, latitude?: number, longitude?: number) => {
    // Bypass geofence in development/test environment
    if (process.env.NODE_ENV !== 'production') return;

    if (latitude === undefined || longitude === undefined) {
        return;
    }

    if (!citizen?.gpsLatitude || !citizen?.gpsLongitude) {
        return;
    }

    const distance = calculateDistanceMeters(
        latitude,
        longitude,
        citizen.gpsLatitude,
        citizen.gpsLongitude
    );

    if (distance !== null && distance > GEO_FENCE_THRESHOLD_METERS) {
        throw new AppError('Officer must be within 30 meters of the citizen location to start/complete the visit', 400);
    }
};

export class VisitController {
    /**
     * Get all visits with pagination and filters
     */
    /**
     * Get all visits with pagination and filters
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            // Map citizenId to seniorCitizenId for DB query
            const query = { ...req.query };
            if (query.citizenId) {
                query.seniorCitizenId = query.citizenId;
            }

            // Normalize status and visitType to match DB Enums/Formats
            if (query.status && typeof query.status === 'string') {
                // Convert "In Progress" -> "IN_PROGRESS", "Scheduled" -> "SCHEDULED"
                query.status = query.status.toUpperCase().replace(/\s+/g, '_');
            }
            // visitType seems to be Title Case in DB (Routine, Emergency), so we might not need to uppercase it entirely,
            // but let's ensure it matches what the frontend sends or what the DB expects.
            // Based on previous files, visitType is Title Case. Status is UPPERCASE Enum.

            const where = buildWhereClause(query, {
                exactMatchFields: [
                    'status',
                    'officerId',
                    'seniorCitizenId',
                    'policeStationId',
                    'beatId',
                    'visitType'
                ],
                dateRangeField: 'scheduledDate'
            });

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.PoliceStation = { rangeId: scope.jurisdictionIds.rangeId };
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.PoliceStation = { districtId: scope.jurisdictionIds.districtId };
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.PoliceStation = { subDivisionId: scope.jurisdictionIds.subDivisionId };
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const result = await paginatedQuery(prisma.visit, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    SeniorCitizen: {
                        select: {
                            fullName: true,
                            mobileNumber: true,
                            permanentAddress: true,
                            gpsLatitude: true,
                            gpsLongitude: true
                        }
                    },
                    officer: {
                        select: {
                            id: true,
                            name: true,
                            rank: true,
                            badgeNumber: true,
                            mobileNumber: true
                        }
                    },
                    PoliceStation: {
                        select: { id: true, name: true }
                    },
                    Beat: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: buildOrderBy(req.query, { scheduledDate: 'desc' })
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get visit by ID
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const visit = await prisma.visit.findUnique({
                where: { id },
                include: {
                    SeniorCitizen: {
                        include: { LivingArrangement: true }
                    },
                    officer: true,
                    PoliceStation: true,
                    Beat: true
                }
            });

            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            res.json({
                success: true,
                data: { visit }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new visit (manual scheduling)
     */
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const visitData = req.body;

            // Verify citizen exists
            const citizen = await prisma.seniorCitizen.findUnique({
                where: { id: visitData.seniorCitizenId }
            });

            if (!citizen) {
                throw new AppError('Citizen not found', 404);
            }

            // Verify officer exists
            const officer = await prisma.beatOfficer.findUnique({
                where: { id: visitData.officerId }
            });

            if (!officer) {
                throw new AppError('Officer not found', 404);
            }

            // Check for visit conflicts (unless it's an emergency)
            const isEmergency = visitData.visitType === 'Emergency';
            if (!isEmergency) {
                const conflict = await checkVisitConflict(
                    visitData.officerId,
                    visitData.scheduledDate,
                    visitData.duration
                );

                if (conflict.hasConflict) {
                    throw new AppError(
                        `Officer has conflicting visits at this time. Conflicting visits: ${conflict.conflictingVisits?.length}`,
                        409
                    );
                }
            }

            // VALIDATION: Check visit duration if provided
            if (visitData.duration) {
                const durationValidation = validateVisitDuration(visitData.duration);
                if (!durationValidation.valid) {
                    throw new AppError(durationValidation.message || 'Invalid duration', 400);
                }
            }

            // Create visit
            const visit = await prisma.visit.create({
                data: {
                    ...visitData,
                    scheduledDate: new Date(visitData.scheduledDate),
                    policeStationId: officer.policeStationId,
                    beatId: officer.beatId || citizen.beatId
                },
                include: {
                    SeniorCitizen: true,
                    officer: true
                }
            });

            auditLogger.info('Visit scheduled', {
                visitId: visit.id,
                citizenId: citizen.id,
                citizenName: citizen.fullName,
                officerId: officer.id,
                officerName: officer.name,
                scheduledDate: visit.scheduledDate,
                createdBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            if (citizen.mobileNumber) {
                NotificationService.sendVisitScheduled(
                    citizen.mobileNumber,
                    citizen.fullName,
                    officer.name,
                    visit.scheduledDate,
                    visit.visitType
                ).catch(err => console.error('Failed to send visit notification', err));
            }

            res.status(201).json({
                success: true,
                data: { visit },
                message: 'Visit scheduled successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get visits assigned to the logged-in officer
     */
    static async getOfficerAssignments(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('Authentication required', 401);
            }

            const officerProfile = await prisma.beatOfficer.findFirst({ where: { user: { id: req.user.id } } });

            if (!officerProfile) {
                throw new AppError('Officer profile not linked to this account', 404);
            }

            const { status } = req.query;

            const visits = await prisma.visit.findMany({
                where: {
                    officerId: officerProfile.id,
                    status: status ? (String(status) as VisitStatus) : undefined
                },
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            permanentAddress: true,
                            gpsLatitude: true,
                            gpsLongitude: true,
                            vulnerabilityLevel: true
                        }
                    }
                },
                orderBy: { scheduledDate: 'asc' }
            });

            res.json({
                success: true,
                data: {
                    officer: {
                        id: officerProfile.id,
                        name: officerProfile.name,
                        beatId: officerProfile.beatId,
                        policeStationId: officerProfile.policeStationId
                    },
                    visits
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Officer starts a visit (geo-fence validation)
     */
    static async startVisit(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { latitude, longitude } = req.body as { latitude?: number; longitude?: number };

            const visit = await prisma.visit.findUnique({
                where: { id },
                include: { SeniorCitizen: true }
            });

            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            await ensureOfficerAccess(req, visit.officerId);
            enforceGeofence(visit.SeniorCitizen, latitude, longitude);

            validateTransition('VISIT', visit.status, 'IN_PROGRESS');

            const updated = await prisma.visit.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date(),
                    gpsLatitude: latitude ?? visit.gpsLatitude,
                    gpsLongitude: longitude ?? visit.gpsLongitude
                }
            });

            res.json({
                success: true,
                data: { visit: updated }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Officer completes visit with assessment data
     */
    static async completeAsOfficer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const {
                assessmentData,
                riskScore,
                photoUrl,
                notes,
                gpsLatitude,
                gpsLongitude,
                duration
            } = req.body;

            const visit: any = await prisma.visit.findUnique({
                where: { id },
                include: { SeniorCitizen: true }
            });

            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            await ensureOfficerAccess(req, visit.officerId);
            enforceGeofence(visit.SeniorCitizen, gpsLatitude, gpsLongitude);

            validateTransition('VISIT', visit.status, 'COMPLETED');

            // --- VULNERABILITY MAPPING LOGIC ---
            let newVulnerabilityLevel = visit.SeniorCitizen?.vulnerabilityLevel || 'Low';
            if (typeof riskScore === 'number') {
                if (riskScore >= 71) newVulnerabilityLevel = 'Critical';
                else if (riskScore >= 51) newVulnerabilityLevel = 'High';
                else if (riskScore >= 31) newVulnerabilityLevel = 'Medium';
                else newVulnerabilityLevel = 'Low';
            }

            // --- SYNC ASSESSMENT TO MASTER PROFILE ---
            let seniorCitizenUpdate: any = {
                lastVisitDate: new Date(),
                vulnerabilityLevel: newVulnerabilityLevel
            };

            // 1. Sync Mobility from new Physical Safety section
            if (assessmentData?.sections?.physicalSafety?.mobility) {
                const mobilityMap: Record<string, string> = {
                    'Fully Mobile': 'None',
                    'Needs Support': 'Moderate',
                    'Limited Mobility': 'Severe'
                };
                seniorCitizenUpdate.mobilityConstraints =
                    mobilityMap[assessmentData.sections.physicalSafety.mobility] || 'None';
            }

            // 2. Sync Mental Health Status (new field from Health & Mental Well-Being section)
            if (assessmentData?.sections?.healthMentalWellbeing?.mentalStatus) {
                seniorCitizenUpdate.mobilityStatus =
                    assessmentData.sections.healthMentalWellbeing.mentalStatus;
            }

            // Note: No longer syncing livingArrangement from assessment
            // (old logic removed as it's not part of new assessment structure)

            // --- SPECIAL SCENARIOS (e.g. Deceased) ---
            if (assessmentData?.citizenStatus === 'Deceased') {
                seniorCitizenUpdate.status = 'Deceased';
                seniorCitizenUpdate.isActive = false;
                seniorCitizenUpdate.isSoftDeleted = true;
            }

            const updatedVisit = await prisma.visit.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedDate: new Date(),
                    assessmentData: assessmentData || undefined,
                    riskScore: typeof riskScore === 'number' ? riskScore : visit.riskScore,
                    notes: notes || visit.notes,
                    photoUrl: photoUrl || visit.photoUrl,
                    gpsLatitude: gpsLatitude ?? visit.gpsLatitude,
                    gpsLongitude: gpsLongitude ?? visit.gpsLongitude,
                    duration: duration ?? visit.duration
                },
                include: { SeniorCitizen: true, officer: true }
            });

            // Update citizen profile with assessment data
            await prisma.seniorCitizen.update({
                where: { id: visit.seniorCitizenId },
                data: seniorCitizenUpdate
            });

            // SPECIAL HANDLING FOR VERIFICATION VISITS
            if (visit.visitType === 'Verification') {
                // Find the related VerificationRequest
                const verificationRequest = await prisma.verificationRequest.findFirst({
                    where: {
                        seniorCitizenId: visit.seniorCitizenId,
                        entityType: 'SeniorCitizen',
                        status: { in: ['PENDING', 'IN_PROGRESS'] }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (verificationRequest) {
                    // Update VerificationRequest to show verification is COMPLETE (Auto-Approved)
                    await prisma.verificationRequest.update({
                        where: { id: verificationRequest.id },
                        data: {
                            status: 'APPROVED', // Auto-approved based on officer field work
                            verifiedBy: req.user?.id,
                            verifiedAt: new Date(),
                            verificationMethod: 'Physical',
                            verificationNotes: notes || 'Field verification completed by officer - Auto Approved'
                        }
                    });

                    // AUTO-APPROVAL LOGIC:
                    // 1. Generate Card Number if missing
                    const currentCitizen = await prisma.seniorCitizen.findUnique({
                        where: { id: visit.seniorCitizenId },
                        select: { digitalCardNumber: true, userId: true }
                    });

                    let cardUpdateData: any = {
                        idVerificationStatus: 'Verified', // Fully verified
                        status: 'APPROVED', // Active and Approved
                        digitalCardIssued: true,
                        digitalCardIssueDate: new Date()
                    };

                    if (!currentCitizen?.digitalCardNumber) {
                        const year = new Date().getFullYear();
                        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                        cardUpdateData.digitalCardNumber = `SCID-${year}-${randomSuffix}`;
                    }

                    // Update citizen's verification status
                    await prisma.seniorCitizen.update({
                        where: { id: visit.seniorCitizenId },
                        data: cardUpdateData
                    });

                    // Update CitizenRegistration status to APPROVED
                    if (currentCitizen?.userId) {
                        await prisma.citizenRegistration.updateMany({
                            where: {
                                citizenId: visit.seniorCitizenId,
                                status: { in: ['IN_PROGRESS', 'PENDING_REVIEW'] }
                            },
                            data: {
                                status: 'APPROVED'
                            }
                        });
                    }

                    auditLogger.info('Verification visit completed - Citizen Auto-Approved', {
                        visitId: updatedVisit.id,
                        verificationRequestId: verificationRequest.id,
                        citizenId: visit.seniorCitizenId,
                        newStatus: 'APPROVED',
                        cardIssued: true,
                        registrationApproved: true
                    });
                }
            }

            auditLogger.info('Visit completed by officer', {
                visitId: updatedVisit.id,
                officerId: updatedVisit.officerId,
                citizenId: updatedVisit.seniorCitizenId,
                riskScore,
                newVulnerabilityLevel,
                syncUpdates: Object.keys(seniorCitizenUpdate)
            });

            if (updatedVisit.SeniorCitizen?.mobileNumber) {
                NotificationService.sendVisitCompletionNotification(
                    updatedVisit.SeniorCitizen.mobileNumber,
                    updatedVisit.officer.name
                ).catch(err => console.error('Failed to send completion notification', err));
            }

            res.json({
                success: true,
                data: { visit: updatedVisit }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Auto-schedule visits based on workload and priority
     */
    static async autoSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { policeStationId, beatId, startDate, endDate } = req.body;

            // Get citizens who need visits
            const citizensNeedingVisits = await prisma.seniorCitizen.findMany({
                where: {
                    isActive: true,
                    policeStationId: policeStationId || undefined,
                    beatId: beatId || undefined,
                    OR: [
                        { lastVisitDate: null },
                        { lastVisitDate: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // No visit in 30 days
                    ]
                },
                orderBy: [
                    { vulnerabilityLevel: 'desc' }, // High vulnerability first
                    { lastVisitDate: 'asc' } // Oldest visit first
                ]
            });

            // Get available officers
            const officers = await prisma.beatOfficer.findMany({
                where: {
                    isActive: true,
                    policeStationId: policeStationId || undefined,
                    beatId: beatId || undefined
                },
                include: {
                    _count: {
                        select: {
                            Visit: {
                                where: {
                                    scheduledDate: {
                                        gte: new Date(startDate),
                                        lte: new Date(endDate)
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (officers.length === 0) {
                throw new AppError('No officers available for scheduling', 400);
            }

            // Sort officers by workload (least busy first)
            officers.sort((a, b) => a._count.Visit - b._count.Visit);

            // Schedule visits
            const scheduledVisits = [];
            const start = new Date(startDate);
            const end = new Date(endDate);
            let currentDate = new Date(start);
            let officerIndex = 0;

            for (const citizen of citizensNeedingVisits) {
                if (currentDate > end) break;

                const officer = officers[officerIndex % officers.length];

                const visit = await prisma.visit.create({
                    data: {
                        seniorCitizenId: citizen.id,
                        officerId: officer.id,
                        policeStationId: officer.policeStationId || '',
                        beatId: officer.beatId || citizen.beatId,
                        scheduledDate: new Date(currentDate),
                        status: 'SCHEDULED',
                        visitType: 'Routine'
                    }
                });

                scheduledVisits.push(visit);

                // Move to next day and next officer
                currentDate.setDate(currentDate.getDate() + 1);
                officerIndex++;

                // Send notification asynchronously
                if (citizen.mobileNumber) {
                    NotificationService.sendVisitScheduled(
                        citizen.mobileNumber,
                        citizen.fullName,
                        officer.name,
                        visit.scheduledDate,
                        visit.visitType
                    ).catch(err => console.error('Failed to send auto-schedule notification', err));
                }
            }

            auditLogger.info('Auto-scheduled visits', {
                count: scheduledVisits.length,
                startDate,
                endDate,
                policeStationId,
                beatId,
                scheduledBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: {
                    scheduledVisits,
                    count: scheduledVisits.length
                },
                message: `Successfully scheduled ${scheduledVisits.length} visits`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update visit
     */
    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const visit = await prisma.visit.findUnique({ where: { id } });
            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            if (updateData.status) {
                validateTransition('VISIT', visit.status, updateData.status);
            }

            // Ensure scheduledDate is a Date object if provided
            if (updateData.scheduledDate) {
                updateData.scheduledDate = new Date(updateData.scheduledDate);
            }

            // Check for conflicts if rescheduling (and not emergency)
            if (updateData.scheduledDate || updateData.duration) {
                const isEmergency = (updateData.visitType || visit.visitType) === 'Emergency';
                if (!isEmergency) {
                    const conflict = await checkVisitConflict(
                        updateData.officerId || visit.officerId,
                        updateData.scheduledDate || visit.scheduledDate,
                        updateData.duration || visit.duration || 30,
                        id // exclude current visit from conflict check
                    );

                    if (conflict.hasConflict) {
                        throw new AppError(
                            `Officer has conflicting visits at this time. Conflicting visits: ${conflict.conflictingVisits?.length}`,
                            409
                        );
                    }
                }
            }

            const updatedVisit = await prisma.visit.update({
                where: { id },
                data: updateData,
                include: {
                    SeniorCitizen: true,
                    officer: true
                }
            });

            auditLogger.info('Visit updated', {
                visitId: updatedVisit.id,
                updatedBy: req.user?.email,
                changes: Object.keys(updateData),
                timestamp: new Date().toISOString()
            });

            if (updateData.scheduledDate && updatedVisit.SeniorCitizen?.mobileNumber) {
                NotificationService.sendVisitScheduled(
                    updatedVisit.SeniorCitizen.mobileNumber,
                    updatedVisit.SeniorCitizen.fullName,
                    updatedVisit.officer?.name || 'Assigned Officer',
                    updatedVisit.scheduledDate,
                    updatedVisit.visitType
                ).catch(err => console.error('Failed to send reschedule notification', err));
            }

            res.json({
                success: true,
                data: { visit: updatedVisit },
                message: 'Visit updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Complete visit (mark as completed with details)
     */
    static async complete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { notes, photoUrl, gpsLatitude, gpsLongitude, duration } = req.body;

            const visit = await prisma.visit.findUnique({ where: { id }, include: { SeniorCitizen: true } });
            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            validateTransition('VISIT', visit.status, 'COMPLETED');

            const updatedVisit = await prisma.visit.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedDate: new Date(),
                    notes,
                    photoUrl,
                    gpsLatitude,
                    gpsLongitude,
                    duration
                },
                include: {
                    SeniorCitizen: true,
                    officer: true
                }
            });

            // Update citizen's last visit date
            await prisma.seniorCitizen.update({
                where: { id: updatedVisit.seniorCitizenId },
                data: { lastVisitDate: new Date() }
            });

            auditLogger.info('Visit completed', {
                visitId: updatedVisit.id,
                citizenId: updatedVisit.seniorCitizenId,
                citizenName: updatedVisit.SeniorCitizen.fullName,
                completedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            if (updatedVisit.SeniorCitizen?.mobileNumber) {
                NotificationService.sendVisitCompletionNotification(
                    updatedVisit.SeniorCitizen.mobileNumber,
                    updatedVisit.officer?.name || 'Officer'
                ).catch(err => console.error('Failed to send completion notification', err));
            }

            res.json({
                success: true,
                data: { visit: updatedVisit },
                message: 'Visit marked as completed'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel visit
     */
    static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const visit = await prisma.visit.findUnique({ where: { id } });
            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            validateTransition('VISIT', visit.status, 'CANCELLED');

            const updatedVisit = await prisma.visit.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    notes: reason
                }
            });

            auditLogger.warn('Visit cancelled', {
                visitId: updatedVisit.id,
                reason,
                cancelledBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            // Fetch included relations to get mobile number if not already loaded (cancel doesn't include by default in update above)
            // But we can fetch it separately or assume we need it
            const citizen = await prisma.seniorCitizen.findUnique({ where: { id: updatedVisit.seniorCitizenId } });
            if (citizen && citizen.mobileNumber) {
                NotificationService.sendVisitCancelled(
                    citizen.mobileNumber,
                    citizen.fullName,
                    reason
                ).catch(err => console.error('Failed to send cancel notification', err));
            }

            res.json({
                success: true,
                data: { visit: updatedVisit },
                message: 'Visit cancelled'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get calendar view (visits by date range)
     */
    static async getCalendar(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate, officerId, policeStationId } = req.query;

            if (!startDate || !endDate) {
                throw new AppError('Start date and end date are required', 400);
            }

            const where: any = {
                scheduledDate: {
                    gte: new Date(String(startDate)),
                    lte: new Date(String(endDate))
                }
            };

            if (officerId) where.officerId = String(officerId);
            if (policeStationId) where.policeStationId = String(policeStationId);

            const visits = await prisma.visit.findMany({
                where,
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            vulnerabilityLevel: true
                        }
                    },
                    officer: {
                        select: {
                            id: true,
                            name: true,
                            rank: true
                        }
                    }
                },
                orderBy: { scheduledDate: 'asc' }
            });

            // Group by date
            const calendar: Record<string, any[]> = {};
            visits.forEach(visit => {
                const dateKey = visit.scheduledDate.toISOString().split('T')[0];
                if (!calendar[dateKey]) {
                    calendar[dateKey] = [];
                }
                calendar[dateKey].push(visit);
            });

            res.json({
                success: true,
                data: { calendar, visits }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get visit statistics
     */
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            // const { policeStationId, officerId, startDate, endDate } = req.query;

            const where = buildWhereClause(req.query, {
                exactMatchFields: ['policeStationId', 'officerId'],
                dateRangeField: 'scheduledDate'
            });

            const [
                total,
                scheduled,
                inProgress,
                completed,
                cancelled,
                routine,
                emergency,
                followUp
            ] = await Promise.all([
                prisma.visit.count({ where }),
                prisma.visit.count({ where: { ...where, status: 'Scheduled' } }),
                prisma.visit.count({ where: { ...where, status: 'In Progress' } }),
                prisma.visit.count({ where: { ...where, status: 'Completed' } }),
                prisma.visit.count({ where: { ...where, status: 'Cancelled' } }),
                prisma.visit.count({ where: { ...where, visitType: 'Routine' } }),
                prisma.visit.count({ where: { ...where, visitType: 'Emergency' } }),
                prisma.visit.count({ where: { ...where, visitType: 'Follow-up' } })
            ]);

            res.json({
                success: true,
                data: {
                    total,
                    byStatus: {
                        scheduled,
                        inProgress,
                        completed,
                        cancelled
                    },
                    byType: {
                        routine,
                        emergency,
                        followUp
                    },
                    completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
