import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';
import { AuthRequest } from '../middleware/authenticate';
import { paginatedQuery } from '../utils/pagination';
import { buildWhereClause, buildOrderBy } from '../utils/queryBuilder';
import { validateTransition } from '../utils/workflowValidation';
import { recalculateVulnerability } from '../services/vulnerabilityService';
import { normalizeAadhaar, validateSeniorCitizenAge, validateAadhaar } from '../utils/dataValidation';

export class CitizenController {
    /**
     * Get all citizens with pagination and filters
     */
    /**
     * Get all citizens with pagination and filters
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            // Prepare query for buildWhereClause
            const query = { ...req.query };
            if (query.verificationStatus) {
                query.idVerificationStatus = query.verificationStatus;
            }

            const where = buildWhereClause(query, {
                searchFields: ['fullName', 'mobileNumber', 'aadhaarNumber'],
                exactMatchFields: [
                    'policeStationId',
                    'beatId',
                    'districtId',
                    'rangeId',
                    'vulnerabilityLevel',
                    'idVerificationStatus'
                ],
                booleanFields: ['isActive']
            });

            // Ensure isActive is true by default if not specified (though buildWhereClause handles booleanFields, we might want to enforce it or default it)
            // The original code forced { isActive: true }.
            // buildWhereClause only adds it if present in query.
            // So we should set it explicitly if we want to enforce it, or rely on query.
            // Original: const where: any = { isActive: true };
            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }

            if (where.isActive === undefined) {
                where.isActive = true;
            }

            const result = await paginatedQuery(prisma.seniorCitizen, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    PoliceStation: {
                        select: { id: true, name: true }
                    },
                    Beat: {
                        select: { id: true, name: true }
                    },
                    // OPTIMIZATION: Use counts instead of full relations for list view
                    // Full data is fetched in getById for detail view
                    _count: {
                        select: {
                            FamilyMember: true,
                            EmergencyContact: true
                        }
                    }
                },
                orderBy: buildOrderBy(req.query, { createdAt: 'desc' })
            });

            res.json({
                success: true,
                data: {
                    citizens: result.items,
                    pagination: result.pagination
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get citizens for map view
     */
    static async map(req: Request, res: Response, next: NextFunction) {
        // For now, reuse list logic but we can optimize later to return only necessary fields
        return CitizenController.list(req, res, next);
    }

    /**
     * Get single citizen by ID
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const citizen = await prisma.seniorCitizen.findUnique({
                where: { id },
                include: {
                    PoliceStation: true,
                    Beat: true,
                    District: true,
                    FamilyMember: true,
                    EmergencyContact: true,
                    HouseholdHelp: true,
                    SpouseDetails: true,
                    MedicalHistory: true,
                    Document: true,
                    Visit: {
                        include: {
                            officer: { select: { id: true, name: true, rank: true } }
                        },
                        orderBy: { scheduledDate: 'desc' },
                        take: 10
                    },
                    SOSAlert: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    ServiceRequest: {
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            });

            if (!citizen) {
                throw new AppError('Citizen not found', 404);
            }

            res.json({
                success: true,
                data: { citizen }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new citizen
     */
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const citizenData = req.body;

            // Check for duplicate mobile number
            const existingCitizen = await prisma.seniorCitizen.findFirst({
                where: {
                    mobileNumber: citizenData.mobileNumber,
                    isActive: true
                },
                select: { id: true, fullName: true, mobileNumber: true }
            });

            if (existingCitizen) {
                throw new AppError(
                    `This mobile number (${citizenData.mobileNumber}) is already registered with ${existingCitizen.fullName}. Please use a different mobile number.`,
                    409
                );
            }

            // VALIDATION: Age must be >= 60
            const dob = new Date(citizenData.dateOfBirth);
            const ageValidation = validateSeniorCitizenAge(dob);

            if (!ageValidation.valid) {
                throw new AppError(ageValidation.message || 'Invalid age', 400);
            }

