"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationStatistics = exports.getVerificationRequests = exports.updateVerificationStatus = exports.assignVerificationRequest = exports.createVerificationRequest = void 0;
const database_1 = require("../config/database");
const notificationService_1 = require("./notificationService");
const logger_1 = require("../config/logger");
/**
 * Create a verification request
 */
const createVerificationRequest = async (data) => {
    const request = await database_1.prisma.verificationRequest.create({
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
    logger_1.auditLogger.info('Verification request created', {
        requestId: request.id,
        entityType: request.entityType,
        entityId: request.entityId,
        citizenId: request.seniorCitizenId,
        requestedBy: request.requestedBy
    });
    // Notify relevant parties
    await notificationService_1.NotificationService.sendVerificationRequestNotification(request.seniorCitizen.fullName, request.seniorCitizen.mobileNumber, request.entityType);
    // Auto-assign to Beat Officer if possible
    try {
        const citizen = await database_1.prisma.seniorCitizen.findUnique({
            where: { id: data.seniorCitizenId }
        });
        if (citizen && citizen.policeStationId) {
            // 1. Get all active officers at the police station
            const officers = await database_1.prisma.beatOfficer.findMany({
                where: {
                    policeStationId: citizen.policeStationId,
                    isActive: true
                },
                select: { id: true, name: true, beatId: true, badgeNumber: true }
            });
            if (officers.length === 0) {
                console.log(`No officers found for auto-assignment in Station: ${citizen.policeStationId}`);
                return request;
            }
            // 2. Calculate workload for each officer (pending + in-progress visits)
            const officersWithWorkload = await Promise.all(officers.map(async (officer) => {
                const workload = await database_1.prisma.visit.count({
                    where: {
                        officerId: officer.id,
                        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
                    }
                });
                return { ...officer, workload };
            }));
            // 3. Select officer with load balancing
            let selectedOfficer;
            // Prefer officers in the same beat (if citizen has beatId)
            if (citizen.beatId) {
                const beatOfficers = officersWithWorkload.filter(o => o.beatId === citizen.beatId);
                if (beatOfficers.length > 0) {
                    // Pick officer with least workload in the beat
                    selectedOfficer = beatOfficers.reduce((min, officer) => officer.workload < min.workload ? officer : min);
                    console.log(`Selected beat officer ${selectedOfficer.name} (${selectedOfficer.badgeNumber}) with workload: ${selectedOfficer.workload} visits`);
                }
            }
            // Fallback: Pick officer with least workload in the entire station
            if (!selectedOfficer) {
                selectedOfficer = officersWithWorkload.reduce((min, officer) => officer.workload < min.workload ? officer : min);
                console.log(`Selected station officer ${selectedOfficer.name} (${selectedOfficer.badgeNumber}) with workload: ${selectedOfficer.workload} visits`);
            }
            // 4. Assign to selected officer
            console.log(`Auto-assigning verification request ${request.id} to officer ${selectedOfficer.id} (${selectedOfficer.name})`);
            await (0, exports.assignVerificationRequest)(request.id, selectedOfficer.id);
            // Update the local request object to reflect assignment status for return
            request.assignedTo = selectedOfficer.id;
            request.status = 'IN_PROGRESS';
        }
    }
    catch (err) {
        console.error('Failed to auto-assign verification request:', err);
        // Continue, do not fail the request creation
    }
    return request;
};
exports.createVerificationRequest = createVerificationRequest;
/**
 * Assign verification request to an officer
 */
const assignVerificationRequest = async (requestId, officerId) => {
    // 1. Update the request status
    const request = await database_1.prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
            assignedTo: officerId,
            assignedAt: new Date(),
            status: 'IN_PROGRESS'
        },
        include: { seniorCitizen: true }
    });
    logger_1.auditLogger.info('Verification request assigned', {
        requestId,
        assignedTo: officerId
    });
    // 2. Create the corresponding Visit entity (Workflow Phase 2)
    try {
        const citizen = request.seniorCitizen;
        // Fetch officer to get station/beat if citizen doesn't have it (fallback)
        const officer = await database_1.prisma.beatOfficer.findUnique({ where: { id: officerId } });
        if (officer) {
            const visit = await database_1.prisma.visit.create({
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
            logger_1.auditLogger.info('Verification Visit created for request', {
                requestId,
                visitId: visit.id
            });
            // Notify Officer? (NotificationService likely handles Visit creation alerts)
            if (officer.mobileNumber) {
                notificationService_1.NotificationService.sendOfficerTaskAssignment(officer.mobileNumber, citizen.fullName, visit.visitType, visit.scheduledDate).catch(err => console.error("Failed to notify officer", err));
            }
        }
    }
    catch (error) {
        console.error('Failed to create Visit for Verification Request:', error);
        // We do not roll back the assignment, but log the error.
        // In a strict transactional system we implies using $transaction, but this service function is often called standalone.
    }
    return request;
};
exports.assignVerificationRequest = assignVerificationRequest;
/**
 * Update verification status
 */
const updateVerificationStatus = async (requestId, updateData) => {
    const request = await database_1.prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: {
            seniorCitizen: true
        }
    });
    if (!request) {
        throw new Error('Verification request not found');
    }
    // Update the verification request
    const updated = await database_1.prisma.verificationRequest.update({
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
            await database_1.prisma.householdHelp.update({
                where: { id: request.entityId },
                data: { verificationStatus: entityStatus }
            });
        }
        else if (request.entityType === 'EmergencyContact') {
            await database_1.prisma.emergencyContact.update({
                where: { id: request.entityId },
                data: {
                    verificationStatus: entityStatus,
                    verifiedAt: updateData.status === 'APPROVED' ? new Date() : undefined
                }
            });
        }
        else if (request.entityType === 'SeniorCitizen') {
            await database_1.prisma.seniorCitizen.update({
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
    logger_1.auditLogger.info('Verification status updated', {
        requestId,
        status: updateData.status,
        verifiedBy: updateData.verifiedBy,
        entityType: request.entityType,
        entityId: request.entityId
    });
    // Notify citizen of verification outcome
    if (updateData.status === 'APPROVED' || updateData.status === 'REJECTED') {
        await notificationService_1.NotificationService.sendVerificationOutcomeNotification(request.seniorCitizen.fullName, request.seniorCitizen.mobileNumber, request.entityType, updateData.status);
    }
    return updated;
};
exports.updateVerificationStatus = updateVerificationStatus;
/**
 * Get verification requests with filters
 */
const getVerificationRequests = async (filters) => {
    return await database_1.prisma.verificationRequest.findMany({
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
exports.getVerificationRequests = getVerificationRequests;
/**
 * Get verification statistics
 */
const getVerificationStatistics = async (filters) => {
    const where = {
        entityType: filters?.entityType,
        assignedTo: filters?.assignedTo
    };
    const [total, pending, inProgress, approved, rejected] = await Promise.all([
        database_1.prisma.verificationRequest.count({ where }),
        database_1.prisma.verificationRequest.count({ where: { ...where, status: 'PENDING' } }),
        database_1.prisma.verificationRequest.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        database_1.prisma.verificationRequest.count({ where: { ...where, status: 'APPROVED' } }),
        database_1.prisma.verificationRequest.count({ where: { ...where, status: 'REJECTED' } })
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
exports.getVerificationStatistics = getVerificationStatistics;
//# sourceMappingURL=verificationService.js.map