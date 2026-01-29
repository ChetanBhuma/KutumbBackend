import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';
import { auditLogger } from '../config/logger';
import { NotificationService } from '../services/notificationService';
import * as VerificationService from '../services/verificationService';
import { cloudStorage } from '../services/cloudStorageService';
import fs from 'fs';

const db = prisma as any;

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

export class CitizenProfileController {
    /**
     * Helper to check if a profile is effectively complete (no placeholders)
     */
    static isProfileComplete(citizen: any): boolean {
        // Import defaults locally or move to class property if import issues arise,
        // but for now assuming direct usage of values to match what's in DB
        const PLACEHOLDERS = {
            ADDRESS: 'Pending Update',
            PINCODE: '000000',
            GENDER: 'Unknown',
            NAME: 'Unknown'
        };

        // Stricter check to ensure critical fields are actually filled.
        // This ensures the Dashboard Modal appears if the user has only done OTP verification
        // but hasn't successfully submitted the details form.
        return !!(
            citizen.fullName && citizen.fullName !== PLACEHOLDERS.NAME &&
            citizen.dateOfBirth &&
            citizen.gender && citizen.gender !== PLACEHOLDERS.GENDER &&
            citizen.permanentAddress && citizen.permanentAddress !== PLACEHOLDERS.ADDRESS &&
            citizen.pinCode && citizen.pinCode !== PLACEHOLDERS.PINCODE
        );
    }

    /**
     * Get own profile
     */
    static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            let citizenId = req.user?.citizenId;

            if (!citizenId) {
                // Secondary fallback: Check DB for SeniorCitizen by mobile number
                const mobile = req.user?.mobileNumber;
                if (mobile) {
                    const existing = await db.seniorCitizen.findFirst({
                        where: { mobileNumber: mobile }
                    });
                    if (existing) {
                        citizenId = existing.id;
                    }
                }
            }

            if (!citizenId) {
                // Fallback: Check if there is a pending registration
                const registration = await db.citizenRegistration.findUnique({
                    where: { mobileNumber: req.user?.mobileNumber }
                });

                if (registration) {
                    const draftData = registration.draftData as any;
                    return res.json({
                        success: true,
                        data: {
                            citizen: {
                                id: req.user?.id, // Use Auth ID as temporary ID
                                fullName: registration.fullName,
                                mobileNumber: req.user?.mobileNumber,
                                isRegistrationPending: true,
                                registrationId: registration.id,
                                registrationStep: registration.registrationStep,
                                status: registration.status,
                                dateOfBirth: draftData?.dateOfBirth || null
                            }
                        }
                    });
                }

                return res.status(404).json({
                    success: false,
                    message: 'Profile not found. Please complete registration.'
                });
            }

            console.log('DEBUG: getProfile for citizenId:', citizenId);

            const citizen = await db.seniorCitizen.findUnique({
                where: { id: citizenId },
                include: {
                    PoliceStation: true,
                    Beat: true,
                    FamilyMember: true,
                    EmergencyContact: true,
                    SpouseDetails: true,
                    District: true,
                    Document: true,
                    HouseholdHelp: true,
                    MedicalHistory: true
                }
            });

            if (!citizen) {
                throw new AppError('Citizen profile not found', 404);
            }

