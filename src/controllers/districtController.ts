// District Controller
import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getDistricts = async (req: Request, res: Response) => {
    try {
        const { range, rangeId, isActive } = req.query;

        const where: any = {};

        // Support both range name (deprecated) and rangeId
        if (rangeId) {
            where.rangeId = rangeId;
        } else if (range) {
            // Fallback to range name for backward compatibility
            where.Range = {
                name: range
            };
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const districts = await prisma.district.findMany({
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
    } catch (error) {
        console.error('Get districts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching districts',
        });
    }
};

export const getDistrictById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const district = await prisma.district.findUnique({
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
    } catch (error) {
        console.error('Get district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching district',
        });
    }
};

export const createDistrict = async (req: Request, res: Response) => {
    try {
        const { code, name, rangeId, area, population, headquarters, isActive } = req.body;

        // Validate rangeId exists
        if (rangeId) {
            const range = await prisma.range.findUnique({ where: { id: rangeId } });
            if (!range) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid range ID',
                });
            }
        }

        const existing = await prisma.district.findUnique({
            where: { code },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'District code already exists',
            });
        }

        const district = await prisma.district.create({
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
    } catch (error) {
        console.error('Create district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating district',
        });
    }
};

export const updateDistrict = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, rangeId, area, population, headquarters, isActive } = req.body;

        // Validate rangeId if provided
        if (rangeId) {
            const range = await prisma.range.findUnique({ where: { id: rangeId } });
            if (!range) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid range ID',
                });
            }
        }

        if (code) {
            const existing = await prisma.district.findFirst({
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

        const district = await prisma.district.update({
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
    } catch (error) {
        console.error('Update district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating district',
        });
    }
};

export const deleteDistrict = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const district = await prisma.district.findUnique({
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

        await prisma.district.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'District deleted successfully',
        });
    } catch (error) {
        console.error('Delete district error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting district',
        });
    }
};
