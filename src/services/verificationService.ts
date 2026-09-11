import { prisma } from '../config/database';
import { NotificationService } from './notificationService';
import { auditLogger } from '../config/logger';

export type VerificationEntityType = 'HouseholdHelp' | 'EmergencyContact' | 'Tenant' | 'SeniorCitizen' | 'Other';
export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
export type VerificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type VerificationMethod = 'Physical' | 'Document' | 'Phone' | 'BackgroundCheck';

export interface CreateVerificationRequestData {
    entityType: VerificationEntityType;
    entityId: string;
    seniorCitizenId: string;
    requestedBy: string;
    priority?: VerificationPriority;
    remarks?: string;
    documents?: string[];
}

export interface UpdateVerificationStatusData {
    status: VerificationStatus;
    verifiedBy?: string;
    verificationMethod?: VerificationMethod;
    verificationNotes?: string;
    rejectionReason?: string;
}

/**
 * Create a verification request
 */
export const createVerificationRequest = async (data: CreateVerificationRequestData) => {
    const request = await prisma.verificationRequest.create({
        data: {
            entityType: data.entityType,
            entityId: data.entityId,
            seniorCitizenId: data.seniorCitizenId,
            requestedBy: data.requestedBy,
            priority: data.priority || 'Normal',
            remarks: data.remarks,
            documents: data.documents || []
        },
        include: {
            seniorCitizen: {
                select: {
                    id: true,
                    fullName: true,
                    mobileNumber: true
                }
            }
        }
    });

    // Log the request
    auditLogger.info('Verification request created', {
        requestId: request.id,
        entityType: request.entityType,
        entityId: request.entityId,
        citizenId: request.seniorCitizenId,
        requestedBy: request.requestedBy
    });

    // Notify relevant parties
    await NotificationService.sendVerificationRequestNotification(
        request.seniorCitizen.fullName,
        request.seniorCitizen.mobileNumber,
        request.entityType
    );

    // Note: Auto-assignment is intentionally decoupled.
    // The Police Station SHO will assign a field officer via the SHO dashboard.
    return request;
};

/**
 * Assign verification request to an officer (invoked by SHO / Admin)
 */
export const assignVerificationRequest = async (
    requestId: string,
    officerId: string,
    options?: { scheduledDate?: Date; notes?: string; assignedBy?: string }
) => {
    const existingRequest = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: { seniorCitizen: true }
    });

    if (!existingRequest) {
        throw new Error('Verification request not found');
    }

    const citizen = existingRequest.seniorCitizen;
    const officer = await prisma.beatOfficer.findUnique({ where: { id: officerId } });

    if (!officer || !officer.isActive) {
        throw new Error('Selected officer not found or is inactive');
    }

    // STRICT VALIDATION: Ensure officer belongs to the citizen's police station
    if (citizen.policeStationId && officer.policeStationId && citizen.policeStationId !== officer.policeStationId) {
        throw new Error('Officer must belong to the same Police Station as the Senior Citizen');
    }

    // 1. Update the request status
    const request = await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
            assignedTo: officerId,
            assignedAt: new Date(),
            status: 'IN_PROGRESS',
            remarks: options?.notes ? `${existingRequest.remarks || ''}\n[SHO Note]: ${options.notes}`.trim() : existingRequest.remarks
        },
        include: { seniorCitizen: true }
    });

    auditLogger.info('Verification request assigned by SHO/Admin', {
        requestId,
        assignedTo: officerId,
        officerName: officer.name,
        policeStationId: officer.policeStationId,
        assignedBy: options?.assignedBy
    });

    // 2. Create the corresponding Visit entity
    try {
        const scheduledDate = options?.scheduledDate ? new Date(options.scheduledDate) : new Date();

        const visit = await prisma.visit.create({
            data: {
                seniorCitizenId: citizen.id,
                officerId: officerId,
                policeStationId: officer.policeStationId || citizen.policeStationId || '',
                beatId: officer.beatId || citizen.beatId,
                visitType: 'Verification',
                status: 'SCHEDULED',
                scheduledDate,
                notes: options?.notes || 'Verification visit assigned by SHO',
                priority: request.priority || 'Normal'
            }
        });

        auditLogger.info('Verification Visit created for request', {
            requestId,
            visitId: visit.id,
            officerId: officer.id
        });

        if (officer.mobileNumber) {
            NotificationService.sendOfficerTaskAssignment(
                officer.mobileNumber,
                citizen.fullName,
                visit.visitType,
                visit.scheduledDate
            ).catch(err => console.error('Failed to notify officer', err));
        }
    } catch (error) {
        console.error('Failed to create Visit for Verification Request:', error);
        throw error;
    }

    return request;
};