            return res.json({
                success: true,
                data: {
                    citizen: {
                        ...citizen,
                        isProfileComplete: CitizenProfileController.isProfileComplete(citizen)
                    }
                }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Update own profile
     */
    static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            let citizenId = req.user?.citizenId;

            // Lazy Create Logic: If citizenId is missing (new registration), create it now
            if (!citizenId && (req.user?.role === 'CITIZEN' || (req.user?.role as string).toUpperCase() === 'CITIZEN') && (req.user?.email || req.user?.mobileNumber)) {
                let mobile = req.user.mobileNumber || req.user.email!;

                // Robust search for existing citizen with various formats
                 const mobileDigits = mobile.replace(/\D/g, '').slice(-10);
                const mobileSearch = [
                    mobile,
                    mobileDigits,
                    `+91${mobileDigits}`,
                    `91${mobileDigits}`
                ];

                // Check if exists but token was stale
                const existing = await db.seniorCitizen.findFirst({
                    where: { mobileNumber: { in: mobileSearch } }
                });

                if (existing) {
                    citizenId = existing.id;
                } else {
                    // Try to fetch initial data from CitizenRegistration to avoid "Citizen" default
                    const registration = await db.citizenRegistration.findUnique({
                        where: { mobileNumber: mobile }
                    });

                    const initialName = registration?.fullName || 'Citizen';
                    let initialDob = new Date();

                    if (registration?.draftData) {
                         const draft = registration.draftData as any;
                         if (draft.dateOfBirth) {
                             initialDob = new Date(draft.dateOfBirth);
                         }
                    }

                    // Create new placeholder citizen linked to this auth
                    const newCitizen = await db.seniorCitizen.create({
                        data: {
                            mobileNumber: mobile,
                            fullName: initialName,
                            dateOfBirth: initialDob,
                            age: 0, // Will be updated by recalc
                            gender: 'Other',
                            permanentAddress: 'Pending Update',
                            pinCode: '000000',
                            languagesKnown: [],
                            healthConditions: [],
                            interestedServices: [],
                            idVerificationStatus: 'Pending',
                            status: 'Pending',
                            dataEntryDate: new Date(),
                            submissionType: 'Self-Registration'
                        }
                    });
                    citizenId = newCitizen.id;
                }

                // Link Auth to this Citizen
                if (req.user.id) {
                    await db.citizenAuth.update({
                        where: { id: req.user.id },
                        data: { citizenId }
                    });
                }
            }

            if (!citizenId) {
                throw new AppError('Profile not found', 404);
            }

            const {
                emergencyContacts,
                familyMembers,
                householdHelp,
                medicalHistory,
                spouseDetails,
                ...flatUpdates
            } = req.body;

            console.log('DEBUG: updateProfile Payload:', JSON.stringify(flatUpdates, null, 2));

            // Simple fields mapping
            const allowedUpdates = [
                'fullName', 'dateOfBirth', 'gender', 'bloodGroup',
                'permanentAddress', 'presentAddress', 'pinCode', 'city', 'state',
                'districtId', 'policeStationId',
                'addressLine1', 'addressLine2', 'landmark', 'locality',
                'allergies', 'regularDoctor', 'doctorContact', 'healthInsurance',
                'healthConditions', 'mobilityConstraints', 'mobilityStatus', 'physicalDisability',
                'languagesKnown', 'religion', 'occupation', 'yearOfRetirement',
                'livingArrangement', 'maritalStatus', 'numberOfChildren',
                'aadhaarNumber', 'panNumber', 'voterIdNumber', 'passportNumber', 'healthId',
                'mobileNumber', 'alternateMobile', 'email', 'preferredContactMode',
                'photoUrl', 'signatureUrl', 'socialChatIds',
                'preferredVisitDay', 'preferredVisitTime', 'visitNotes',
                'interestedServices', 'consentServiceRequest', 'consentToNotifyFamily',
                'consentShareHealth', 'consentNotifications',
                'whatsappNumber', 'nearbyFamilyDetails', 'healthInsuranceDetails', 'addressProofUrl',
                'residingWith', 'telephoneNumber', 'specialization', 'retiredFrom', 'familyType', 'freeTime', 'lastVisitDate'
            ];

            const updates: any = {};
            Object.keys(flatUpdates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = flatUpdates[key];
                }
            });

            // Helper for safe int parsing
            const safeInt = (val: any) => {
                if (val === '' || val === null || val === undefined) return null;
                const parsed = parseInt(String(val), 10);
                return isNaN(parsed) ? null : parsed;
            };

            if (updates.numberOfChildren !== undefined) {
                updates.numberOfChildren = safeInt(updates.numberOfChildren);
            }

            if (updates.yearOfRetirement !== undefined) {
                updates.yearOfRetirement = safeInt(updates.yearOfRetirement);
            }

