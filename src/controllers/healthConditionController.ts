// Health Condition Controller
import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getHealthConditions = async (req: Request, res: Response) => {
    try {
        const { severity, isActive } = req.query;

        const where: any = {};

        if (severity) {
            where.severity = severity;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const healthConditions = await prisma.healthCondition.findMany({
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
    } catch (error) {
        console.error('Get health conditions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching health conditions',
        });
    }
};

export const getHealthConditionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const healthCondition = await prisma.healthCondition.findUnique({
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
    } catch (error) {
        console.error('Get health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching health condition',
        });
    }
};

export const createHealthCondition = async (req: Request, res: Response) => {
    try {
        const { code, name, description, severity, requiresSpecialCare, isActive } = req.body;

        const existing = await prisma.healthCondition.findUnique({
            where: { code },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Health condition code already exists',
            });
        }

        const healthCondition = await prisma.healthCondition.create({
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
    } catch (error) {
        console.error('Create health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating health condition',
        });
    }
};

export const updateHealthCondition = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, description, severity, requiresSpecialCare, isActive } = req.body;

        if (code) {
            const existing = await prisma.healthCondition.findFirst({
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

        const healthCondition = await prisma.healthCondition.update({
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
    } catch (error) {
        console.error('Update health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating health condition',
        });
    }
};

export const deleteHealthCondition = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const healthCondition = await prisma.healthCondition.findUnique({
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

        await prisma.healthCondition.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Health condition deleted successfully',
        });
    } catch (error) {
        console.error('Delete health condition error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting health condition',
        });
    }
};
