"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDistrict = exports.updateDistrict = exports.createDistrict = exports.getDistrictById = exports.getDistricts = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getDistricts = async (req, res) => {
    try {
        const { range, rangeId, isActive } = req.query;
        const where = {};
        // Support both range name (deprecated) and rangeId
        if (rangeId) {
            where.rangeId = rangeId;
        }
        else if (range) {
            // Fallback to range name for backward compatibility
            where.Range = {
                name: range
            };
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const districts = await prisma_1.default.district.findMany({
            where,
            include: {
                Range: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        PoliceStation: true,
                        SeniorCitizen: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const formattedDistricts = districts.map(district => ({
            ...district,
            rangeName: district.Range?.name,
            rangeCode: district.Range?.code,
            policeStationCount: district._count.PoliceStation,
            citizenCount: district._count.SeniorCitizen,
        }));
        return res.json({
            success: true,
            data: formattedDistricts,
        });
    }
    catch (error) {
        console.error('Get districts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching districts',
        });
    }
};
exports.getDistricts = getDistricts;
const getDistrictById = async (req, res) => {
    try {
        const { id } = req.params;
        const district = await prisma_1.default.district.findUnique({
            where: { id },
            include: {
                PoliceStation: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        PoliceStation: true,
                        SeniorCitizen: true,
                    },
                },
            },
        });
        if (!district) {
            return res.status(404).json({
                success: false,
                message: 'District not found',
            });
        }
        return res.json({
            success: true,
            data: district,
        });
    }
    catch (error) {
        console.error('Get district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching district',
        });
    }
};
exports.getDistrictById = getDistrictById;
const createDistrict = async (req, res) => {
    try {
        const { code, name, rangeId, area, population, headquarters, isActive } = req.body;
        // Validate rangeId exists
        if (rangeId) {
            const range = await prisma_1.default.range.findUnique({ where: { id: rangeId } });
            if (!range) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid range ID',
                });
            }
        }
        const existing = await prisma_1.default.district.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'District code already exists',
            });
        }
        const district = await prisma_1.default.district.create({
            data: {
                code,
                name,
                rangeId,
                area,
                population: population || 0,
                headquarters,
                isActive: isActive !== undefined ? isActive : true,
            },
            include: {
                Range: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return res.status(201).json({
            success: true,
            data: district,
            message: 'District created successfully',
        });
    }
    catch (error) {
        console.error('Create district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating district',
        });
    }
};
exports.createDistrict = createDistrict;
const updateDistrict = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, rangeId, area, population, headquarters, isActive } = req.body;
        // Validate rangeId if provided
        if (rangeId) {
            const range = await prisma_1.default.range.findUnique({ where: { id: rangeId } });
            if (!range) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid range ID',
                });
            }
        }
        if (code) {
            const existing = await prisma_1.default.district.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'District code already exists',
                });
            }
        }
        const district = await prisma_1.default.district.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(rangeId && { rangeId }),
                ...(area && { area }),
                ...(population !== undefined && { population }),
                ...(headquarters && { headquarters }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                Range: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return res.json({
            success: true,
            data: district,
            message: 'District updated successfully',
        });
    }
    catch (error) {
        console.error('Update district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating district',
        });
    }
};
exports.updateDistrict = updateDistrict;
const deleteDistrict = async (req, res) => {
    try {
        const { id } = req.params;
        const district = await prisma_1.default.district.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        PoliceStation: true,
                        SeniorCitizen: true,
                    },
                },
            },
        });
        if (!district) {
            return res.status(404).json({
                success: false,
                message: 'District not found',
            });
        }
        if (district._count.PoliceStation > 0 || district._count.SeniorCitizen > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete district with associated police stations or citizens',
            });
        }
        await prisma_1.default.district.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'District deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting district',
        });
    }
};
exports.deleteDistrict = deleteDistrict;
//# sourceMappingURL=districtController.js.map