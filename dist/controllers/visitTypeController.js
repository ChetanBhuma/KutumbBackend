"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVisitType = exports.updateVisitType = exports.createVisitType = exports.getVisitTypeById = exports.getVisitTypes = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getVisitTypes = async (req, res) => {
    try {
        const { isActive } = req.query;
        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const visitTypes = await prisma_1.default.visitType.findMany({
            where,
            orderBy: { priority: 'asc' },
        });
        return res.json({
            success: true,
            data: visitTypes,
        });
    }
    catch (error) {
        console.error('Get visit types error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching visit types',
        });
    }
};
exports.getVisitTypes = getVisitTypes;
const getVisitTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const visitType = await prisma_1.default.visitType.findUnique({
            where: { id },
        });
        if (!visitType) {
            return res.status(404).json({
                success: false,
                message: 'Visit type not found',
            });
        }
        return res.json({
            success: true,
            data: visitType,
        });
    }
    catch (error) {
        console.error('Get visit type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching visit type',
        });
    }
};
exports.getVisitTypeById = getVisitTypeById;
const createVisitType = async (req, res) => {
    try {
        const { code, name, description, defaultDuration, requiresApproval, priority, isActive } = req.body;
        // Check if code already exists
        const existing = await prisma_1.default.visitType.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Visit type code already exists',
            });
        }
        const visitType = await prisma_1.default.visitType.create({
            data: {
                code,
                name,
                description,
                defaultDuration: defaultDuration || 30,
                requiresApproval: requiresApproval || false,
                priority: priority || 3,
                isActive: isActive !== undefined ? isActive : true,
            },
        });
        return res.status(201).json({
            success: true,
            data: visitType,
            message: 'Visit type created successfully',
        });
    }
    catch (error) {
        console.error('Create visit type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating visit type',
        });
    }
};
exports.createVisitType = createVisitType;
const updateVisitType = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description, defaultDuration, requiresApproval, priority, isActive } = req.body;
        // Check if code is being changed and already exists
        if (code) {
            const existing = await prisma_1.default.visitType.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Visit type code already exists',
                });
            }
        }
        const visitType = await prisma_1.default.visitType.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(description && { description }),
                ...(defaultDuration && { defaultDuration }),
                ...(requiresApproval !== undefined && { requiresApproval }),
                ...(priority && { priority }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        return res.json({
            success: true,
            data: visitType,
            message: 'Visit type updated successfully',
        });
    }
    catch (error) {
        console.error('Update visit type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating visit type',
        });
    }
};
exports.updateVisitType = updateVisitType;
const deleteVisitType = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if visit type exists
        const visitType = await prisma_1.default.visitType.findUnique({
            where: { id },
        });
        if (!visitType) {
            return res.status(404).json({
                success: false,
                message: 'Visit type not found',
            });
        }
        // Note: Cannot check for associated visits as relation doesn't exist in schema
        await prisma_1.default.visitType.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Visit type deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete visit type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting visit type',
        });
    }
};
exports.deleteVisitType = deleteVisitType;
//# sourceMappingURL=visitTypeController.js.map