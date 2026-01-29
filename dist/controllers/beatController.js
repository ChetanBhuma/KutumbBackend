"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeatController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
class BeatController {
    /**
     * Get all beats with full hierarchy
     */
    static async list(req, res, next) {
        try {
            const { policeStationId, subDivisionId, districtId, rangeId, search, isActive } = req.query;
            const where = {};
            // Search filter
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                    { beatNumber: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Hierarchy filters
            if (policeStationId) {
                where.policeStationId = String(policeStationId);
            }
            if (subDivisionId) {
                where.subDivisionId = String(subDivisionId);
            }
            if (districtId) {
                where.districtId = String(districtId);
            }
            if (rangeId) {
                where.rangeId = String(rangeId);
            }
            // Apply Data Scope
            const scope = req.dataScope;
            if (scope && scope.level !== 'ALL') {
                let scoped = false;
                if (scope.level === 'RANGE') {
                    if (scope.jurisdictionIds.rangeId) {
                        where.rangeId = scope.jurisdictionIds.rangeId;
                        scoped = true;
                    }
                }
                else if (scope.level === 'DISTRICT') {
                    if (scope.jurisdictionIds.districtId) {
                        where.districtId = scope.jurisdictionIds.districtId;
                        scoped = true;
                    }
                }
                else if (scope.level === 'SUBDIVISION') {
                    if (scope.jurisdictionIds.subDivisionId) {
                        where.subDivisionId = scope.jurisdictionIds.subDivisionId;
                        scoped = true;
                    }
                }
                else if (scope.level === 'POLICE_STATION') {
                    if (scope.jurisdictionIds.policeStationId) {
                        where.policeStationId = scope.jurisdictionIds.policeStationId;
                        scoped = true;
                    }
                }
                else if (scope.level === 'BEAT') {
                    if (scope.jurisdictionIds.beatId) {
                        where.id = scope.jurisdictionIds.beatId;
                        scoped = true;
                    }
                }
                // SECURITY: If scope is restricted but we couldn't apply a filter (e.g., missing profile ID),
                // we MUST return empty result instead of leaking all data.
                if (!scoped) {
                    return res.json({
                        success: true,
                        data: [],
                    });
                }
            }
            if (isActive !== undefined) {
                where.isActive = isActive === 'true';
            }
            const beats = await database_1.prisma.beat.findMany({
                where,
                include: {
                    Range: true,
                    District: true,
                    SubDivision: true,
                    PoliceStation: true,
                    _count: {
                        select: {
                            BeatOfficer: true,
                            SeniorCitizen: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            // Format response with full hierarchy
            const formattedBeats = beats.map(beat => ({
                id: beat.id,
                code: beat.code,
                name: beat.name,
                beatNumber: beat.beatNumber,
                exactLocation: beat.exactLocation,
                landArea: beat.landArea,
                boundaries: beat.boundaries,
                description: beat.description,
                policeStationId: beat.policeStationId,
                policeStationName: beat.PoliceStation.name,
                policeStationCode: beat.PoliceStation.code,
                subDivisionId: beat.subDivisionId,
                subDivisionName: beat.SubDivision?.name || '',
                subDivisionCode: beat.SubDivision?.code || '',
                districtId: beat.districtId,
                districtName: beat.District?.name || '',
                districtCode: beat.District?.code || '',
                rangeId: beat.rangeId,
                rangeName: beat.Range?.name || '',
                rangeCode: beat.Range?.code || '',
                isActive: beat.isActive,
                officerCount: beat._count.BeatOfficer,
                citizenCount: beat._count.SeniorCitizen,
            }));
            res.json({
                success: true,
                data: formattedBeats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get beat by ID with full details
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const beat = await database_1.prisma.beat.findUnique({
                where: { id },
                include: {
                    Range: true,
                    District: true,
                    SubDivision: true,
                    PoliceStation: true,
                    BeatOfficer: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            rank: true,
                            badgeNumber: true,
                            mobileNumber: true,
                        },
                    },
                    SeniorCitizen: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            fullName: true,
                            mobileNumber: true,
                            vulnerabilityLevel: true,
                            permanentAddress: true,
                        },
                    },
                    _count: {
                        select: {
                            BeatOfficer: true,
                            SeniorCitizen: true,
                        },
                    },
                },
            });
            if (!beat) {
                throw new errorHandler_1.AppError('Beat not found', 404);
            }
            res.json({
                success: true,
                data: {
                    ...beat,
                    rangeName: beat.Range?.name || '',
                    districtName: beat.District?.name || '',
                    subDivisionName: beat.SubDivision?.name || '',
                    policeStationName: beat.PoliceStation.name,
                    officerCount: beat._count.BeatOfficer,
                    citizenCount: beat._count.SeniorCitizen,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create new beat with hierarchy validation
     */
    static async create(req, res, next) {
        try {
            const { code, name, beatNumber, policeStationId, exactLocation, landArea, boundaries, description, isActive, } = req.body;
            // Validate required fields
            if (!code || !name || !policeStationId) {
                throw new errorHandler_1.AppError('Missing required fields: code, name, policeStationId', 400);
            }
            // Check if code already exists
            const existing = await database_1.prisma.beat.findUnique({
                where: { code },
            });
            if (existing) {
                throw new errorHandler_1.AppError('Beat with this code already exists', 409);
            }
            // Get police station to populate hierarchy
            const policeStation = await database_1.prisma.policeStation.findUnique({
                where: { id: policeStationId },
                include: {
                    SubDivision: true,
                    District: true,
                    Range: true,
                },
            });
            if (!policeStation) {
                throw new errorHandler_1.AppError('Police station not found', 404);
            }
            // Create beat with full hierarchy
            const beat = await database_1.prisma.beat.create({
                data: {
                    code,
                    name,
                    beatNumber,
                    policeStationId,
                    subDivisionId: policeStation.subDivisionId,
                    districtId: policeStation.districtId,
                    rangeId: policeStation.rangeId,
                    exactLocation,
                    landArea,
                    boundaries: boundaries || undefined,
                    description,
                    isActive: isActive !== undefined ? isActive : true,
                },
                include: {
                    Range: true,
                    District: true,
                    SubDivision: true,
                    PoliceStation: true,
                },
            });
            logger_1.auditLogger.info('Beat created', {
                beatId: beat.id,
                beatName: beat.name,
                beatCode: beat.code,
                createdBy: req.user?.email,
                timestamp: new Date().toISOString(),
            });
            res.status(201).json({
                success: true,
                data: {
                    ...beat,
                    rangeName: beat.Range?.name || '',
                    districtName: beat.District?.name || '',
                    subDivisionName: beat.SubDivision?.name || '',
                    policeStationName: beat.PoliceStation.name,
                },
                message: 'Beat created successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update beat
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { code, name, beatNumber, policeStationId, exactLocation, landArea, boundaries, description, isActive, } = req.body;
            // Check if beat exists
            const existing = await database_1.prisma.beat.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new errorHandler_1.AppError('Beat not found', 404);
            }
            // If code is being changed, check for duplicates
            if (code && code !== existing.code) {
                const duplicate = await database_1.prisma.beat.findUnique({
                    where: { code },
                });
                if (duplicate) {
                    throw new errorHandler_1.AppError('Beat with this code already exists', 409);
                }
            }
            // If police station is being changed, update hierarchy
            let hierarchyUpdate = {};
            if (policeStationId && policeStationId !== existing.policeStationId) {
                const policeStation = await database_1.prisma.policeStation.findUnique({
                    where: { id: policeStationId },
                });
                if (!policeStation) {
                    throw new errorHandler_1.AppError('Police station not found', 404);
                }
                hierarchyUpdate = {
                    policeStationId,
                    subDivisionId: policeStation.subDivisionId,
                    districtId: policeStation.districtId,
                    rangeId: policeStation.rangeId,
                };
            }
            const beat = await database_1.prisma.beat.update({
                where: { id },
                data: {
                    ...(code && { code }),
                    ...(name && { name }),
                    ...(beatNumber !== undefined && { beatNumber }),
                    ...(exactLocation !== undefined && { exactLocation }),
                    ...(landArea !== undefined && { landArea }),
                    ...(boundaries !== undefined && { boundaries }),
                    ...(description !== undefined && { description }),
                    ...(isActive !== undefined && { isActive }),
                    ...hierarchyUpdate,
                },
                include: {
                    Range: true,
                    District: true,
                    SubDivision: true,
                    PoliceStation: true,
                },
            });
            logger_1.auditLogger.info('Beat updated', {
                beatId: beat.id,
                beatName: beat.name,
                updatedBy: req.user?.email,
                timestamp: new Date().toISOString(),
            });
            res.json({
                success: true,
                data: {
                    ...beat,
                    rangeName: beat.Range?.name || '',
                    districtName: beat.District?.name || '',
                    subDivisionName: beat.SubDivision?.name || '',
                    policeStationName: beat.PoliceStation.name,
                },
                message: 'Beat updated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete beat (soft delete)
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            // Check if beat has assigned officers or citizens
            const beat = await database_1.prisma.beat.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { BeatOfficer: true, SeniorCitizen: true },
                    },
                },
            });
            if (!beat) {
                throw new errorHandler_1.AppError('Beat not found', 404);
            }
            if (beat._count.BeatOfficer > 0) {
                throw new errorHandler_1.AppError(`Cannot delete beat. It has ${beat._count.BeatOfficer} assigned officer(s).`, 400);
            }
            if (beat._count.SeniorCitizen > 0) {
                throw new errorHandler_1.AppError(`Cannot delete beat. It has ${beat._count.SeniorCitizen} assigned citizen(s).`, 400);
            }
            // Soft delete
            await database_1.prisma.beat.update({
                where: { id },
                data: { isActive: false },
            });
            logger_1.auditLogger.warn('Beat deleted', {
                beatId: beat.id,
                beatName: beat.name,
                deletedBy: req.user?.email,
                timestamp: new Date().toISOString(),
            });
            res.json({
                success: true,
                message: 'Beat deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BeatController = BeatController;
exports.default = BeatController;
//# sourceMappingURL=beatController.js.map