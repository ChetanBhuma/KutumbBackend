"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRange = exports.updateRange = exports.createRange = exports.getRangeById = exports.getRanges = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getRanges = async (req, res) => {
    try {
        const { isActive } = req.query;
        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const ranges = await prisma_1.default.range.findMany({
            where,
            include: {
                _count: {
                    select: {
                        districts: true,
                        PoliceStation: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const formattedRanges = ranges.map(range => ({
            ...range,
            districtCount: range._count.districts,
            policeStationCount: range._count.PoliceStation,
        }));
        return res.json({
            success: true,
            data: formattedRanges,
        });
    }
    catch (error) {
        console.error('Get ranges error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching ranges',
        });
    }
};
exports.getRanges = getRanges;
const getRangeById = async (req, res) => {
    try {
        const { id } = req.params;
        const range = await prisma_1.default.range.findUnique({
            where: { id },
            include: {
                districts: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        districts: true,
                        PoliceStation: true,
                    },
                },
            },
        });
        if (!range) {
            return res.status(404).json({
                success: false,
                message: 'Range not found',
            });
        }
        return res.json({
            success: true,
            data: range,
        });
    }
    catch (error) {
        console.error('Get range error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching range',
        });
    }
};
exports.getRangeById = getRangeById;
const createRange = async (req, res) => {
    try {
        const { code, name, isActive } = req.body;
        const existing = await prisma_1.default.range.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Range code already exists',
            });
        }
        const range = await prisma_1.default.range.create({
            data: {
                code,
                name,
                isActive: isActive !== undefined ? isActive : true,
            },
        });
        return res.status(201).json({
            success: true,
            data: range,
            message: 'Range created successfully',
        });
    }
    catch (error) {
        console.error('Create range error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating range',
        });
    }
};
exports.createRange = createRange;
const updateRange = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, isActive } = req.body;
        if (code) {
            const existing = await prisma_1.default.range.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Range code already exists',
                });
            }
        }
        const range = await prisma_1.default.range.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        return res.json({
            success: true,
            data: range,
            message: 'Range updated successfully',
        });
    }
    catch (error) {
        console.error('Update range error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating range',
        });
    }
};
exports.updateRange = updateRange;
const deleteRange = async (req, res) => {
    try {
        const { id } = req.params;
        const range = await prisma_1.default.range.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        districts: true,
                        PoliceStation: true,
                    },
                },
            },
        });
        if (!range) {
            return res.status(404).json({
                success: false,
                message: 'Range not found',
            });
        }
        if (range._count.districts > 0 || range._count.PoliceStation > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete range with associated districts or police stations',
            });
        }
        await prisma_1.default.range.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Range deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete range error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting range',
        });
    }
};
exports.deleteRange = deleteRange;
//# sourceMappingURL=rangeController.js.map