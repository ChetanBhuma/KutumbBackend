"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLivingArrangement = exports.updateLivingArrangement = exports.createLivingArrangement = exports.getLivingArrangementById = exports.getLivingArrangements = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getLivingArrangements = async (req, res) => {
    try {
        const { riskLevel, isActive } = req.query;
        const where = {};
        if (riskLevel) {
            where.riskLevel = riskLevel;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const arrangements = await prisma_1.default.livingArrangement.findMany({
            where,
            include: {
                _count: {
                    select: {
                        SeniorCitizen: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const formattedArrangements = arrangements.map(arrangement => ({
            ...arrangement,
            citizenCount: arrangement._count.SeniorCitizen,
        }));
        return res.json({
            success: true,
            data: formattedArrangements,
        });
    }
    catch (error) {
        console.error('Get living arrangements error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching living arrangements',
        });
    }
};
exports.getLivingArrangements = getLivingArrangements;
const getLivingArrangementById = async (req, res) => {
    try {
        const { id } = req.params;
        const arrangement = await prisma_1.default.livingArrangement.findUnique({
            where: { id },
            include: {
                SeniorCitizen: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!arrangement) {
            return res.status(404).json({
                success: false,
                message: 'Living arrangement not found',
            });
        }
        return res.json({
            success: true,
            data: arrangement,
        });
    }
    catch (error) {
        console.error('Get living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching living arrangement',
        });
    }
};
exports.getLivingArrangementById = getLivingArrangementById;
const createLivingArrangement = async (req, res) => {
    try {
        const { code, name, description, requiresCaretaker, riskLevel, isActive } = req.body;
        const existing = await prisma_1.default.livingArrangement.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Living arrangement code already exists',
            });
        }
        const arrangement = await prisma_1.default.livingArrangement.create({
            data: {
                code,
                name,
                description,
                requiresCaretaker: requiresCaretaker || false,
                riskLevel: riskLevel || 'LOW',
                isActive: isActive !== undefined ? isActive : true,
            },
        });
        return res.status(201).json({
            success: true,
            data: arrangement,
            message: 'Living arrangement created successfully',
        });
    }
    catch (error) {
        console.error('Create living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating living arrangement',
        });
    }
};
exports.createLivingArrangement = createLivingArrangement;
const updateLivingArrangement = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description, requiresCaretaker, riskLevel, isActive } = req.body;
        if (code) {
            const existing = await prisma_1.default.livingArrangement.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Living arrangement code already exists',
                });
            }
        }
        const arrangement = await prisma_1.default.livingArrangement.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(description && { description }),
                ...(requiresCaretaker !== undefined && { requiresCaretaker }),
                ...(riskLevel && { riskLevel }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        return res.json({
            success: true,
            data: arrangement,
            message: 'Living arrangement updated successfully',
        });
    }
    catch (error) {
        console.error('Update living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating living arrangement',
        });
    }
};
exports.updateLivingArrangement = updateLivingArrangement;
const deleteLivingArrangement = async (req, res) => {
    try {
        const { id } = req.params;
        const arrangement = await prisma_1.default.livingArrangement.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        SeniorCitizen: true,
                    },
                },
            },
        });
        if (!arrangement) {
            return res.status(404).json({
                success: false,
                message: 'Living arrangement not found',
            });
        }
        if (arrangement._count.SeniorCitizen > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete living arrangement with associated citizens',
            });
        }
        await prisma_1.default.livingArrangement.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Living arrangement deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting living arrangement',
        });
    }
};
exports.deleteLivingArrangement = deleteLivingArrangement;
//# sourceMappingURL=livingArrangementController.js.map