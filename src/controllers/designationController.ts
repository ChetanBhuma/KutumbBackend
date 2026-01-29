import { Request, Response } from 'express';
import { prisma } from '../config/database'; // Adjust path

export const listDesignations = async (req: Request, res: Response) => {
    try {
        const { isActive } = req.query;

        const where: any = {};
        if (isActive === 'true') where.isActive = true;
        if (isActive === 'false') where.isActive = false;

        const designations = await prisma.designation.findMany({
            where,
            orderBy: { level: 'asc' } // Generally high rank to low rank involves numbers
        });

        return res.json({
            success: true,
            data: designations
        });
    } catch (error) {
        console.error('List designations error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching designations' });
    }
};

export const createDesignation = async (req: Request, res: Response) => {
    try {
        const { code, name, department, level, description } = req.body;

        if (!code || !name) {
            return res.status(400).json({ success: false, message: 'Code and Name are required' });
        }

        const existing = await prisma.designation.findUnique({ where: { code } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Designation code already exists' });
        }

        const designation = await prisma.designation.create({
            data: {
                code,
                name,
                department: department || 'General',
                level: level || 1,
                description,
                isActive: true
            }
        });

        return res.status(201).json({
            success: true,
            data: designation,
            message: 'Designation created successfully'
        });
    } catch (error) {
        console.error('Create designation error:', error);
        return res.status(500).json({ success: false, message: 'Error creating designation' });
    }
};

export const updateDesignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, department, level, description, isActive } = req.body;

        const designation = await prisma.designation.update({
            where: { id },
            data: {
                name,
                department,
                level,
                description,
                isActive
            }
        });

        return res.json({
            success: true,
            data: designation,
            message: 'Designation updated successfully'
        });
    } catch (error) {
        console.error('Update designation error:', error);
        return res.status(500).json({ success: false, message: 'Error updating designation' });
    }
};

export const deleteDesignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if used by any Officer
        const usageCount = await prisma.beatOfficer.count({ where: { designationId: id } });
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete designation. It is assigned to ${usageCount} officers.`
            });
        }

        await prisma.designation.delete({ where: { id } });

        return res.json({ success: true, message: 'Designation deleted successfully' });
    } catch (error) {
        console.error('Delete designation error:', error);
        return res.status(500).json({ success: false, message: 'Error deleting designation' });
    }
};