            // Cleanup optional fields that should be null if empty string
            const nullableFields = [
                'aadhaarNumber', 'voterIdNumber', 'panNumber', 'passportNumber',
                'healthId', 'email', 'alternateMobile', 'whatsappNumber',
                'livingArrangement', 'nearbyFamilyDetails',
                'regularDoctor', 'doctorContact', 'healthInsuranceDetails', 'addressProofUrl',
                'districtId', 'policeStationId',
                'residingWith', 'telephoneNumber', 'specialization', 'retiredFrom', 'familyType', 'freeTime', 'lastVisitDate'
            ];

            nullableFields.forEach(field => {
                if (typeof updates[field] === 'string' && !updates[field]) {
                    updates[field] = null;
                }
            });

            console.log('DEBUG: Processed Updates:', JSON.stringify(updates, null, 2));

            // Remove empty string dateOfBirth to prevent Prisma error (field is DateTime)
            if (typeof updates.dateOfBirth === 'string' && !updates.dateOfBirth) {
                delete updates.dateOfBirth;
            }

            if (updates.dateOfBirth) {
                const dob = new Date(updates.dateOfBirth);
                if (isNaN(dob.getTime())) {
                    throw new AppError('Invalid Date of Birth', 400);
                }
                updates.dateOfBirth = dob;
                const diff = Date.now() - updates.dateOfBirth.getTime();
                updates.age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
            }

