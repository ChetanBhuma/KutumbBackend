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

    // Auto-assign to Beat Officer if possible
    try {
        const citizen = await prisma.seniorCitizen.findUnique({
            where: { id: data.seniorCitizenId }
        });

        if (citizen && citizen.policeStationId) {
            // 1. Get all active officers at the police station
            // IMPORTANT: Only assign to officers who are explicitly mapped to this police station AND have a beat assignment
            const officers = await prisma.beatOfficer.findMany({
                where: {
                    policeStationId: citizen.policeStationId, // Must match citizen's police station
                    isActive: true,
                    // Exclude officers without a police station assignment (higher-rank officers)
                    NOT: {
                        OR: [
                            { policeStationId: null },
                            { beatId: null }  // NEW: Only officers with beat assignments
                        ]
                    }
                },
                select: { id: true, name: true, beatId: true, badgeNumber: true, policeStationId: true }
            });

            if (officers.length === 0) {
                auditLogger.warn('Auto-assignment skipped: No active beat officers found at police station', {
                    requestId: request.id,
                    citizenId: citizen.id,
                    citizenName: citizen.fullName,
                    policeStationId: citizen.policeStationId,
                    beatId: citizen.beatId,
                    reason: 'NO_ACTIVE_BEAT_OFFICERS_AT_STATION'
                });
                return request;
            }

            // 2. Calculate workload for each officer (pending + in-progress visits)
            const officersWithWorkload = await Promise.all(
                officers.map(async (officer) => {
                    const workload = await prisma.visit.count({
                        where: {
                            officerId: officer.id,
                            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
                        }
                    });
                    return { ...officer, workload };
                })
            );

            // 3. Select officer with load balancing
            let selectedOfficer;

            // Prefer officers in the same beat (if citizen has beatId)
            if (citizen.beatId) {
                const beatOfficers = officersWithWorkload.filter(
                    o => o.beatId === citizen.beatId
                );

                if (beatOfficers.length > 0) {
                    // Pick officer with least workload in the beat
                    selectedOfficer = beatOfficers.reduce((min, officer) =>
                        officer.workload < min.workload ? officer : min
                    );

                }
            }

            // Fallback: Pick officer with least workload in the entire station
            if (!selectedOfficer) {
                selectedOfficer = officersWithWorkload.reduce((min, officer) =>
                    officer.workload < min.workload ? officer : min
                );

            }

            // 4. Assign to selected officer
            console.log(`Auto-assigning verification request ${request.id} to officer ${selectedOfficer.id} (${selectedOfficer.name})`);
            await assignVerificationRequest(request.id, selectedOfficer.id);

            // Update the local request object to reflect assignment status for return
            (request as any).assignedTo = selectedOfficer.id;
            (request as any).status = 'IN_PROGRESS';
        }
    } catch (err) {
        console.error('Failed to auto-assign verification request:', err);
        // Continue, do not fail the request creation
    }

    return request;
};

/**
 * Assign verification request to an officer
 */
export const assignVerificationRequest = async (requestId: string, officerId: string) => {
    // 1. Update the request status
    const request = await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
            assignedTo: officerId,
            assignedAt: new Date(),
            status: 'IN_PROGRESS'
        },
        include: { seniorCitizen: true }
    });

    auditLogger.info('Verification request assigned', {
        requestId,
        assignedTo: officerId
    });

    // 2. Create the corresponding Visit entity (Workflow Phase 2)
    try {
        const citizen = request.seniorCitizen;
        // Fetch officer to get station/beat if citizen doesn't have it (fallback)
        const officer = await prisma.beatOfficer.findUnique({ where: { id: officerId } });

        if (officer) {
            const visit = await prisma.visit.create({
                data: {
                    seniorCitizenId: citizen.id,
                    officerId: officerId,
                    policeStationId: officer.policeStationId || '', // Use officer's station as source of truth for the visit context
                    beatId: officer.beatId || citizen.beatId,
                    visitType: 'Verification',
                    status: 'SCHEDULED',
                    scheduledDate: new Date(), // scheduled for today
                    priority: request.priority || 'Normal'
                }
            });

            auditLogger.info('Verification Visit created for request', {
                requestId,
                visitId: visit.id
            });

            // Notify Officer? (NotificationService likely handles Visit creation alerts)
            if (officer.mobileNumber) {
                 NotificationService.sendOfficerTaskAssignment(
                    officer.mobileNumber,
                    citizen.fullName,
                    visit.visitType,
                    visit.scheduledDate
                 ).catch(err => console.error("Failed to notify officer", err));
            }
        }
    } catch (error) {
        console.error('Failed to create Visit for Verification Request:', error);
        // We do not roll back the assignment, but log the error.
        // In a strict transactional system we implies using $transaction, but this service function is often called standalone.
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
 * Get verification requests with filters
 */
export const getVerificationRequests = async (filters: {
    status?: VerificationStatus;
    entityType?: VerificationEntityType;
    assignedTo?: string;
    seniorCitizenId?: string;
    priority?: VerificationPriority;
}) => {
    return await prisma.verificationRequest.findMany({
        where: {
            status: filters.status,
            entityType: filters.entityType,
            assignedTo: filters.assignedTo,
            seniorCitizenId: filters.seniorCitizenId,
            priority: filters.priority
        },
        include: {
            seniorCitizen: {
                select: {
                    id: true,
                    fullName: true,
                    mobileNumber: true,
                    permanentAddress: true
                }
            }
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' }
        ]
    });
};

/**
 * Get verification statistics
 */
export const getVerificationStatistics = async (filters?: {
    entityType?: VerificationEntityType;
    assignedTo?: string;
}) => {
    const where = {
        entityType: filters?.entityType,
        assignedTo: filters?.assignedTo
    };

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
