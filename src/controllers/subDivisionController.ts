import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all sub-divisions with optional filtering
export const getSubDivisions = async (req: Request, res: Response) => {
    try {
        const { districtId, rangeId, isActive } = req.query;

        const where: any = {};

        if (districtId) {
            where.districtId = districtId as string;
        }

        if (rangeId) {
            // Filter by range through district relationship
            where.District = {
                rangeId: rangeId as string,
            };
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const subDivisions = await prisma.subDivision.findMany({
            where,
            include: {
                District: {
                    include: {
                        Range: true,
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

        // Transform response to include hierarchy info
        const response = subDivisions.map(sd => ({
            id: sd.id,
            code: sd.code,
            name: sd.name,
            districtId: sd.districtId,
            districtName: sd.District.name,
            districtCode: sd.District.code,
            rangeId: sd.District.rangeId || '',
            rangeName: sd.District.Range?.name || '',
            rangeCode: sd.District.Range?.code || '',
            area: sd.area || '',
            population: sd.population || 0,
            headquarters: sd.headquarters || '',
            isActive: sd.isActive,
            policeStationCount: sd._count.PoliceStation,
            citizenCount: sd._count.SeniorCitizen,
        }));

        return res.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error('Error fetching sub-divisions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-divisions',
        });
    }
};

// Get single sub-division by ID
export const getSubDivisionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const subDivision = await prisma.subDivision.findUnique({
            where: { id },
            include: {
                District: {
                    include: {
                        Range: true,
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

        if (!subDivision) {
            return res.status(404).json({
                success: false,
                message: 'Sub-division not found',
            });
        }

        return res.json({
            success: true,
            data: {
                ...subDivision,
                districtName: subDivision.District.name,
                rangeName: subDivision.District.Range?.name || '',
                policeStationCount: subDivision._count.PoliceStation,
                citizenCount: subDivision._count.SeniorCitizen,
            },
        });
    } catch (error) {
        console.error('Error fetching sub-division:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-division',
        });
    }
};

// Create new sub-division
export const createSubDivision = async (req: Request, res: Response) => {
    try {
        const { code, name, districtId, area, population, headquarters, isActive } = req.body;

        // Check if district exists
        const district = await prisma.district.findUnique({
            where: { id: districtId },
            include: { Range: true },
        });

        if (!district) {
            return res.status(400).json({
                success: false,
                message: 'District not found',
            });
        }

        // Check if code already exists
        const existing = await prisma.subDivision.findUnique({
            where: { code },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Sub-division code already exists',
            });
        }

        const subDivision = await prisma.subDivision.create({
            data: {
                code,
                name,
                districtId,
                area: area || '',
                population: population || 0,
                headquarters: headquarters || name,
                isActive: isActive !== undefined ? isActive : true,
            },
            include: {
                District: {
                    include: {
                        Range: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            data: {
                ...subDivision,
                districtName: subDivision.District.name,
                rangeName: subDivision.District.Range?.name || '',
            },
            message: 'Sub-division created successfully',
        });
    } catch (error) {
        console.error('Error creating sub-division:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create sub-division',
        });
    }
};

// Update sub-division
export const updateSubDivision = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, districtId, area, population, headquarters, isActive } = req.body;

        // Check if sub-division exists
        const existing = await prisma.subDivision.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Sub-division not found',
            });
        }

        // If districtId is being changed, validate it exists
        if (districtId && districtId !== existing.districtId) {
            const district = await prisma.district.findUnique({
                where: { id: districtId },
            });

            if (!district) {
                return res.status(400).json({
                    success: false,
                    message: 'District not found',
                });
            }
        }

        // If code is being changed, check for duplicates
        if (code && code !== existing.code) {
            const duplicate = await prisma.subDivision.findUnique({
                where: { code },
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Sub-division code already exists',
                });
            }
        }

        const subDivision = await prisma.subDivision.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(districtId && { districtId }),
                ...(area !== undefined && { area }),
                ...(population !== undefined && { population }),
                ...(headquarters && { headquarters }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                District: {
                    include: {
                        Range: true,
                    },
                },
            },
        });

        return res.json({
            success: true,
            data: {
                ...subDivision,
                districtName: subDivision.District.name,
                rangeName: subDivision.District.Range?.name || '',
            },
            message: 'Sub-division updated successfully',
        });
    } catch (error) {
        console.error('Error updating sub-division:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update sub-division',
        });
    }
};

// Delete sub-division
export const deleteSubDivision = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if sub-division exists
        const subDivision = await prisma.subDivision.findUnique({
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

        if (!subDivision) {
            return res.status(404).json({
                success: false,
                message: 'Sub-division not found',
            });
        }

        // Check if there are associated records
        if (subDivision._count.PoliceStation > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete sub-division. It has ${subDivision._count.PoliceStation} associated police station(s).`,
            });
        }

        if (subDivision._count.SeniorCitizen > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete sub-division. It has ${subDivision._count.SeniorCitizen} associated citizen(s).`,
            });
        }

        await prisma.subDivision.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Sub-division deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting sub-division:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete sub-division',
        });
    }
};