            // Execute in transaction
            const citizen = await db.$transaction(async (tx: any) => {
                // 1. Fetch current state BEFORE update to check for changes
                const oldCitizen = await tx.seniorCitizen.findUnique({
                    where: { id: citizenId }
                });

                // CLEANUP: If mobileNumber or unique fields are unchanged, remove them from updates
                if (updates.mobileNumber && oldCitizen?.mobileNumber) {
                    const newMobile = updates.mobileNumber.replace(/\D/g, '').slice(-10);
                    const oldMobile = oldCitizen.mobileNumber.replace(/\D/g, '').slice(-10);
                    if (newMobile === oldMobile) {
                        delete updates.mobileNumber;
                    }
                }

                if (updates.aadhaarNumber && oldCitizen?.aadhaarNumber === updates.aadhaarNumber) {
                    delete updates.aadhaarNumber;
                }

                // Check if address or police station is changing
                const isAddressChanged = (updates.permanentAddress && updates.permanentAddress !== oldCitizen?.permanentAddress) ||
                    (updates.policeStationId && updates.policeStationId !== oldCitizen?.policeStationId);

                if (isAddressChanged) {
                    updates.beatId = null;
                    updates.idVerificationStatus = 'Pending';
                    updates.status = 'Pending';

                    auditLogger.info('Address/Station change detected, resetting verification', {
                        citizenId,
                        oldStation: oldCitizen?.policeStationId,
                        newStation: updates.policeStationId,
                        oldAddress: oldCitizen?.permanentAddress
                    });
                }

                // 2. Update main profile
                console.log('DEBUG: Updating SeniorCitizen with:', JSON.stringify(updates, null, 2));
                await tx.seniorCitizen.update({
                    where: { id: citizenId },
                    data: updates
                });

                // NOTE: VerificationRequest is already created during initial registration
                // No need to create another one here during profile update

                // 3. Handle Emergency Contacts
                if (Array.isArray(emergencyContacts)) {
                    await tx.emergencyContact.deleteMany({
                        where: { seniorCitizenId: citizenId }
                    });

                    if (emergencyContacts.length > 0) {
                        await tx.emergencyContact.createMany({
                            data: emergencyContacts.map((contact: any) => ({
                                seniorCitizenId: citizenId,
                                name: contact.name,
                                mobileNumber: contact.mobileNumber,
                                relation: contact.relation,
                                isPrimary: contact.isPrimary || false
                            }))
                        });
                    }
                }

                // 4. Handle Family Members
                if (Array.isArray(familyMembers)) {
                    await tx.familyMember.deleteMany({
                        where: { seniorCitizenId: citizenId }
                    });

                    if (familyMembers.length > 0) {
                        await tx.familyMember.createMany({
                            data: familyMembers.map((member: any) => ({
                                seniorCitizenId: citizenId,
                                name: member.name,
                                relation: member.relation,
                                age: member.age ? parseInt(member.age) : null,
                                mobileNumber: member.mobileNumber
                            }))
                        });
                    }
                }

                // 5. Handle Household Help (Staff)
                if (householdHelp) {
                    await tx.householdHelp.deleteMany({
                        where: { seniorCitizenId: citizenId }
                    });

                    if (Array.isArray(householdHelp) && householdHelp.length > 0) {
                        await tx.householdHelp.createMany({
                            data: householdHelp.map((help: any) => ({
                                seniorCitizenId: citizenId,
                                staffType: help.staffType || 'Domestic Help',
                                name: help.name,
                                mobileNumber: help.mobileNumber,
                                idProofType: help.idProofType,
                                idProofUrl: help.idProofUrl,
                                employmentType: help.employmentType || 'Part-Time',
                                verificationStatus: 'Not Verified',
                                address: help.address // Ensure address is captured
                            }))
                        });
                    }
                }

                // 7. Handle Medical History
                if (medicalHistory !== undefined) {
                    if (Array.isArray(medicalHistory)) {
                        await tx.medicalHistory.deleteMany({
                            where: { seniorCitizenId: citizenId }
                        });

                        if (medicalHistory.length > 0) {
                            const validHistory = medicalHistory.filter((h: any) => h.conditionName?.trim());
                            if (validHistory.length > 0) {
                                await tx.medicalHistory.createMany({
                                    data: validHistory.map((h: any) => ({
                                        seniorCitizenId: citizenId,
                                        conditionName: h.conditionName,
                                        sinceWhen: h.sinceWhen,
                                        remarks: h.remarks
                                    }))
                                });
                            }
                        }
                    }
                }

                // 8. Handle Spouse Details
                if (spouseDetails) {
                    // Decide isLivingTogether based on residingWith if not explicit
                    let livingTogether = spouseDetails.isLivingTogether;
                    if (livingTogether === undefined && updates.residingWith) {
                        // Infer from residingWith
                         livingTogether = updates.residingWith !== 'Alone';
                    }
                    if (livingTogether === undefined) livingTogether = true; // Default

                    await tx.spouseDetails.upsert({
                        where: { seniorCitizenId: citizenId },
                        create: {
                            seniorCitizenId: citizenId,
                            fullName: spouseDetails.fullName || 'Unknown',
                            mobileNumber: spouseDetails.mobileNumber,
                            weddingDate: spouseDetails.weddingDate ? new Date(spouseDetails.weddingDate) : null,
                            isLivingTogether: livingTogether,
                            addressIfNotTogether: spouseDetails.addressIfNotTogether
                        },
                        update: {
                            fullName: spouseDetails.fullName,
                            mobileNumber: spouseDetails.mobileNumber,
                            weddingDate: spouseDetails.weddingDate ? new Date(spouseDetails.weddingDate) : null,
                            isLivingTogether: livingTogether,
                            addressIfNotTogether: spouseDetails.addressIfNotTogether
                        }
                    });
                } else if (updates.maritalStatus === 'Married') {
                    // Create empty spouse record if married but no details provided?
                    // Better wait for details.
                }

                // 6. Sync with CitizenRegistration for Admin Review
                const freshCitizen = await tx.seniorCitizen.findUnique({ where: { id: citizenId } });
                if (freshCitizen && freshCitizen.mobileNumber) {
                    await tx.citizenRegistration.upsert({
                        where: { mobileNumber: freshCitizen.mobileNumber },
                        create: {
                            mobileNumber: freshCitizen.mobileNumber,
                            fullName: freshCitizen.fullName,
                            status: 'PENDING_REVIEW',
                            registrationStep: 'COMPLETED',
                            otpVerified: true,
                            citizenId: citizenId
                        },
                        update: {
                            fullName: freshCitizen.fullName,
                            status: 'PENDING_REVIEW',
                            registrationStep: 'COMPLETED',
                            citizenId: citizenId,
                            updatedAt: new Date()
                        }
                    });
                }

            }, {
                maxWait: 10000,
                timeout: 30000
            });

            // 6. Sync with CitizenRegistration & Auth
            await CitizenProfileController.syncCitizenStatus(citizenId, citizen);

            // NOTE: VerificationRequest creation removed - already handled during initial registration