            // VALIDATION: Normalize Aadhaar if provided
            if (citizenData.aadhaarNumber) {
                if (!validateAadhaar(citizenData.aadhaarNumber)) {
                    throw new AppError('Invalid Aadhaar number format. Must be 12 digits.', 400);
                }
                citizenData.aadhaarNumber = normalizeAadhaar(citizenData.aadhaarNumber);
            }

            // Calculate age from DOB
            const age = ageValidation.age;

            // Generate Friendly ID (UUID for now, can be customized)
            const srCitizenUniqueId = `SC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Extract nested data
            const { familyMembers, emergencyContacts, householdHelp, spouseDetails, medicalHistory, ...mainData } = citizenData;

            // Create citizen with nested relations
            const citizen = await prisma.seniorCitizen.create({
                data: {
                    ...mainData,
                    dateOfBirth: new Date(mainData.dateOfBirth),
                    consentDataUse: mainData.consentDataUse === 'true' || mainData.consentDataUse === true,
                    age,
                    srCitizenUniqueId,
                    registrationNo: `REG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
                    receivedBy: req.user?.email,
                    dataEntryCompletedBy: req.user?.email,
                    dataEntryDate: new Date(),
                    FamilyMember: familyMembers ? {
                        create: familyMembers
                    } : undefined,
                    EmergencyContact: emergencyContacts ? {
                        create: emergencyContacts
                    } : undefined,
                    HouseholdHelp: householdHelp ? {
                        create: householdHelp
                    } : undefined,
                    SpouseDetails: spouseDetails ? {
                        create: spouseDetails
                    } : undefined,
                    MedicalHistory: medicalHistory ? {
                        create: medicalHistory
                    } : undefined
                },
                include: {
                    FamilyMember: true,
                    EmergencyContact: true,
                    HouseholdHelp: true,
                    SpouseDetails: true,
                    MedicalHistory: true
                }
            });

            // Auto-assign Beat Officer logic
            const { OfficerAssignmentService } = await import('../services/officerAssignmentService');
            let assignedOfficerId: string | null = null;

            if (citizen.beatId || citizen.policeStationId) {
                assignedOfficerId = await OfficerAssignmentService.assignOfficerToCitizen(citizen.id, citizen.beatId, citizen.policeStationId || undefined);
            }

            if (assignedOfficerId && citizen.policeStationId) {
                // Create Scheduled Visit
                await prisma.visit.create({
                    data: {
                        seniorCitizenId: citizen.id,
                        officerId: assignedOfficerId,
                        policeStationId: citizen.policeStationId,
                        visitType: 'Verification',
                        status: 'SCHEDULED',
                        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
                        notes: 'Auto-scheduled verification visit'
                    }
                });
            }

            // Log creation
            auditLogger.info('Citizen created successfully', {
                citizenId: citizen.id,
                citizenName: citizen.fullName,
                assignedOfficerId,
                createdBy: req.user?.email,
                hasMedicalHistory: !!medicalHistory
            });

            res.status(201).json({
                success: true,
                data: { citizen, assignedOfficerId },
                message: 'Citizen registered successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update citizen profile
     */
    static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Prevent updating restricted fields
            delete updates.id;
            delete updates.createdAt;
            delete updates.updatedAt;
            delete updates.srCitizenUniqueId;

            // Check if citizen exists
            const existing = await prisma.seniorCitizen.findUnique({ where: { id } });
            if (!existing) {
                throw new AppError('Citizen not found', 404);
            }

            // CAPTURE CURRENT LOCATION BEFORE UPDATE (for address change detection)
            const oldBeatId = existing.beatId;
            const oldPoliceStationId = existing.policeStationId;
            const oldDistrictId = existing.districtId;
            const oldAddress = existing.permanentAddress;

            // Validate status transition if status is changing
            if (updates.status) {
                validateTransition('CITIZEN', existing.status, updates.status);
            }

            // Recalculate age if DOB changed
            if (updates.dateOfBirth) {
                const dob = new Date(updates.dateOfBirth);
                updates.age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            }

            // Extract nested data
            const { familyMembers, emergencyContacts, householdHelp, spouseDetails, medicalHistory, ...mainData } = updates;

            // Sanitize data types - convert strings to proper types
            if (mainData.yearOfRetirement !== undefined && mainData.yearOfRetirement !== null) {
                mainData.yearOfRetirement = mainData.yearOfRetirement === '' ? null : parseInt(String(mainData.yearOfRetirement), 10);
            }
            if (mainData.numberOfChildren !== undefined && mainData.numberOfChildren !== null) {
                mainData.numberOfChildren = mainData.numberOfChildren === '' ? 0 : parseInt(String(mainData.numberOfChildren), 10);
            }
            if (mainData.vulnerabilityScore !== undefined && mainData.vulnerabilityScore !== null) {
                mainData.vulnerabilityScore = mainData.vulnerabilityScore === '' ? null : parseInt(String(mainData.vulnerabilityScore), 10);
            }

            // Convert boolean fields that might come as strings
            const booleanFields = [
                'consentToNotifyFamily', 'consentShareHealth', 'registeredOnApp', 'consentNotifications',
                'digitalCardIssued', 'consentServiceRequest', 'consentDataUse', 'aadhaarVerified',
                'allowDataExport', 'allowDataShareWithFamily', 'allowFamilyNotification', 'allowNotifications',
                'consentScheduledVisitReminder', 'isMobileRegistered', 'isSoftDeleted', 'physicalDisability',
                'isActive'
            ];
            booleanFields.forEach(field => {
                if (mainData[field] !== undefined) {
                    mainData[field] = mainData[field] === 'true' || mainData[field] === true;
                }
            });

            // Remove fields that should not be directly updated (relations, computed, etc.)
            const fieldsToRemove = [
                // Relation objects (these are read-only, use ID fields instead)
                'LivingArrangement', 'Beat', 'District', 'SubDivision', 'Range', 'MaritalStatus',
                'PoliceStation', 'User', 'Document', 'SOSAlert', 'ServiceRequest', 'Visit',
                'HealthCondition', 'VulnerabilityHistory', 'VisitRequest', 'CitizenRegistration',
                'CitizenAuth', 'VerificationRequest', 'MedicalHistory',
                // Duplicate/invalid fields
                'pincode', // Duplicate of pinCode (schema uses pinCode)
                'gpsAccuracy', 'gpsCapturedAt', // These fields don't exist in schema
                // Any other potential relation objects from frontend
                'Beats', 'Districts', 'Ranges', 'PoliceStations'
            ];

            fieldsToRemove.forEach(field => {
                delete mainData[field];
            });

            console.log('[updateProfile] Citizen ID:', id);
            console.log('[updateProfile] Fields to update:', Object.keys(mainData));
            console.log('[updateProfile] Sample values:', {
                rangeId: mainData.rangeId,
                districtId: mainData.districtId,
                yearOfRetirement: mainData.yearOfRetirement,
                pincode: mainData.pincode,
                pinCode: mainData.pinCode
            });

            // Update citizen
            let citizen;
            try {
                citizen = await prisma.seniorCitizen.update({
                    where: { id },
                    data: {
                        ...mainData,
                        submissionType: 'Update',
                        updatedBy: req.user?.email,
                        SpouseDetails: spouseDetails && (spouseDetails.fullName || spouseDetails.mobileNumber) ? {
                            upsert: {
                                create: spouseDetails,
                                update: spouseDetails
                            }
                        } : undefined,
                        MedicalHistory: medicalHistory ? {
                            deleteMany: {},
                            create: medicalHistory
                        } : undefined,
                        // Replace one-to-many relations
                        FamilyMember: familyMembers ? {
                            deleteMany: {},
                            create: familyMembers
                        } : undefined,
                        EmergencyContact: emergencyContacts ? {
                            deleteMany: {},
                            create: emergencyContacts
                        } : undefined,
                        HouseholdHelp: householdHelp ? {
                            deleteMany: {},
                            create: householdHelp
                        } : undefined
                    },
                    include: {
                        FamilyMember: true,
                        EmergencyContact: true,
                        HouseholdHelp: true,
                        SpouseDetails: true,
                        MedicalHistory: true
                    }
                });
            } catch (prismaError: any) {
                console.error('[updateProfile] Prisma Error:', prismaError);
                console.error('[updateProfile] Error Message:', prismaError.message);
                console.error('[updateProfile] Data being sent:', JSON.stringify({
                    ...mainData,
                    submissionType: 'Update',
                    updatedBy: req.user?.email
                }, null, 2));
                throw prismaError;
            }

            // Log update
            auditLogger.info('Citizen updated', {
                citizenId: citizen.id,
                citizenName: citizen.fullName,
                updatedBy: req.user?.email,
                changes: Object.keys(mainData),
                timestamp: new Date().toISOString()
            });

            // Recalculate vulnerability if relevant fields changed
            const vulnerabilityFields = ['age', 'dateOfBirth', 'healthConditions', 'livingArrangement', 'mobilityStatus'];
            const hasVulnerabilityChange = Object.keys(mainData).some(key => vulnerabilityFields.includes(key)) ||
                emergencyContacts || householdHelp;

            if (hasVulnerabilityChange) {
                try {
                    await recalculateVulnerability(id);
                    auditLogger.info('Vulnerability score recalculated', {
                        citizenId: id,
                        triggeredBy: 'citizen_update'
                    });
                } catch (error) {
                    // Log but don't fail the update
                    auditLogger.error('Vulnerability recalculation failed', {
                        citizenId: id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            // HANDLE ADDRESS CHANGE - Automatic re-verification workflow
            const locationChanged = (
                oldBeatId !== citizen.beatId ||
                oldPoliceStationId !== citizen.policeStationId ||
                oldDistrictId !== citizen.districtId
            );

            if (locationChanged) {
                auditLogger.info('Location change detected', {
                    citizenId: citizen.id,
                    oldLocation: { beatId: oldBeatId, psId: oldPoliceStationId, districtId: oldDistrictId },
                    newLocation: { beatId: citizen.beatId, psId: citizen.policeStationId, districtId: citizen.districtId }
                });

                // Import services
                const { CitizenAddressChangeService } = await import('../services/citizenAddressChangeService');
                const { OfficerAssignmentService } = await import('../services/officerAssignmentService');

                // 1. Cancel all pending visits from old officer
                const cancelledCount = await CitizenAddressChangeService.cancelPendingVisits(
                    citizen.id,
                    'Address changed - citizen moved to different jurisdiction',
                    req.user?.email
                );

                // 2. Reassign to new beat officer (if beat changed)
                let newOfficerId: string | null = null;
                if (citizen.beatId && citizen.policeStationId) {
                    try {
                        newOfficerId = await OfficerAssignmentService.assignOfficerToCitizen(
                            citizen.id,
                            citizen.beatId,
                            citizen.policeStationId
                        );
                    } catch (error) {
                        auditLogger.warn('Officer assignment failed during address change', {
                            citizenId: citizen.id,
                            beatId: citizen.beatId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }

                // 3. Create re-verification visit (if new officer assigned)
                if (newOfficerId && citizen.policeStationId) {
                    await CitizenAddressChangeService.createReVerificationVisit(
                        citizen.id,
                        newOfficerId,
                        citizen.policeStationId,
                        oldAddress
                    );
                }

                // 4. Reset verification status to pending
                await CitizenAddressChangeService.resetVerificationStatus(
                    citizen.id,
                    'Address changed - re-verification required'
                );

                auditLogger.info('Address change processed successfully', {
                    citizenId: citizen.id,
                    cancelledVisits: cancelledCount,
                    newOfficerId,
                    reVerificationScheduled: !!newOfficerId
                });
            }

            res.json({
                success: true,
                data: { citizen },
                message: locationChanged
                    ? 'Profile updated - Address change detected, re-verification scheduled'
                    : 'Citizen updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete (soft delete) citizen
     */
    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Use soft delete cascade to handle related records
            const { handleCitizenSoftDelete } = await import('../utils/softDeleteCascade');
            const result = await handleCitizenSoftDelete(id);

            // Log deletion
            auditLogger.warn('Citizen deleted with cascade', {
                citizenId: id,
                deletedBy: req.user?.email,
                cascadeResult: result,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Citizen deleted successfully',
                data: {
                    cancelledVisits: result.cancelledVisits,
                    resolvedAlerts: result.resolvedAlerts,
                    closedRequests: result.closedRequests
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update verification status
     */
    static async updateVerificationStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;

            const existing = await prisma.seniorCitizen.findUnique({ where: { id } });
            if (!existing) {
                throw new AppError('Citizen not found', 404);
            }

            validateTransition('CITIZEN_VERIFICATION', existing.idVerificationStatus, status);

            let updates: any = {
                idVerificationStatus: status,
                officialRemarks: remarks
            };

            if (status === 'Verified') {
                const cardNumber = `SCID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                updates = {
                    ...updates,
                    status: 'Active',
                    digitalCardIssued: true,
                    digitalCardNumber: cardNumber,
                    digitalCardIssueDate: new Date()
                };
            } else if (status === 'Rejected') {
                updates.status = 'REJECTED';
            }

            const citizen = await prisma.seniorCitizen.update({
                where: { id },
                data: updates
            });

            // Log verification
            auditLogger.info('Citizen verification status updated', {
                citizenId: citizen.id,
                citizenName: citizen.fullName,
                status,
                verifiedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: { citizen },
                message: 'Verification status updated'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Issue digital card
     */
    static async issueDigitalCard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Generate card number
            const cardNumber = `SCID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            const citizen = await prisma.seniorCitizen.update({
                where: { id },
                data: {
                    digitalCardIssued: true,
                    digitalCardNumber: cardNumber,
                    digitalCardIssueDate: new Date()
                }
            });

            // Log card issuance
            auditLogger.info('Digital card issued', {
                citizenId: citizen.id,
                citizenName: citizen.fullName,
                cardNumber,
                issuedBy: req.user?.email,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                data: { citizen, cardNumber },
                message: 'Digital card issued successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get statistics
     */
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            // const { policeStationId, beatId } = req.query;

            const where = buildWhereClause(req.query, {
                exactMatchFields: ['policeStationId', 'beatId'],
                booleanFields: ['isActive']
            });

            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.rangeId = scope.jurisdictionIds.rangeId;
                } else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                } else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                } else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                } else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }

            if (where.isActive === undefined) {
                where.isActive = true;
            }

            const [
                total,
                verified,
                pending,
                rejected,
                highVulnerability,
                mediumVulnerability,
                lowVulnerability,
                withDigitalCard
            ] = await Promise.all([
                prisma.seniorCitizen.count({ where }),
                prisma.seniorCitizen.count({ where: { ...where, idVerificationStatus: 'Verified' } }),
                prisma.seniorCitizen.count({ where: { ...where, idVerificationStatus: 'Pending' } }),
                prisma.seniorCitizen.count({ where: { ...where, idVerificationStatus: 'Rejected' } }),
                prisma.seniorCitizen.count({ where: { ...where, vulnerabilityLevel: 'High' } }),
                prisma.seniorCitizen.count({ where: { ...where, vulnerabilityLevel: 'Medium' } }),
                prisma.seniorCitizen.count({ where: { ...where, vulnerabilityLevel: 'Low' } }),
                prisma.seniorCitizen.count({ where: { ...where, digitalCardIssued: true } })
            ]);

            res.json({
                success: true,
                data: {
                    total,
                    verification: {
                        verified,
                        pending,
                        rejected
                    },
                    vulnerability: {
                        high: highVulnerability,
                        medium: mediumVulnerability,
                        low: lowVulnerability
                    },
                    digitalCards: withDigitalCard
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check for duplicate citizens
     */
    static async checkDuplicates(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { fullName, mobileNumber, aadhaarNumber, dateOfBirth } = req.body;

            const { checkForDuplicates } = await import('../services/duplicateDetectionService');
            const result = await checkForDuplicates({
                fullName,
                mobileNumber,
                aadhaarNumber,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
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
     * Find all potential duplicates in the system
     */
    static async findAllDuplicates(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { findAllDuplicates } = await import('../services/duplicateDetectionService');
            const duplicates = await findAllDuplicates();

            res.json({
                success: true,
                data: {
                    duplicates,
                    count: duplicates.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
