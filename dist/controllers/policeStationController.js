"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePoliceStation = exports.updatePoliceStation = exports.createPoliceStation = exports.getPoliceStationById = exports.getPoliceStations = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getPoliceStations = async (req, res) => {
    try {
        const { search, districtId, rangeId, subDivisionId, isActive } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (districtId) {
            where.districtId = districtId;
        }
        if (rangeId) {
            where.rangeId = rangeId;
        }
        if (subDivisionId) {
            where.subDivisionId = subDivisionId;
        }
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
                where.id = scope.jurisdictionIds.policeStationId;
            }
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const policeStations = await prisma_1.default.policeStation.findMany({
            where,
            include: {
                Range: true,
                District: true,
                SubDivision: true,
                _count: {
                    select: {
                        Beat: true,
                        SeniorCitizen: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const formattedStations = policeStations.map(station => ({
            id: station.id,
            code: station.code,
            name: station.name,
            address: station.address,
            phone: station.phone,
            email: station.email,
            latitude: station.latitude,
            longitude: station.longitude,
            rangeId: station.rangeId,
            rangeName: station.Range.name,
            rangeCode: station.Range.code,
            districtId: station.districtId,
            districtName: station.District.name,
            districtCode: station.District.code,
            subDivisionId: station.subDivisionId,
            subDivisionName: station.SubDivision.name,
            subDivisionCode: station.SubDivision.code,
            isActive: station.isActive,
            beatCount: station._count.Beat,
            citizenCount: station._count.SeniorCitizen,
        }));
        return res.json({
            success: true,
            data: formattedStations,
        });
    }
    catch (error) {
        console.error('Get police stations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching police stations',
        });
    }
};
exports.getPoliceStations = getPoliceStations;
const getPoliceStationById = async (req, res) => {
    try {
        const { id } = req.params;
        const policeStation = await prisma_1.default.policeStation.findUnique({
            where: { id },
            include: {
                Range: true,
                District: true,
                SubDivision: true,
                Beat: {
                    include: {
                        BeatOfficer: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        Beat: true,
                        SeniorCitizen: true,
                    },
                },
            },
        });
        if (!policeStation) {
            return res.status(404).json({
                success: false,
                message: 'Police station not found',
            });
        }
        return res.json({
            success: true,
            data: {
                ...policeStation,
                rangeName: policeStation.Range.name,
                districtName: policeStation.District.name,
                subDivisionName: policeStation.SubDivision.name,
                beatCount: policeStation._count.Beat,
                citizenCount: policeStation._count.SeniorCitizen,
            },
        });
    }
    catch (error) {
        console.error('Get police station error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching police station',
        });
    }
};
exports.getPoliceStationById = getPoliceStationById;
const createPoliceStation = async (req, res) => {
    try {
        const { code, name, address, phone, email, latitude, longitude, rangeId, districtId, subDivisionId, isActive } = req.body;
        // Validate required fields
        if (!code || !name || !address || !rangeId || !districtId || !subDivisionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: code, name, address, rangeId, districtId, subDivisionId',
            });
        }
        // Validate SubDivision exists and belongs to the correct District
        const subDivision = await prisma_1.default.subDivision.findUnique({
            where: { id: subDivisionId },
            include: {
                District: true,
            },
        });
        if (!subDivision) {
            return res.status(400).json({
                success: false,
                message: 'SubDivision not found',
            });
        }
        if (subDivision.districtId !== districtId) {
            return res.status(400).json({
                success: false,
                message: 'SubDivision does not belong to the specified District',
            });
        }
        if (subDivision.District.rangeId !== rangeId) {
            return res.status(400).json({
                success: false,
                message: 'District does not belong to the specified Range',
            });
        }
        // Check if code already exists
        const existing = await prisma_1.default.policeStation.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Police station code already exists',
            });
        }
        const policeStation = await prisma_1.default.policeStation.create({
            data: {
                code,
                name,
                address,
                phone,
                email,
                latitude,
                longitude,
                rangeId,
                districtId,
                subDivisionId,
                isActive: isActive !== undefined ? isActive : true,
            },
            include: {
                Range: true,
                District: true,
                SubDivision: true,
            },
        });
        return res.status(201).json({
            success: true,
            data: {
                ...policeStation,
                rangeName: policeStation.Range.name,
                districtName: policeStation.District.name,
                subDivisionName: policeStation.SubDivision.name,
            },
            message: 'Police station created successfully',
        });
    }
    catch (error) {
        console.error('Create police station error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating police station',
        });
    }
};
exports.createPoliceStation = createPoliceStation;
const updatePoliceStation = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, address, phone, email, latitude, longitude, rangeId, districtId, subDivisionId, isActive } = req.body;
        // Check if police station exists
        const existing = await prisma_1.default.policeStation.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Police station not found',
            });
        }
        // If subDivisionId is being changed, validate hierarchy
        if (subDivisionId && subDivisionId !== existing.subDivisionId) {
            const subDivision = await prisma_1.default.subDivision.findUnique({
                where: { id: subDivisionId },
                include: {
                    District: true,
                },
            });
            if (!subDivision) {
                return res.status(400).json({
                    success: false,
                    message: 'SubDivision not found',
                });
            }
            // Validate district and range match
            const targetDistrictId = districtId || existing.districtId;
            const targetRangeId = rangeId || existing.rangeId;
            if (subDivision.districtId !== targetDistrictId) {
                return res.status(400).json({
                    success: false,
                    message: 'SubDivision does not belong to the specified District',
                });
            }
            if (subDivision.District.rangeId !== targetRangeId) {
                return res.status(400).json({
                    success: false,
                    message: 'District does not belong to the specified Range',
                });
            }
        }
        // Check if code is being changed and already exists
        if (code && code !== existing.code) {
            const duplicate = await prisma_1.default.policeStation.findUnique({
                where: { code },
            });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Police station code already exists',
                });
            }
        }
        const policeStation = await prisma_1.default.policeStation.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(address && { address }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(rangeId && { rangeId }),
                ...(districtId && { districtId }),
                ...(subDivisionId && { subDivisionId }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                Range: true,
                District: true,
                SubDivision: true,
            },
        });
        return res.json({
            success: true,
            data: {
                ...policeStation,
                rangeName: policeStation.Range.name,
                districtName: policeStation.District.name,
                subDivisionName: policeStation.SubDivision.name,
            },
            message: 'Police station updated successfully',
        });
    }
    catch (error) {
        console.error('Update police station error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating police station',
        });
    }
};
exports.updatePoliceStation = updatePoliceStation;
const deletePoliceStation = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if police station has associated data
        const station = await prisma_1.default.policeStation.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        Beat: true,
                        SeniorCitizen: true,
                    },
                },
            },
        });
        if (!station) {
            return res.status(404).json({
                success: false,
                message: 'Police station not found',
            });
        }
        if (station._count.Beat > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete police station. It has ${station._count.Beat} associated beat(s).`,
            });
        }
        if (station._count.SeniorCitizen > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete police station. It has ${station._count.SeniorCitizen} associated citizen(s).`,
            });
        }
        await prisma_1.default.policeStation.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Police station deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete police station error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting police station',
        });
    }
};
exports.deletePoliceStation = deletePoliceStation;
//# sourceMappingURL=policeStationController.js.map