"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHealthCondition = exports.updateHealthCondition = exports.createHealthCondition = exports.getHealthConditionById = exports.getHealthConditions = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getHealthConditions = async (req, res) => {
    try {
        const { severity, isActive } = req.query;
        const where = {};
        if (severity) {
            where.severity = severity;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const healthConditions = await prisma_1.default.healthCondition.findMany({
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
        const formattedConditions = healthConditions.map(condition => ({
            ...condition,
            citizenCount: condition._count.SeniorCitizen,
        }));
        return res.json({
            success: true,
            data: formattedConditions,
        });
    }
    catch (error) {
        console.error('Get health conditions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching health conditions',
        });
    }
};
exports.getHealthConditions = getHealthConditions;
const getHealthConditionById = async (req, res) => {
    try {
        const { id } = req.params;
        const healthCondition = await prisma_1.default.healthCondition.findUnique({
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
        if (!healthCondition) {
            return res.status(404).json({
                success: false,
                message: 'Health condition not found',
            });
        }
        return res.json({
            success: true,
            data: healthCondition,
        });
    }
    catch (error) {
        console.error('Get health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching health condition',
        });
    }
};
exports.getHealthConditionById = getHealthConditionById;
const createHealthCondition = async (req, res) => {
    try {
        const { code, name, description, severity, requiresSpecialCare, isActive } = req.body;
        const existing = await prisma_1.default.healthCondition.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Health condition code already exists',
            });
        }
        const healthCondition = await prisma_1.default.healthCondition.create({
            data: {
                code,
                name,
                description,
                severity: severity || 'MEDIUM',
                requiresSpecialCare: requiresSpecialCare || false,
                isActive: isActive !== undefined ? isActive : true,
            },
        });
        return res.status(201).json({
            success: true,
            data: healthCondition,
            message: 'Health condition created successfully',
        });
    }
    catch (error) {
        console.error('Create health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating health condition',
        });
    }
};
exports.createHealthCondition = createHealthCondition;
const updateHealthCondition = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description, severity, requiresSpecialCare, isActive } = req.body;
        if (code) {
            const existing = await prisma_1.default.healthCondition.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Health condition code already exists',
                });
            }
        }
        const healthCondition = await prisma_1.default.healthCondition.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(description && { description }),
                ...(severity && { severity }),
                ...(requiresSpecialCare !== undefined && { requiresSpecialCare }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        return res.json({
            success: true,
            data: healthCondition,
            message: 'Health condition updated successfully',
        });
    }
    catch (error) {
        console.error('Update health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating health condition',
        });
    }
};
exports.updateHealthCondition = updateHealthCondition;
const deleteHealthCondition = async (req, res) => {
    try {
        const { id } = req.params;
        const healthCondition = await prisma_1.default.healthCondition.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        SeniorCitizen: true,
                    },
                },
            },
        });
        if (!healthCondition) {
            return res.status(404).json({
                success: false,
                message: 'Health condition not found',
            });
        }
        if (healthCondition._count.SeniorCitizen > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete health condition with associated citizens',
            });
        }
        await prisma_1.default.healthCondition.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Health condition deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting health condition',
        });
    }
};
exports.deleteHealthCondition = deleteHealthCondition;
//# sourceMappingURL=healthConditionController.js.map