/**
 * Update verification status
 */
export const updateVerificationStatus = async (
    requestId: string,
    updateData: UpdateVerificationStatusData
) => {
    const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: {
            seniorCitizen: true
        }
    });

    if (!request) {
        throw new Error('Verification request not found');
    }

    // Update the verification request
    const updated = await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
            status: updateData.status,
            verifiedBy: updateData.verifiedBy,
            verifiedAt: updateData.status === 'APPROVED' || updateData.status === 'REJECTED' ? new Date() : undefined,
            verificationMethod: updateData.verificationMethod,
            verificationNotes: updateData.verificationNotes,
            rejectionReason: updateData.rejectionReason
        }
    });

    // Update the entity's verification status
    if (updateData.status === 'APPROVED' || updateData.status === 'REJECTED') {
        const entityStatus = updateData.status === 'APPROVED' ? 'Verified' : 'Rejected';

        if (request.entityType === 'HouseholdHelp') {
            await prisma.householdHelp.update({
                where: { id: request.entityId },
                data: { verificationStatus: entityStatus }
            });
        } else if (request.entityType === 'EmergencyContact') {
            await prisma.emergencyContact.update({
                where: { id: request.entityId },
                data: {
                    verificationStatus: entityStatus,
                    verifiedAt: updateData.status === 'APPROVED' ? new Date() : undefined
                }
            });
        } else if (request.entityType === 'SeniorCitizen') {
            await prisma.seniorCitizen.update({
                where: { id: request.entityId },
                data: {
                    idVerificationStatus: updateData.status === 'APPROVED' ? 'Verified' : 'Rejected',
                    status: updateData.status === 'APPROVED' ? 'Active' : 'REJECTED'
                    // NOTE: Digital card issuance is handled separately by admin approval
                    // Do NOT auto-issue cards here
                }
            });
        }
    }

    // Log the status update
    auditLogger.info('Verification status updated', {
        requestId,
        status: updateData.status,
        verifiedBy: updateData.verifiedBy,
        entityType: request.entityType,
        entityId: request.entityId
    });

    // Notify citizen of verification outcome
    if (updateData.status === 'APPROVED' || updateData.status === 'REJECTED') {
        await NotificationService.sendVerificationOutcomeNotification(
            request.seniorCitizen.fullName,
            request.seniorCitizen.mobileNumber,
            request.entityType,
            updateData.status
        );
    }

    return updated;
};

/**
 * Helper to normalize status strings to VerificationStatus enum values
 */
export const normalizeVerificationStatus = (status?: string): VerificationStatus | undefined => {
    if (!status) return undefined;
    const s = status.toUpperCase().replace('-', '_');
    if (s === 'PENDING') return 'PENDING';
    if (s === 'IN_PROGRESS' || s === 'INPROGRESS') return 'IN_PROGRESS';
    if (s === 'APPROVED') return 'APPROVED';
    if (s === 'REJECTED') return 'REJECTED';
    return undefined;
};

/**
 * Get verification requests with filters and jurisdiction scoping
 */