            // Special handling if mobile number was updated
            if (updates.mobileNumber) {
                const formattedMobile = formatMobile(updates.mobileNumber);
                await db.citizenAuth.updateMany({
                    where: { citizenId },
                    data: { mobileNumber: formattedMobile }
                });
                await db.citizenRegistration.updateMany({
                    where: { citizenId },
                    data: { mobileNumber: formattedMobile }
                });
            }

            auditLogger.info('Citizen updated profile with relations', {
                citizenId,
                updates: Object.keys(updates)
            });

            return res.json({
                success: true,
                data: { citizen },
                message: 'Profile updated successfully'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Helper to sync SeniorCitizen status with CitizenRegistration
     */
    private static async syncCitizenStatus(citizenId: string, citizenData: any) {
        try {
            // Determine Registration Status based on Profile Status
            let newRegStatus = 'PENDING_REVIEW';

            if (citizenData.idVerificationStatus === 'Verified') {
                newRegStatus = 'APPROVED';
            } else if (citizenData.idVerificationStatus === 'Rejected') {
                newRegStatus = 'REJECTED';
            }

            // Update Registration(s) linked to this citizen
            await db.citizenRegistration.updateMany({
                where: { citizenId: citizenId },
                data: {
                    status: newRegStatus,
                    fullName: citizenData.fullName
                }
            });

            // Ensure Auth is linked (Self-healing)
            if (citizenData.mobileNumber) {
                await db.citizenAuth.updateMany({
                    where: {
                        mobileNumber: citizenData.mobileNumber,
                        citizenId: null
                    },
                    data: { citizenId: citizenId }
                });
            }
        } catch (err) {
            console.error('Failed to sync citizen status:', err);
            // Don't block the main request
        }
    }

    /**
     * Get own visits
     */
    static async getVisits(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                return res.json({
                    success: true,
                    data: { visits: [] }
                });
            }

            const visits = await db.visit.findMany({
                where: { seniorCitizenId: citizenId },
                include: {
                    officer: { select: { id: true, name: true, rank: true, mobileNumber: true } },
                    PoliceStation: { select: { id: true, name: true } }
                },
                orderBy: { scheduledDate: 'desc' }
            });

// 1. Fetch legacy VisitRequests
            const visitRequests = await db.visitRequest.findMany({
                where: {
                    seniorCitizenId: citizenId,
                    status: 'Pending'
                },
                orderBy: { createdAt: 'desc' }
            });

            // 2. Fetch new VerificationRequests (Pending/InProgress)
            const verificationRequests = await db.verificationRequest.findMany({
                where: {
                    seniorCitizenId: citizenId,
                    status: { in: ['PENDING', 'IN_PROGRESS'] }
                },
                orderBy: { createdAt: 'desc' }
            });

            // 3. Map legacy requests
            const mappedVisitRequests = visitRequests.map((r: any) => ({
                id: r.id,
                visitType: r.visitType || 'Request',
                scheduledDate: r.preferredDate,
                createdAt: r.createdAt,
                status: r.status, // e.g. Pending (PascalCase)
                officer: null,
                isRequest: true
            }));

            // 4. Map new verification requests to same format
            const mappedVerificationRequests = verificationRequests.map((r: any) => ({
                id: r.id,
                visitType: 'Verification',
                scheduledDate: r.createdAt, // Use creation date as preferred date fallback
                createdAt: r.createdAt,
                status: r.status === 'IN_PROGRESS' ? 'Pending' : 'Pending', // Map to PascalCase 'Pending' for UI consistency
                officer: r.assignedTo ? { id: r.assignedTo, name: 'Assigned Officer' } : null,
                isRequest: true,
                isVerification: true
            }));

            const allRequests = [...mappedVerificationRequests, ...mappedVisitRequests];

            const allVisits = [...allRequests, ...visits].sort((a: any, b: any) => {
                const dateA = new Date(a.scheduledDate || a.createdAt).getTime();
                const dateB = new Date(b.scheduledDate || b.createdAt).getTime();
                return dateB - dateA;
            });

            return res.json({
                success: true,
                data: { visits: allVisits }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Request a visit
     */
    static async requestVisit(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                throw new AppError('Profile not found', 404);
            }

            const { preferredDate, preferredTimeSlot, visitType, notes } = req.body;

            const visitRequest = await db.visitRequest.create({
                data: {
                    seniorCitizenId: citizenId,
                    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
                    preferredTimeSlot,
                    visitType,
                    notes,
                    status: 'Pending'
                }
            });

            auditLogger.info('Citizen requested visit', {
                citizenId,
                visitType
            });

            return res.status(201).json({
                success: true,
                data: { visitRequest },
                message: 'Visit requested successfully'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get own SOS alerts
     */
    static async getSOS(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                return res.json({
                    success: true,
                    data: { alerts: [] }
                });
            }

            const alerts = await db.sOSAlert.findMany({
                where: { seniorCitizenId: citizenId },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            return res.json({
                success: true,
                data: { alerts }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Create SOS alert
     */
    static async createSOS(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                throw new AppError('Profile not found', 404);
            }

            const { latitude, longitude, address, batteryLevel, deviceInfo } = req.body;

            if (!latitude || !longitude) {
                throw new AppError('Location is required', 400);
            }
            // Create SOS alert
            const sosAlert = await db.sOSAlert.create({
                data: {
                    seniorCitizenId: citizenId,
                    latitude,
                    longitude,
                    address,
                    status: 'Active',
                    batteryLevel,
                    deviceInfo
                }
            });

            // Fetch targets for notification
            const citizen = await db.seniorCitizen.findUnique({
                where: { id: citizenId },
                include: {
                    PoliceStation: true,
                    Beat: {
                        include: {
                            BeatOfficer: {
                                where: { isActive: true },
                                take: 3
                            }
                        }
                    },
                    EmergencyContact: {
                        where: { isPrimary: true },
                        take: 2
                    }
                }
            });

            if (citizen) {
                // Get officers from beat or police station
                const officers = citizen.Beat?.BeatOfficer?.map((o: any) => ({
                    name: o.name,
                    phone: o.mobileNumber
                })) || [];

                const contacts = citizen.EmergencyContact?.map((c: any) => ({
                    name: c.name,
                    phone: c.mobileNumber
                })) || [];

                // Send SOS notifications
                await NotificationService.sendSOSAlert(
                    citizen.fullName,
                    citizen.mobileNumber,
                    address || citizen.permanentAddress || 'Unknown location',
                    latitude,
                    longitude,
                    { officers, emergencyContacts: contacts }
                );
            }

            auditLogger.error('SOS ALERT TRIGGERED BY CITIZEN', {
                alertId: sosAlert.id,
                citizenId,
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                data: { alert: sosAlert },
                message: 'SOS alert created successfully'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Upload document
     */
    static async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            console.log('DEBUG: uploadDocument called', {
                headers: req.headers,
                body: req.body,
                file: req.file ? { ...req.file, buffer: undefined } : 'MISSING'
            });

            let citizenId = req.user?.citizenId;

            // Auto-create/link logic if citizenId is missing (copied from updateProfile)
            if (!citizenId && req.user?.mobileNumber) {
                const mobile = req.user.mobileNumber;
                const mobileDigits = mobile.replace(/\D/g, '').slice(-10);
                const mobileSearch = [
                     mobileDigits,
                    `+91${mobileDigits}`,
                    `91${mobileDigits}`
                ];

                const existing = await db.seniorCitizen.findFirst({
                    where: { mobileNumber: { in: mobileSearch } }
                });

                if (existing) {
                    citizenId = existing.id;
                } else {
                    // Create new placeholder citizen
                    console.log(`DEBUG: Auto-creating citizen for upload: ${mobile}`);
                    const newCitizen = await db.seniorCitizen.create({
                        data: {
                            mobileNumber: mobile,
                            fullName: 'Citizen',
                            dateOfBirth: new Date(),
                            age: 0,
                            gender: 'Other',
                            permanentAddress: 'Pending Update',
                            pinCode: '000000',
                            status: 'Pending',
                            dataEntryDate: new Date(),
                            submissionType: 'Self-Registration'
                        }
                    });
                    citizenId = newCitizen.id;
                }

                // Link Auth
                if (req.user.id) {
                    await db.citizenAuth.update({
                        where: { id: req.user.id },
                        data: { citizenId }
                    });
                }
            }

            if (!citizenId) {
                console.error('DEBUG: No citizenId found and auto-create failed');
                throw new AppError('Profile not found', 404);
            }

            if (!req.file) {
                console.error('DEBUG: No file in request');
                throw new AppError('No file uploaded', 400);
            }

            const { documentType } = req.body;

            // Determine folder based on document type
            const folder = documentType === 'ProfilePhoto' ? 'photos' : 'documents';

            // Upload to cloud storage
            const fileKey = `${folder}/${citizenId}/${Date.now()}_${req.file.originalname}`;
            console.log(`DEBUG: Uploading to cloud/local. Key: ${fileKey}`);

            const fileUrl = await cloudStorage.uploadFile(req.file.path, fileKey, req.file.mimetype);
            console.log(`DEBUG: Upload successful. URL: ${fileUrl}`);

            // Clean up local file ONLY if we are using cloud storage (URL starts with http)
            // If local, fileUrl is likely valid relative path, so we keep the file.
            const isCloudUrl = fileUrl.startsWith('http');
            if (isCloudUrl && req.file.path && fs.existsSync(req.file.path)) {
                console.log('DEBUG: Cleaning up local temp file');
                fs.unlinkSync(req.file.path);
            } else {
                console.log('DEBUG: Keeping local file for local storage mode');
            }

            const document = await db.document.create({
                data: {
                    seniorCitizenId: citizenId,
                    documentType: documentType || 'Other', // Fallback if missing
                    documentName: req.file.originalname,
                    fileUrl,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size
                }
            });

            auditLogger.info('Citizen uploaded document', {
                citizenId,
                documentId: document.id
            });

            return res.status(201).json({
                success: true,
                data: { document },
                message: 'Document uploaded successfully'
            });
        } catch (error) {
            console.error('DEBUG: uploadDocument ERROR:', error);
            return next(error);
        }
    }

    /**
     * Get own documents
     */
    static async getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                return res.json({
                    success: true,
                    data: { documents: [] }
                });
            }

            const documents = await db.document.findMany({
                where: { seniorCitizenId: citizenId },
                orderBy: { uploadedAt: 'desc' }
            });

            return res.json({
                success: true,
                data: { documents }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Update notification preferences
     */
    static async updateNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                throw new AppError('Profile not found', 404);
            }

            const {
                allowNotifications,
                allowFamilyNotification,
                preferredContactMode,
                consentScheduledVisitReminder
            } = req.body;

            const citizen = await db.seniorCitizen.update({
                where: { id: citizenId },
                data: {
                    allowNotifications,
                    allowFamilyNotification,
                    preferredContactMode,
                    consentScheduledVisitReminder
                }
            });

            return res.json({
                success: true,
                data: { citizen },
                message: 'Notification preferences updated'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Submit feedback
     */
    static async submitFeedback(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenId = req.user?.citizenId;
            if (!citizenId) {
                throw new AppError('Profile not found', 404);
            }

            const { visitId, rating, comments } = req.body;

            // If visitId is provided, link to visit
            if (visitId) {
                const visit = await db.visit.findUnique({
                    where: { id: visitId }
                });

                if (!visit) {
                    throw new AppError('Visit not found', 404);
                }

                if (visit.seniorCitizenId !== citizenId) {
                    throw new AppError('Unauthorized', 403);
                }

                // Check if VisitFeedback model exists, if not, we might need to skip or use a generic Feedback model
                // Assuming VisitFeedback exists as per FeedbackController
                await db.visitFeedback.create({
                    data: {
                        visitId,
                        rating,
                        comments,
                        submittedBy: citizenId
                    }
                });
                auditLogger.info('Visit feedback submitted', {
                    visitId,
                    rating,
                    comments,
                    submittedBy: citizenId
                });
            } else {
                // General feedback - store in a different table or log it
                // For now, let's just log it as we don't have a GeneralFeedback model confirmed
                auditLogger.info('General feedback submitted by citizen', {
                    citizenId,
                    rating,
                    comments
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully'
            });
        } catch (error) {
            return next(error);
        }
    }
}
