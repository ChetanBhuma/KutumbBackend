"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDesignation = exports.updateDesignation = exports.createDesignation = exports.listDesignations = void 0;
const database_1 = require("../config/database"); // Adjust path
const listDesignations = async (req, res) => {
    try {
        const { isActive } = req.query;
        const where = {};
        if (isActive === 'true')
            where.isActive = true;
        if (isActive === 'false')
            where.isActive = false;
        const designations = await database_1.prisma.designation.findMany({
            where,
            orderBy: { level: 'asc' } // Generally high rank to low rank involves numbers
        });
        return res.json({
            success: true,
            data: designations
        });
    }
    catch (error) {
        console.error('List designations error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching designations' });
    }
};
exports.listDesignations = listDesignations;
const createDesignation = async (req, res) => {
    try {
        const { code, name, department, level, description } = req.body;
        if (!code || !name) {
            return res.status(400).json({ success: false, message: 'Code and Name are required' });
        }
        const existing = await database_1.prisma.designation.findUnique({ where: { code } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Designation code already exists' });
        }
        const designation = await database_1.prisma.designation.create({
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
    }
    catch (error) {
        console.error('Create designation error:', error);
        return res.status(500).json({ success: false, message: 'Error creating designation' });
    }
};
exports.createDesignation = createDesignation;
const updateDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department, level, description, isActive } = req.body;
        const designation = await database_1.prisma.designation.update({
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
    }
    catch (error) {
        console.error('Update designation error:', error);
        return res.status(500).json({ success: false, message: 'Error updating designation' });
    }
};
exports.updateDesignation = updateDesignation;
const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if used by any Officer
        const usageCount = await database_1.prisma.beatOfficer.count({ where: { designationId: id } });
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete designation. It is assigned to ${usageCount} officers.`
            });
        }
        await database_1.prisma.designation.delete({ where: { id } });
        return res.json({ success: true, message: 'Designation deleted successfully' });
    }
    catch (error) {
        console.error('Delete designation error:', error);
        return res.status(500).json({ success: false, message: 'Error deleting designation' });
    }
};
exports.deleteDesignation = deleteDesignation;
//# sourceMappingURL=designationController.js.map