// Living Arrangement Controller
import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getLivingArrangements = async (req: Request, res: Response) => {
    try {
        const { riskLevel, isActive } = req.query;

        const where: any = {};

        if (riskLevel) {
            where.riskLevel = riskLevel;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const arrangements = await prisma.livingArrangement.findMany({
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
    } catch (error) {
        console.error('Get living arrangements error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching living arrangements',
        });
    }
};

export const getLivingArrangementById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const arrangement = await prisma.livingArrangement.findUnique({
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
    } catch (error) {
        console.error('Get living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching living arrangement',
        });
    }
};

export const createLivingArrangement = async (req: Request, res: Response) => {
    try {
        const { code, name, description, requiresCaretaker, riskLevel, isActive } = req.body;

        const existing = await prisma.livingArrangement.findUnique({
            where: { code },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Living arrangement code already exists',
            });
        }

        const arrangement = await prisma.livingArrangement.create({
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
    } catch (error) {
        console.error('Create living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating living arrangement',
        });
    }
};

export const updateLivingArrangement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, description, requiresCaretaker, riskLevel, isActive } = req.body;

        if (code) {
            const existing = await prisma.livingArrangement.findFirst({
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

        const arrangement = await prisma.livingArrangement.update({
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
    } catch (error) {
        console.error('Update living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating living arrangement',
        });
    }
};

export const deleteLivingArrangement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const arrangement = await prisma.livingArrangement.findUnique({
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

        await prisma.livingArrangement.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Living arrangement deleted successfully',
        });
    } catch (error) {
        console.error('Delete living arrangement error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting living arrangement',
        });
    }
};
