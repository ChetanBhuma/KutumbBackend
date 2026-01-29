"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const pagination_1 = require("../utils/pagination");
const queryBuilder_1 = require("../utils/queryBuilder");
const workflowValidation_1 = require("../utils/workflowValidation");
const vulnerabilityService_1 = require("../services/vulnerabilityService");
const dataValidation_1 = require("../utils/dataValidation");
class CitizenController {
    /**
     * Get all citizens with pagination and filters
     */
    /**
     * Get all citizens with pagination and filters
     */
    static async list(req, res, next) {
        try {
            // Prepare query for buildWhereClause
            const query = { ...req.query };
            if (query.verificationStatus) {
                query.idVerificationStatus = query.verificationStatus;
            }
            const where = (0, queryBuilder_1.buildWhereClause)(query, {
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
                }
                else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                }
                else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                }
                else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                }
                else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }
            if (where.isActive === undefined) {
                where.isActive = true;
            }
            const result = await (0, pagination_1.paginatedQuery)(database_1.prisma.seniorCitizen, {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                where,
                include: {
                    PoliceStation: {
                        select: { id: true, name: true, code: true }
                    },
                    Beat: {
                        select: { id: true, name: true, code: true }
                    },
                    FamilyMember: true,
                    EmergencyContact: true
                },
                orderBy: (0, queryBuilder_1.buildOrderBy)(req.query, { createdAt: 'desc' })
            });
            res.json({
                success: true,
                data: {
                    citizens: result.items,
                    pagination: result.pagination
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get citizens for map view
     */
    static async map(req, res, next) {
        // For now, reuse list logic but we can optimize later to return only necessary fields
        return CitizenController.list(req, res, next);
    }
    /**
     * Get single citizen by ID
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const citizen = await database_1.prisma.seniorCitizen.findUnique({
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
                throw new errorHandler_1.AppError('Citizen not found', 404);
            }
            res.json({
                success: true,
                data: { citizen }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create new citizen
     */
    static async create(req, res, next) {
        try {
            const citizenData = req.body;
            // Check for duplicate mobile number
            const existingCitizen = await database_1.prisma.seniorCitizen.findFirst({
                where: {
                    mobileNumber: citizenData.mobileNumber,
                    isActive: true
                },
                select: { id: true, fullName: true, mobileNumber: true }
            });
            if (existingCitizen) {
                throw new errorHandler_1.AppError(`This mobile number (${citizenData.mobileNumber}) is already registered with ${existingCitizen.fullName}. Please use a different mobile number.`, 409);
            }
            // VALIDATION: Age must be >= 60
            const dob = new Date(citizenData.dateOfBirth);
            const ageValidation = (0, dataValidation_1.validateSeniorCitizenAge)(dob);
            if (!ageValidation.valid) {
                throw new errorHandler_1.AppError(ageValidation.message || 'Invalid age', 400);
            }
            // VALIDATION: Normalize Aadhaar if provided
            if (citizenData.aadhaarNumber) {
                if (!(0, dataValidation_1.validateAadhaar)(citizenData.aadhaarNumber)) {
                    throw new errorHandler_1.AppError('Invalid Aadhaar number format. Must be 12 digits.', 400);
                }
                citizenData.aadhaarNumber = (0, dataValidation_1.normalizeAadhaar)(citizenData.aadhaarNumber);
            }
            // Calculate age from DOB
            const age = ageValidation.age;
            // Generate Friendly ID (UUID for now, can be customized)
            const srCitizenUniqueId = `SC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            // Extract nested data
            const { familyMembers, emergencyContacts, householdHelp, spouseDetails, medicalHistory, ...mainData } = citizenData;
            // Create citizen with nested relations
            const citizen = await database_1.prisma.seniorCitizen.create({
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
            const { OfficerAssignmentService } = await Promise.resolve().then(() => __importStar(require('../services/officerAssignmentService')));
            let assignedOfficerId = null;
            if (citizen.beatId || citizen.policeStationId) {
                assignedOfficerId = await OfficerAssignmentService.assignOfficerToCitizen(citizen.id, citizen.beatId, citizen.policeStationId || undefined);
            }
            if (assignedOfficerId && citizen.policeStationId) {
                // Create Scheduled Visit
                await database_1.prisma.visit.create({
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
            logger_1.auditLogger.info('Citizen created successfully', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update citizen profile
     */
    static async updateProfile(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            // Prevent updating restricted fields
            delete updates.id;
            delete updates.createdAt;
            delete updates.updatedAt;
            delete updates.srCitizenUniqueId;
            // Check if citizen exists
            const existing = await database_1.prisma.seniorCitizen.findUnique({ where: { id } });
            if (!existing) {
                throw new errorHandler_1.AppError('Citizen not found', 404);
            }
            // CAPTURE CURRENT LOCATION BEFORE UPDATE (for address change detection)
            const oldBeatId = existing.beatId;
            const oldPoliceStationId = existing.policeStationId;
            const oldDistrictId = existing.districtId;
            const oldAddress = existing.permanentAddress;
            // Validate status transition if status is changing
            if (updates.status) {
                (0, workflowValidation_1.validateTransition)('CITIZEN', existing.status, updates.status);
            }
            // Recalculate age if DOB changed
            if (updates.dateOfBirth) {
                const dob = new Date(updates.dateOfBirth);
                updates.age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            }
            // Extract nested data
            const { familyMembers, emergencyContacts, householdHelp, spouseDetails, medicalHistory, ...mainData } = updates;
            // Update citizen
            const citizen = await database_1.prisma.seniorCitizen.update({
                where: { id },
                data: {
                    ...mainData,
                    submissionType: 'Update',
                    updatedBy: req.user?.email,
                    SpouseDetails: spouseDetails ? {
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
            // Log update
            logger_1.auditLogger.info('Citizen updated', {
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
                    await (0, vulnerabilityService_1.recalculateVulnerability)(id);
                    logger_1.auditLogger.info('Vulnerability score recalculated', {
                        citizenId: id,
                        triggeredBy: 'citizen_update'
                    });
                }
                catch (error) {
                    // Log but don't fail the update
                    logger_1.auditLogger.error('Vulnerability recalculation failed', {
                        citizenId: id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            // HANDLE ADDRESS CHANGE - Automatic re-verification workflow
            const locationChanged = (oldBeatId !== citizen.beatId ||
                oldPoliceStationId !== citizen.policeStationId ||
                oldDistrictId !== citizen.districtId);
            if (locationChanged) {
                logger_1.auditLogger.info('Location change detected', {
                    citizenId: citizen.id,
                    oldLocation: { beatId: oldBeatId, psId: oldPoliceStationId, districtId: oldDistrictId },
                    newLocation: { beatId: citizen.beatId, psId: citizen.policeStationId, districtId: citizen.districtId }
                });
                // Import services
                const { CitizenAddressChangeService } = await Promise.resolve().then(() => __importStar(require('../services/citizenAddressChangeService')));
                const { OfficerAssignmentService } = await Promise.resolve().then(() => __importStar(require('../services/officerAssignmentService')));
                // 1. Cancel all pending visits from old officer
                const cancelledCount = await CitizenAddressChangeService.cancelPendingVisits(citizen.id, 'Address changed - citizen moved to different jurisdiction', req.user?.email);
                // 2. Reassign to new beat officer (if beat changed)
                let newOfficerId = null;
                if (citizen.beatId && citizen.policeStationId) {
                    try {
                        newOfficerId = await OfficerAssignmentService.assignOfficerToCitizen(citizen.id, citizen.beatId, citizen.policeStationId);
                    }
                    catch (error) {
                        logger_1.auditLogger.warn('Officer assignment failed during address change', {
                            citizenId: citizen.id,
                            beatId: citizen.beatId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
                // 3. Create re-verification visit (if new officer assigned)
                if (newOfficerId && citizen.policeStationId) {
                    await CitizenAddressChangeService.createReVerificationVisit(citizen.id, newOfficerId, citizen.policeStationId, oldAddress);
                }
                // 4. Reset verification status to pending
                await CitizenAddressChangeService.resetVerificationStatus(citizen.id, 'Address changed - re-verification required');
                logger_1.auditLogger.info('Address change processed successfully', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete (soft delete) citizen
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            // Use soft delete cascade to handle related records
            const { handleCitizenSoftDelete } = await Promise.resolve().then(() => __importStar(require('../utils/softDeleteCascade')));
            const result = await handleCitizenSoftDelete(id);
            // Log deletion
            logger_1.auditLogger.warn('Citizen deleted with cascade', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update verification status
     */
    static async updateVerificationStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            const existing = await database_1.prisma.seniorCitizen.findUnique({ where: { id } });
            if (!existing) {
                throw new errorHandler_1.AppError('Citizen not found', 404);
            }
            (0, workflowValidation_1.validateTransition)('CITIZEN_VERIFICATION', existing.idVerificationStatus, status);
            let updates = {
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
            }
            else if (status === 'Rejected') {
                updates.status = 'REJECTED';
            }
            const citizen = await database_1.prisma.seniorCitizen.update({
                where: { id },
                data: updates
            });
            // Log verification
            logger_1.auditLogger.info('Citizen verification status updated', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Issue digital card
     */
    static async issueDigitalCard(req, res, next) {
        try {
            const { id } = req.params;
            // Generate card number
            const cardNumber = `SCID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const citizen = await database_1.prisma.seniorCitizen.update({
                where: { id },
                data: {
                    digitalCardIssued: true,
                    digitalCardNumber: cardNumber,
                    digitalCardIssueDate: new Date()
                }
            });
            // Log card issuance
            logger_1.auditLogger.info('Digital card issued', {
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get statistics
     */
    static async getStatistics(req, res, next) {
        try {
            // const { policeStationId, beatId } = req.query;
            const where = (0, queryBuilder_1.buildWhereClause)(req.query, {
                exactMatchFields: ['policeStationId', 'beatId'],
                booleanFields: ['isActive']
            });
            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                if (scope.level === 'RANGE' && scope.jurisdictionIds.rangeId) {
                    where.rangeId = scope.jurisdictionIds.rangeId;
                }
                else if (scope.level === 'DISTRICT' && scope.jurisdictionIds.districtId) {
                    where.districtId = scope.jurisdictionIds.districtId;
                }
                else if (scope.level === 'SUBDIVISION' && scope.jurisdictionIds.subDivisionId) {
                    where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                }
                else if (scope.level === 'POLICE_STATION' && scope.jurisdictionIds.policeStationId) {
                    where.policeStationId = scope.jurisdictionIds.policeStationId;
                }
                else if (scope.level === 'BEAT' && scope.jurisdictionIds.beatId) {
                    where.beatId = scope.jurisdictionIds.beatId;
                }
            }
            if (where.isActive === undefined) {
                where.isActive = true;
            }
            const [total, verified, pending, rejected, highVulnerability, mediumVulnerability, lowVulnerability, withDigitalCard] = await Promise.all([
                database_1.prisma.seniorCitizen.count({ where }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, idVerificationStatus: 'Verified' } }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, idVerificationStatus: 'Pending' } }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, idVerificationStatus: 'Rejected' } }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, vulnerabilityLevel: 'High' } }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, vulnerabilityLevel: 'Medium' } }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, vulnerabilityLevel: 'Low' } }),
                database_1.prisma.seniorCitizen.count({ where: { ...where, digitalCardIssued: true } })
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Check for duplicate citizens
     */
    static async checkDuplicates(req, res, next) {
        try {
            const { fullName, mobileNumber, aadhaarNumber, dateOfBirth } = req.body;
            const { checkForDuplicates } = await Promise.resolve().then(() => __importStar(require('../services/duplicateDetectionService')));
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Find all potential duplicates in the system
     */
    static async findAllDuplicates(_req, res, next) {
        try {
            const { findAllDuplicates } = await Promise.resolve().then(() => __importStar(require('../services/duplicateDetectionService')));
            const duplicates = await findAllDuplicates();
            res.json({
                success: true,
                data: {
                    duplicates,
                    count: duplicates.length
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CitizenController = CitizenController;
//# sourceMappingURL=citizenController.js.map