export const getVerificationRequests = async (filters: {
    status?: VerificationStatus | string;
    entityType?: VerificationEntityType;
    assignedTo?: string;
    seniorCitizenId?: string;
    policeStationId?: string;
    priority?: VerificationPriority;
    scope?: import('../middleware/dataScopeMiddleware').DataScope;
}) => {
    const rawStatus = filters.status ? String(filters.status).toUpperCase() : undefined;
    const normalizedStatus = normalizeVerificationStatus(filters.status);

    // Auto-heal / backfill: Ensure every citizen with idVerificationStatus='Pending' has an active VerificationRequest
    try {
        const unverifiedCitizens = await prisma.seniorCitizen.findMany({
            where: {
                idVerificationStatus: 'Pending',
                VerificationRequest: {
                    none: {
                        status: { in: ['PENDING', 'IN_PROGRESS'] }
                    }
                }
            },
            select: {
                id: true,
                fullName: true,
                policeStationId: true
            }
        });

        if (unverifiedCitizens.length > 0) {
            for (const citizen of unverifiedCitizens) {
                await prisma.verificationRequest.create({
                    data: {
                        entityType: 'SeniorCitizen',
                        entityId: citizen.id,
                        seniorCitizenId: citizen.id,
                        requestedBy: 'System',
                        priority: 'Normal',
                        status: 'PENDING',
                        remarks: 'Citizen registration verification - Awaiting SHO officer assignment'
                    }
                }).catch(err => console.error('Failed to auto-create verification request for citizen', citizen.id, err));
            }
        }
    } catch (e) {
        console.error('Error auto-syncing unverified citizens to VerificationRequests:', e);
    }

    const where: any = {
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
        ...(filters.seniorCitizenId ? { seniorCitizenId: filters.seniorCitizenId } : {}),
        ...(filters.priority ? { priority: filters.priority } : {})
    };

    // If querying 'Pending' or 'PENDING', return both PENDING and IN_PROGRESS requests (the active workbench queue)
    if (rawStatus === 'PENDING' || rawStatus === 'PENDING_ALL') {
        where.status = { in: ['PENDING', 'IN_PROGRESS'] };
    } else if (normalizedStatus) {
        where.status = normalizedStatus;
    }

    const scope = filters.scope;
    if (scope && scope.level !== 'ALL') {
        where.seniorCitizen = where.seniorCitizen || {};
        if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
            where.seniorCitizen.rangeId = scope.jurisdictionIds.rangeId;
        } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
            where.seniorCitizen.districtId = scope.jurisdictionIds.districtId;
        } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
            where.seniorCitizen.subDivisionId = scope.jurisdictionIds.subDivisionId;
        } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
            where.seniorCitizen.policeStationId = scope.jurisdictionIds.policeStationId;
        } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
            where.seniorCitizen.beatId = scope.jurisdictionIds.beatId;
        }
    }

    if (filters.policeStationId) {
        where.seniorCitizen = {
            ...(where.seniorCitizen || {}),
            policeStationId: String(filters.policeStationId)
        };
    }

    return await prisma.verificationRequest.findMany({
        where,
        include: {
            seniorCitizen: {
                select: {
                    id: true,
                    fullName: true,
                    mobileNumber: true,
                    permanentAddress: true,
                    idVerificationStatus: true,
                    vulnerabilityLevel: true,
                    policeStationId: true,
                    PoliceStation: {
                        select: { name: true }
                    },
                    Beat: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    });
};

/**
 * Get verification statistics
 */
export const getVerificationStatistics = async (filters?: {
    entityType?: VerificationEntityType;
    assignedTo?: string;
    scope?: import('../middleware/dataScopeMiddleware').DataScope;
}) => {
    const where: any = {
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(filters?.assignedTo ? { assignedTo: filters.assignedTo } : {})
    };

    const scope = filters?.scope;
    if (scope && scope.level !== 'ALL') {
        if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
            where.seniorCitizen = { rangeId: scope.jurisdictionIds.rangeId };
        } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
            where.seniorCitizen = { districtId: scope.jurisdictionIds.districtId };
        } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
            where.seniorCitizen = { subDivisionId: scope.jurisdictionIds.subDivisionId };
        } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
            where.seniorCitizen = { policeStationId: scope.jurisdictionIds.policeStationId };
        } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
            where.seniorCitizen = { beatId: scope.jurisdictionIds.beatId };
        }
    }

    const [total, pending, inProgress, approved, rejected] = await Promise.all([
        prisma.verificationRequest.count({ where }),
        prisma.verificationRequest.count({ where: { ...where, status: 'PENDING' } }),
        prisma.verificationRequest.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.verificationRequest.count({ where: { ...where, status: 'APPROVED' } }),
        prisma.verificationRequest.count({ where: { ...where, status: 'REJECTED' } })
    ]);

    return {
        total,
        byStatus: {
            pending,
            inProgress,
            approved,
            rejected
        },
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
    };
};
