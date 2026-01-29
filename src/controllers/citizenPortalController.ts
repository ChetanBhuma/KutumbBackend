import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { paginatedQuery } from '../utils/pagination';
import { buildWhereClause, buildOrderBy } from '../utils/queryBuilder';
import { NotificationService } from '../services/notificationService';
import * as citizenAuthService from '../services/citizenAuthService';
import { TokenService } from '../services/tokenService';
import * as VerificationService from '../services/verificationService';
import { validateWorkflowTransition } from '../utils/workflowValidator';
import { Permission } from '../types/auth';

const db = prisma as any;

const calculateAge = (dateOfBirth: string | Date) => {
    const dob = new Date(dateOfBirth);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

type TimelineStatus = 'completed' | 'pending' | 'blocked';

interface TimelineEntry {
    key: string;
    title: string;
    description?: string;
    status: TimelineStatus;
    timestamp?: Date | string | null;
    metadata?: Record<string, any>;
}

const isVerificationType = (value?: string | null) => {
    return value ? value.toLowerCase().includes('verification') : false;
};

const visitTimelineStatus = (status?: string | null): TimelineStatus => {
    const normalizedStatus = status ? status.toUpperCase() : '';
    switch (normalizedStatus) {
        case 'COMPLETED':
            return 'completed';
        case 'CANCELLED':
            return 'blocked';
        case 'SCHEDULED':
        case 'IN_PROGRESS':
        default:
            return 'pending';
    }
};

const decisionTimelineStatus = (status: string): TimelineStatus => {
    switch (status) {
        case 'APPROVED':
            return 'completed';
        case 'REJECTED':
            return 'blocked';
        default:
            return 'pending';
    }
};

const buildRegistrationTimeline = (
    registration: any,
    verificationRequest?: any,
    verificationVisit?: any
): TimelineEntry[] => {
    const timeline: TimelineEntry[] = [];
    const draftData = (registration.draftData as Record<string, any> | null) ?? {};

    timeline.push({
        key: 'registration-started',
        title: 'Registration started',
        description: 'Citizen initiated registration via the self-service portal',
        status: 'completed',
        timestamp: registration.createdAt,
        metadata: { mobileNumber: registration.mobileNumber }
    });

    timeline.push({
        key: 'otp-verification',
        title: 'Mobile OTP verification',
        description: registration.otpVerified ? 'OTP verified successfully' : 'Awaiting OTP verification',
        status: registration.otpVerified ? 'completed' : 'pending',
        timestamp: registration.otpVerified ? (draftData?.otpVerifiedAt ? new Date(draftData.otpVerifiedAt) : registration.updatedAt) : null
    });

    const submissionCompleted = registration.registrationStep === 'COMPLETED' || registration.status !== 'IN_PROGRESS';
    timeline.push({
        key: 'form-submitted',
        title: 'Registration data submitted',
        description: submissionCompleted ? 'All steps completed by the citizen' : 'Citizen is still filling in details',
        status: submissionCompleted ? 'completed' : 'pending',
        timestamp: submissionCompleted ? registration.updatedAt : null
    });

    if (registration.citizenId) {
        timeline.push({
            key: 'citizen-record',
            title: 'Citizen record created',
            description: 'Draft profile created in master registry',
            status: 'completed',
            timestamp: registration.updatedAt,
            metadata: { citizenId: registration.citizenId }
        });
    }

    if (verificationRequest) {
        // Handle both VisitRequest (legacy) and VerificationRequest (new)
        const isLegacy = !verificationRequest.entityType;
        const status = isLegacy ? verificationRequest.status : verificationRequest.status;

        timeline.push({
            key: 'verification-request',
            title: 'Verification visit requested',
            description: `Verification request is ${status}`,
            status: visitTimelineStatus(status),
            timestamp: verificationRequest.createdAt,
            metadata: {
                visitType: isLegacy ? verificationRequest.visitType : 'Verification',
                preferredDate: isLegacy ? verificationRequest.preferredDate : null,
                notes: verificationRequest.remarks || verificationRequest.notes
            }
        });
    }

    if (verificationVisit) {
        timeline.push({
            key: 'verification-visit',
            title: 'Verification visit',
            description: verificationVisit.status === 'Completed'
                ? 'Officer completed verification visit'
                : `Visit is ${verificationVisit.status}`,
            status: visitTimelineStatus(verificationVisit.status),
            timestamp: verificationVisit.completedDate ?? verificationVisit.scheduledDate,
            metadata: {
                visitId: verificationVisit.id,
                officerId: verificationVisit.officerId,
                scheduledDate: verificationVisit.scheduledDate,
                completedDate: verificationVisit.completedDate
            }
        });
    }

    timeline.push({
        key: 'admin-decision',
        title: 'Admin review',
        description: registration.status === 'PENDING_REVIEW'
            ? 'Awaiting verification outcome'
            : `Registration ${registration.status.toLowerCase()}`,
        status: decisionTimelineStatus(registration.status),
        timestamp: registration.status === 'APPROVED' || registration.status === 'REJECTED' ? registration.updatedAt : null
    });

    return timeline;
};

const buildVerificationSummary = (
    registration: { citizenId?: string | null },
    verificationRequest?: any,
    verificationVisit?: any
) => {
    const requestStatus = verificationRequest?.status ?? 'Missing';
    const visitStatus = verificationVisit?.status ?? null;
    const hasCompletedVisit =
        (verificationVisit && verificationVisit.status === 'COMPLETED') ||
        (verificationRequest && verificationRequest.status === 'COMPLETED');

    return {
        citizenId: registration.citizenId,
        requestId: verificationRequest?.id ?? null,
        requestStatus,
        requestCreatedAt: verificationRequest?.createdAt ?? null,
        preferredDate: verificationRequest?.preferredDate ?? null,
        visitId: verificationVisit?.id ?? null,
        visitStatus,
        scheduledDate: verificationVisit?.scheduledDate ?? verificationRequest?.preferredDate ?? null,
        completedDate: verificationVisit?.completedDate ?? null,
        assignedOfficer: verificationVisit?.officer
            ? {
                id: verificationVisit.officer.id,
                name: verificationVisit.officer.name,
                rank: verificationVisit.officer.rank,
                badgeNumber: verificationVisit.officer.badgeNumber
            }
            : null,
        notes: verificationVisit?.notes ?? verificationRequest?.notes ?? null,
        allowApproval: Boolean(hasCompletedVisit),
        blockingReason: hasCompletedVisit ? null : 'Verification visit must be completed before approval.'
    };
};

const hasCompletedVerification = async (registrationId: string, citizenId?: string | null) => {
    const whereOr: any[] = [{ registrationId }];
    if (citizenId) {
        whereOr.push({ seniorCitizenId: citizenId });
    }

    const verificationRequest = await db.visitRequest.findFirst({
        where: {
            OR: whereOr,
            status: 'Resolved',
            visitType: { equals: 'Verification', mode: 'insensitive' }
        }
    });

    if (verificationRequest) {
        return true;
    }

    if (!citizenId) {
        return false;
    }

    const verificationVisit = await db.visit.findFirst({
        where: {
            seniorCitizenId: citizenId,
            status: 'COMPLETED',
            visitType: { equals: 'Verification', mode: 'insensitive' }
        }
    });

    return Boolean(verificationVisit);
};

const formatMobile = (mobile: string) => {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    // If 10 digits, add +91
    if (digits.length === 10) return `+91${digits}`;
    // If 12 digits (91...), add +
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    // Return original if unknown (let validation handle it)
    return mobile;
};

export class CitizenPortalController {
    /**
     * Start a new citizen registration (mobile + basic info)
     */
    static async startRegistration(req: Request, res: Response, next: NextFunction) {
        try {
            const { fullName, dateOfBirth } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);

            if (!mobileNumber) {
                throw new AppError('Mobile number is required', 400);
            }

            // Request OTP via Auth Service
            const otpResult = await citizenAuthService.requestOTP(mobileNumber, false);
            if (!otpResult.success) {
                throw new AppError(otpResult.message, 400);
            }

            const existing = await db.citizenRegistration.findUnique({
                where: { mobileNumber }
            });

            if (existing) {
                const updated = await db.citizenRegistration.update({
                    where: { id: existing.id },
                    data: {
                        fullName: fullName ?? existing.fullName,
                        status: existing.status === 'REJECTED' ? 'IN_PROGRESS' : existing.status,
                        draftData: {
                            ...(existing.draftData as Record<string, any> | null ?? {}),
                            dateOfBirth: dateOfBirth ?? (existing.draftData as any)?.dateOfBirth
                        }
                    }
                });

                res.json({
                    success: true,
                    data: {
                        registration: updated,
                        message: otpResult.message,
                        expiresAt: otpResult.expiresAt,
                        otp: otpResult.otp // Expose OTP for debugging
                    }
                });
                return;
            }

            const registration = await db.citizenRegistration.create({
                data: {
                    mobileNumber,
                    fullName,
                    draftData: { dateOfBirth }
                }
            });

            // Ensure CitizenAuth exists
            await db.citizenAuth.upsert({
                where: { mobileNumber },
                create: {
                    mobileNumber,
                    password: '', // No password initially
                    isVerified: false
                },
                update: {}
            });

            res.status(201).json({
                success: true,
                data: {
                    registration,
                    message: otpResult.message,
                    expiresAt: otpResult.expiresAt,
                    otp: otpResult.otp // Expose OTP for debugging
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify OTP and finalize simple registration
     */
    static async verifyOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { otp } = req.body;

            const registration = await db.citizenRegistration.findUnique({
                where: { id }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            // Verify OTP Logic
            const otpResult = await citizenAuthService.verifyOTP(registration.mobileNumber, otp);
            if (!otpResult.success) {
                throw new AppError(otpResult.message, 400);
            }

            // Mark registration as verified
            await db.citizenRegistration.update({
                where: { id },
                data: {
                    otpVerified: true,
                    registrationStep: 'OTP_VERIFIED'
                }
            });

            // Link to registration if exists
            // Link to registration if exists, or CREATE if new registration
            let citizen = await db.seniorCitizen.findFirst({
                where: { mobileNumber: registration.mobileNumber }
            });

            if (!citizen) {
                // Create new Senior Citizen profile for this registration
                const dob = (registration.draftData as any)?.dateOfBirth ? new Date((registration.draftData as any).dateOfBirth) : null;
                citizen = await db.seniorCitizen.create({
                    data: {
                        mobileNumber: registration.mobileNumber,
                        fullName: registration.fullName || '',
                        dateOfBirth: dob || new Date(), // Fallback if DOB missing
                        age: dob ? calculateAge(dob.toISOString()) : 0,
                        gender: 'Unknown', // Required field
                        permanentAddress: 'Pending Update', // Required field
                        pinCode: '000000', // Required field
                        status: 'IN_PROGRESS'
                    }
                });
            }

            // Always Link to registration
            await db.citizenRegistration.update({
                where: { id },
                data: { citizenId: citizen.id }
            });

            // Get Auth Record
            const auth = await db.citizenAuth.findUnique({
                where: { mobileNumber: registration.mobileNumber }
            });

            if (auth) {
                // Link Citizen to Auth if not linked and citizen exists
                if (!auth.citizenId && citizen) {
                    await db.citizenAuth.update({
                        where: { id: auth.id },
                        data: { citizenId: citizen.id }
                    });
                }

                // Generate Tokens using TokenService for consistency
                const tokenPayload = {
                    userId: auth.id,
                    email: auth.mobileNumber,
                    role: 'CITIZEN' as any,
                    citizenId: citizen?.id
                };

                const { accessToken, refreshToken } = TokenService.generateTokenPair(tokenPayload);

                // Update Auth with Token info
                await db.citizenAuth.update({
                    where: { id: auth.id },
                    data: {
                        lastLoginAt: new Date(),
                        refreshToken,
                        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                });

                res.json({
                    success: true,
                    message: 'Verification successful',
                    data: {
                        accessToken,
                        refreshToken,
                        citizen,
                        registrationId: registration.id
                    }
                });
            } else {
                throw new AppError('Auth record not found', 500);
            }

        } catch (error) {
            next(error);
        }
    }

    /**
     * Save incremental registration step data (wizard progress)
     */
    static async saveRegistrationStep(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { step, data, status, otpVerified } = req.body;

            const registration = await db.citizenRegistration.findUnique({
                where: { id }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            const mergedDraft = {
                ...(registration.draftData as Record<string, any> | null ?? {}),
                ...(data || {})
            };

            // VALIDATE STATUS TRANSITION
            if (status && status !== registration.status) {
                await validateWorkflowTransition(registration.status, status, registration.citizenId);
            }

            const updated = await db.citizenRegistration.update({
                where: { id },
                data: {
                    registrationStep: step || registration.registrationStep,
                    // status: status || registration.status, // DEPRECATED: Status updates via this endpoint are risky
                    // Explicitly validate if status is changing
                    status: status || registration.status,
                    draftData: mergedDraft,
                    otpVerified: typeof otpVerified === 'boolean' ? otpVerified : registration.otpVerified
                }
            });

            res.json({
                success: true,
                data: { registration: updated }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Fetch registration details by ID (for citizen self-service)
     * Public endpoint - Returns only status/basic info
     */
    static async getRegistration(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // SECURITY: Do not allow sensitive details on public endpoint
            // const includeDetails = req.query.include === 'details';

            const registration = await db.citizenRegistration.findUnique({
                where: { id },
                select: {
                    id: true,
                    mobileNumber: true,
                    fullName: true,
                    status: true,
                    registrationStep: true,
                    otpVerified: true,
                    citizenId: true,
                    updatedAt: true
                }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            res.json({
                success: true,
                data: { registration }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Detailed view for admin inbox with timeline + linked entities
     * Secured: Requires Admin/Officer permission OR Ownership
     */
    static async getRegistrationDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const user = req.user;

            const registration = await db.citizenRegistration.findUnique({
                where: { id },
                include: {
                    visitRequests: {
                        orderBy: { createdAt: 'desc' }
                    },
                    citizen: {
                        include: {
                            PoliceStation: { select: { id: true, name: true, code: true } },
                            Beat: { select: { id: true, name: true, code: true } },
                            SpouseDetails: true,
                            FamilyMember: true,
                            EmergencyContact: true,
                            HouseholdHelp: true,
                            Document: { orderBy: { uploadedAt: 'desc' }, take: 25 },
                            ServiceRequest: { orderBy: { createdAt: 'desc' }, take: 10 },
                            SOSAlert: { orderBy: { createdAt: 'desc' }, take: 10 },
                            Visit: {
                                include: {
                                    officer: { select: { id: true, name: true, rank: true, badgeNumber: true } }
                                },
                                orderBy: { scheduledDate: 'desc' },
                                take: 10
                            },
                            VerificationRequest: {
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            }
                        }
                    }
                }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            // Access Control
            // Check implicit roles
            const isOfficerRole = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICER';
            // Check dynamic permissions (e.g. for custom roles like ACP/DCP)
            const hasReadPermission = user?.permissions?.includes(Permission.CITIZENS_READ);

            const isAuthorized = isOfficerRole || hasReadPermission;

            // Check ownership: Match citizenId OR mobileNumber (if Auth user is linked to same mobile)
            const isOwner = (user?.citizenId && registration.citizenId === user.citizenId) ||
                (user?.email && registration.mobileNumber === user.email);

            if (!isAuthorized && !isOwner) {
                throw new AppError('Unauthorized access to registration details', 403);
            }

            // Hybrid approach: Look for VerificationRequest OR VisitRequest
            const verificationRequest =
                registration.citizen?.VerificationRequest?.[0] ??
                registration.visitRequests.find((req: any) => isVerificationType(req.visitType)) ??
                registration.visitRequests[0];

            // Fix: Access Visit (Capitalized) and handle null citizen
            // @ts-ignore
            const citizenVisits = registration.citizen?.Visit || [];
            const verificationVisit = citizenVisits.find((visit: any) => isVerificationType(visit.visitType)) ?? null;

            const timeline = buildRegistrationTimeline(registration, verificationRequest, verificationVisit ?? undefined);

            const verificationSummary = buildVerificationSummary(registration, verificationRequest, verificationVisit ?? undefined);

            res.json({
                success: true,
                data: {
                    registration,
                    timeline,
                    verificationSummary,
                    reviewGuard: {
                        allowApproval: verificationSummary.allowApproval,
                        blockingReason: verificationSummary.blockingReason
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Finalize registration and create the citizen record
     */
    /**
     * Finalize registration and update the citizen record
     */
    static async submitRegistration(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { citizenData } = req.body;

            if (!citizenData) {
                throw new AppError('Citizen data is required', 400);
            }

            const registration = await db.citizenRegistration.findUnique({
                where: { id }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            if (!registration.otpVerified) {
                throw new AppError('OTP verification pending', 400);
            }

            const citizenId = registration.citizenId;
            if (!citizenId) {
                throw new AppError('Citizen profile not linked. Verify OTP first.', 400);
            }

            // VALIDATE WORKFLOW TRANSITION
            await validateWorkflowTransition(registration.status, 'PENDING_REVIEW', citizenId);

            // Assign default police station logic if missing
            let assignedPoliceStationId = citizenData.policeStationId;
            let assignedBeatId = citizenData.beatId;

            // Update Senior Citizen Profile with ALL new fields
            const citizen = await db.seniorCitizen.update({
                where: { id: citizenId },
                data: {
                    fullName: citizenData.fullName,
                    dateOfBirth: new Date(citizenData.dateOfBirth),
                    age: calculateAge(citizenData.dateOfBirth),
                    gender: citizenData.gender,
                    mobileNumber: citizenData.mobileNumber,
                    email: citizenData.email,
                    permanentAddress: citizenData.address, // Mapped from 'address'
                    presentAddress: citizenData.address,   // Assuming same for now
                    addressLine1: citizenData.addressLine1,
                    addressLine2: citizenData.addressLine2,

                    // Relations using CONNECT strategy
                    District: citizenData.districtId ? { connect: { id: citizenData.districtId } } : undefined,
                    PoliceStation: assignedPoliceStationId ? { connect: { id: assignedPoliceStationId } } : undefined,
                    Beat: assignedBeatId ? { connect: { id: assignedBeatId } } : undefined,

                    religion: citizenData.religion,
                    pinCode: citizenData.pincode, // Capture explicit pincode

                    // New Fields
                    telephoneNumber: citizenData.telephoneNumber,
                    specialization: citizenData.specialization,
                    retiredFrom: citizenData.retiredFrom,
                    yearOfRetirement: citizenData.yearOfRetirement ? parseInt(citizenData.yearOfRetirement) : null,
                    residingWith: citizenData.residingWith,
                    freeTime: citizenData.freeTime,
                    lastVisitDate: citizenData.lastVisitDate ? new Date(citizenData.lastVisitDate) : null,
                    aadhaarNumber: citizenData.aadhaarNumber,
                    numberOfChildren: citizenData.numberOfChildren ? parseInt(citizenData.numberOfChildren) : 0,
                    familyType: citizenData.familyType,
                    addressProofUrl: citizenData.addressProofUrl,
                    gpsLatitude: citizenData.gpsLatitude,
                    gpsLongitude: citizenData.gpsLongitude,

                    // Status updates (SeniorCitizen model does NOT have registrationStep)
                    status: 'PENDING_REVIEW',
                    submissionType: 'Self-Service',
                    updatedAt: new Date()
                }
            });

            // Update Spouse Details
            if (citizenData.spouseName) {
                await db.spouseDetails.upsert({
                    where: { seniorCitizenId: citizen.id },
                    create: {
                        seniorCitizenId: citizen.id,
                        fullName: citizenData.spouseName,
                        dateOfBirth: citizenData.spouseDob ? new Date(citizenData.spouseDob) : null,
                        weddingDate: citizenData.spouseWeddingDate ? new Date(citizenData.spouseWeddingDate) : null,
                        isLivingTogether: citizenData.residingWith !== 'Alone'
                    },
                    update: {
                        fullName: citizenData.spouseName,
                        dateOfBirth: citizenData.spouseDob ? new Date(citizenData.spouseDob) : undefined,
                        weddingDate: citizenData.spouseWeddingDate ? new Date(citizenData.spouseWeddingDate) : undefined,
                        isLivingTogether: citizenData.residingWith !== 'Alone'
                    }
                });
            }

            // Update Household Help / Staff (Replaces previous entries)
            if (Array.isArray(citizenData.staffDetails)) {
                await db.householdHelp.deleteMany({
                    where: { seniorCitizenId: citizen.id }
                });

                for (const staff of citizenData.staffDetails) {
                    if (staff.employmentType !== 'None') {
                        await db.householdHelp.create({
                            data: {
                                seniorCitizenId: citizen.id,
                                staffType: staff.staffType,
                                employmentType: staff.employmentType,
                                name: staff.name,
                                mobileNumber: staff.mobileNumber,
                                idProofType: staff.govtIdType,
                                idProofUrl: staff.govtIdUrl,
                                verificationStatus: 'Not Verified'
                            }
                        });
                    }
                }
            }

            // Human/Friends/Relatives -> Map to FamilyMember
            // Human/Friends/Relatives -> Map to EmergencyContact (Primary)
            if (citizenData.relativeName && citizenData.contactNo) {
                 await db.emergencyContact.create({
                    data: {
                        seniorCitizenId: citizen.id,
                        name: citizenData.relativeName,
                        relation: citizenData.relation || 'Relative',
                        mobileNumber: citizenData.contactNo,
                        isPrimary: true
                    }
                 });
            }

            // Handle Health Condition
            if (citizenData.healthCondition) {
                 await db.seniorCitizen.update({
                    where: { id: citizen.id },
                    data: {
                        healthConditions: [citizenData.healthCondition]
                    }
                 });
            }

            // Finalize Registration Record
            const updatedRegistration = await db.citizenRegistration.update({
                where: { id },
                data: {
                    status: 'PENDING_REVIEW',
                    registrationStep: 'COMPLETED',
                    draftData: {}
                }
            });

            // Ensure Auth is linked
            await db.citizenAuth.update({
                where: { mobileNumber: registration.mobileNumber },
                data: { citizenId: citizen.id }
            });

            // Create Verification Request using robust service (handles auto-assignment)
            await VerificationService.createVerificationRequest({
                entityType: 'SeniorCitizen',
                entityId: citizen.id,
                seniorCitizenId: citizen.id,
                requestedBy: citizen.id,
                priority: 'High',
                remarks: 'Initial Registration Verification',
                documents: []
            });

            // NOTE: VerificationService handles Visit creation automatically if officer is found

            // Send notification
            if (citizen.mobileNumber) {
                NotificationService.sendRegistrationConfirmation(
                    citizen.mobileNumber,
                    null,
                    citizen.fullName
                ).catch((err: any) => console.error('Failed to send registration notification', err));
            }

            res.json({
                success: true,
                message: 'Registration submitted successfully. Check status for updates.',
                data: {
                    citizenId: citizen.id,
                    registration: updatedRegistration
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Admin inbox: list citizen registrations
     */
    static async listRegistrations(req: Request, res: Response, next: NextFunction) {
        try {
            const { districtId, vulnerabilityLevel } = req.query;

            // Base where clause from query utilities
            const where: any = buildWhereClause(req.query, {
                exactMatchFields: ['status']
            });

            // Add custom filters for related fields
            if (districtId || vulnerabilityLevel) {
                where.citizen = {
                    ...(where.citizen || {}), // Preserve existing constraints if any
                    // Filter by district using the relation path: citizen -> policeStation -> districtId
                    // Note: Prisma might need deeply nested filtering or we handle it if schema supports it directly.
                    // Assuming citizen has policeStation relation.
                    ...(districtId ? {
                        policeStation: {
                            districtId: String(districtId)
                        }
                    } : {}),
                    ...(vulnerabilityLevel ? {
                        vulnerabilityLevel: String(vulnerabilityLevel)
                    } : {})
                };
            }

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                // Ensure where.citizen exists
                if (!where.citizen) where.citizen = {};

                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.citizen.PoliceStation = { ...where.citizen.PoliceStation, Range: { id: scope.jurisdictionIds.rangeId } };
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                     where.citizen.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                     where.citizen.PoliceStation = { ...where.citizen.PoliceStation, subDivisionId: scope.jurisdictionIds.subDivisionId };
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                     where.citizen.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                     where.citizen.beatId = scope.jurisdictionIds.beatId;
                }
            }

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;

            const result = await paginatedQuery(db.citizenRegistration, {
                page: isNaN(page) ? 1 : page,
                limit: isNaN(limit) ? 20 : limit,
                where,
                include: {
                    citizen: {
                        include: {
                            PoliceStation: { select: { id: true, districtId: true, name: true } },
                            District: { select: { name: true } }
                        }
                    },
                    visitRequests: true
                },
                orderBy: buildOrderBy(req.query, { createdAt: 'desc' })
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
     * Update registration status (admin action)
     */
    static async updateRegistrationStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body as { status: string; remarks?: string };

            const allowedStatuses = ['PENDING_REVIEW', 'APPROVED', 'REJECTED'];
            if (!allowedStatuses.includes(status)) {
                throw new AppError('Invalid status', 400);
            }

            const registration = await db.citizenRegistration.findUnique({
                where: { id },
                include: { citizen: true, visitRequests: true }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            if (status === 'APPROVED') {
                if (!registration.citizenId) {
                    throw new AppError('Citizen profile not created yet. Submit the registration before approval.', 400);
                }

                const verificationComplete = await hasCompletedVerification(registration.id, registration.citizenId);
                if (!verificationComplete) {
                    throw new AppError('Cannot approve registration until the verification visit is completed.', 400);
                }
            }

            const result = await db.$transaction(async (tx: any) => {
                const updatedReg = await tx.citizenRegistration.update({
                    where: { id },
                    data: {
                        status,
                        draftData: {
                            ...(registration.draftData as Record<string, any> | null ?? {}),
                            adminRemarks: remarks
                        }
                    },
                    include: {
                        citizen: true
                    }
                });

                if (registration.citizenId) {
                    if (status === 'APPROVED') {
                        await tx.seniorCitizen.update({
                            where: { id: registration.citizenId },
                            data: {
                                status: 'Verified',
                                idVerificationStatus: 'Verified',
                                officialRemarks: remarks ?? updatedReg.citizen?.officialRemarks,
                                // Auto-issue digital card
                                digitalCardIssued: true,
                                digitalCardNumber: `SCID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                                digitalCardIssueDate: new Date()
                            }
                        });
                    } else if (status === 'REJECTED') {
                        await tx.seniorCitizen.update({
                            where: { id: registration.citizenId },
                            data: {
                                status: 'Rejected',
                                idVerificationStatus: 'Rejected',
                                officialRemarks: remarks ?? updatedReg.citizen?.officialRemarks
                            }
                        });
                    }
                }

                return updatedReg;
            });

            // Handle notifications after successful transaction
            if (registration.citizenId && registration.citizen?.mobileNumber) {
                if (status === 'APPROVED') {
                    NotificationService.sendVerificationOutcomeNotification(
                        registration.citizen.fullName,
                        registration.citizen.mobileNumber,
                        'Registration',
                        'Approved'
                    ).catch((err: any) => console.error('Failed to send approval notification', err));
                } else if (status === 'REJECTED') {
                    NotificationService.sendVerificationOutcomeNotification(
                        registration.citizen.fullName,
                        registration.citizen.mobileNumber,
                        'Registration',
                        'Rejected'
                    ).catch((err: any) => console.error('Failed to send rejection notification', err));
                }
            }

            res.json({
                success: true,
                data: { registration: result }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * List visit requests for admins
     */
    static async listVisitRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const where = buildWhereClause(req.query, {
                exactMatchFields: ['status']
            });

            const result = await paginatedQuery(db.visitRequest, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    SeniorCitizen: {
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            vulnerabilityLevel: true,
                            policeStationName: true,
                            beatName: true,
                            preferredVisitDay: true,
                            preferredVisitTime: true
                        }
                    }
                },
                orderBy: buildOrderBy(req.query, { createdAt: 'desc' })
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
     * Update visit request status
     */
    static async updateVisitRequestStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, officerId, scheduledDate } = req.body;
            const allowedStatuses = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];
            if (!allowedStatuses.includes(status)) {
                throw new AppError('Invalid status', 400);
            }

            const visitRequest = await db.visitRequest.findUnique({
                where: { id }
            });

            if (!visitRequest) {
                throw new AppError('Visit request not found', 404);
            }

            const updated = await db.visitRequest.update({
                where: { id },
                data: { status }
            });

            if (updated.seniorCitizenId && status === 'Scheduled') {
                const visitDate = scheduledDate ? new Date(scheduledDate) : (updated.preferredDate || new Date());

                // Create actual Visit record
                await db.visit.create({
                    data: {
                        seniorCitizenId: updated.seniorCitizenId,
                        officerId: officerId || undefined,
                        visitType: updated.visitType || 'Routine',
                        scheduledDate: visitDate,
                        status: 'Scheduled',
                        notes: updated.notes
                    }
                });

                await db.seniorCitizen.update({
                    where: { id: updated.seniorCitizenId },
                    data: { nextScheduledVisitDate: visitDate }
                });

                // Send notification
                const citizen = await db.seniorCitizen.findUnique({ where: { id: updated.seniorCitizenId } });
                if (citizen && citizen.consentScheduledVisitReminder) {
                    NotificationService.sendVisitReminder(
                        citizen.mobileNumber,
                        'Assigned Officer',
                        visitDate
                    ).catch((err: any) => console.error('Failed to send visit notification', err));
                }
            }

            res.json({
                success: true,
                data: { visitRequest: updated }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Citizens (or applicants) can request a visit
     */
    static async createVisitRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { preferredDate, preferredTimeSlot, visitType, notes } = req.body;

            const citizen = await db.seniorCitizen.findUnique({
                where: { id }
            });

            if (!citizen) {
                throw new AppError('Citizen not found', 404);
            }

            const visitRequest = await db.visitRequest.create({
                data: {
                    seniorCitizenId: citizen.id,
                    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
                    preferredTimeSlot,
                    visitType,
                    notes,
                    status: 'Pending'
                }
            });

            res.status(201).json({
                success: true,
                data: { visitRequest }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Visit request tied to a registration (before approval)
     */
    static async createRegistrationVisitRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { preferredDate, preferredTimeSlot, visitType, notes } = req.body;

            const registration = await db.citizenRegistration.findUnique({
                where: { id }
            });

            if (!registration) {
                throw new AppError('Registration not found', 404);
            }

            const visitRequest = await db.visitRequest.create({
                data: {
                    registrationId: registration.id,
                    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
                    preferredTimeSlot,
                    visitType,
                    notes,
                    status: 'Pending'
                }
            });

            res.status(201).json({
                success: true,
                data: { visitRequest }
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * Get list of visits for the logged-in citizen
     */
    static async getMyVisits(req: Request, res: Response, next: NextFunction) {
        try {
            // @ts-ignore
            const user = req.user;

            if (!user || user.role !== 'CITIZEN' || !user.citizenId) {
                throw new AppError('Unauthorized: Access restricted to citizens', 403);
            }

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const status = req.query.status as string;

            const where: any = {
                seniorCitizenId: user.citizenId
            };

            if (status) {
                where.status = status;
            }

            const result = await paginatedQuery(db.visit, {
                page,
                limit,
                where,
                include: {
                    officer: {
                        select: {
                            id: true,
                            name: true,
                            rank: true,
                            badgeNumber: true
                        }
                    },
                    PoliceStation: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { scheduledDate: 'desc' }
            });

            // Include Pending Visit Requests on the first page
            if (page === 1) {
                const pendingRequests = await db.visitRequest.findMany({
                    where: {
                        seniorCitizenId: user.citizenId,
                        status: 'Pending'
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (pendingRequests.length > 0) {
                    result.items = [...pendingRequests, ...result.items];
                    result.pagination.total += pendingRequests.length;
                }
            }

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
