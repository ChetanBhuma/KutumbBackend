"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleMatrix = exports.listSystemPermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.listRoles = void 0;
const database_1 = require("../config/database"); // Adjust path
const auth_1 = require("../types/auth"); // Adjust path for enums
/**
 * List all roles
 */
const listRoles = async (_req, res) => {
    try {
        const roles = await database_1.prisma.role.findMany({
            include: {
                permissions: {
                    select: {
                        code: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        // Map permissions to string array for backward compatibility
        const rolesWithPermissionCodes = roles.map(role => ({
            ...role,
            permissions: role.permissions.map(p => p.code)
        }));
        return res.json({
            success: true,
            data: rolesWithPermissionCodes
        });
    }
    catch (error) {
        console.error('List roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching roles'
        });
    }
};
exports.listRoles = listRoles;
/**
 * Get role by ID
 */
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await database_1.prisma.role.findUnique({
            where: { id }
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        return res.json({
            success: true,
            data: role
        });
    }
    catch (error) {
        console.error('Get role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching role'
        });
    }
};
exports.getRoleById = getRoleById;
/**
 * Create a new custom role
 */
const createRole = async (req, res) => {
    try {
        const { code, name, description, permissions, jurisdictionLevel, isMultiSelect } = req.body;
        // Validation
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: 'Code and Name are required'
            });
        }
        const existing = await database_1.prisma.role.findUnique({ where: { code } });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Role with this code already exists'
            });
        }
        // Prepare role data
        let roleData = {
            code: code.toUpperCase(),
            name,
            description,
            isActive: true,
            jurisdictionLevel: jurisdictionLevel || 'NONE',
            isMultiSelect: isMultiSelect || false
        };
        // If permissions are provided as string array (permission codes), convert to relations
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            const permissionRecords = await database_1.prisma.permission.findMany({
                where: {
                    code: {
                        in: permissions
                    }
                },
                select: {
                    id: true
                }
            });
            roleData.permissions = {
                connect: permissionRecords.map(p => ({ id: p.id }))
            };
        }
        const role = await database_1.prisma.role.create({
            data: roleData,
            include: {
                permissions: {
                    select: {
                        code: true
                    }
                }
            }
        });
        // Map permissions to codes for response
        const roleWithPermissionCodes = {
            ...role,
            permissions: role.permissions.map((p) => p.code)
        };
        return res.status(201).json({
            success: true,
            data: roleWithPermissionCodes,
            message: 'Role created successfully'
        });
    }
    catch (error) {
        console.error('Create role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating role'
        });
    }
};
exports.createRole = createRole;
/**
 * Update role (permissions, name, description)
 */
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, isActive, jurisdictionLevel, isMultiSelect } = req.body;
        // If permissions are provided as string array (permission codes), we need to convert to relations
        let updateData = {
            name,
            description,
            isActive,
            jurisdictionLevel,
            isMultiSelect
        };
        if (permissions && Array.isArray(permissions)) {
            // Get permission IDs from codes
            const permissionRecords = await database_1.prisma.permission.findMany({
                where: {
                    code: {
                        in: permissions
                    }
                },
                select: {
                    id: true
                }
            });
            updateData.permissions = {
                set: [], // Disconnect all existing
                connect: permissionRecords.map(p => ({ id: p.id })) // Connect new ones
            };
        }
        const role = await database_1.prisma.role.update({
            where: { id },
            data: updateData,
            include: {
                permissions: {
                    select: {
                        code: true
                    }
                }
            }
        });
        // Map permissions to codes for response
        const roleWithPermissionCodes = {
            ...role,
            permissions: role.permissions.map((p) => p.code)
        };
        return res.json({
            success: true,
            data: roleWithPermissionCodes,
            message: 'Role updated successfully'
        });
    }
    catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating role'
        });
    }
};
exports.updateRole = updateRole;
/**
 * Delete Role
 * Protects system roles (defined in AUTH types) from deletion if necessary,
 * or checks for existing user assignments.
 */
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if role is assigned to any user
        const role = await database_1.prisma.role.findUnique({ where: { id } });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }
        // Optional: Check if it's a system role code from Enums?
        // if (Object.keys(RolePermissions).includes(role.code)) {
        //     return res.status(400).json({ success: false, message: 'Cannot delete core system roles' });
        // }
        // Check usage
        const usageCount = await database_1.prisma.user.count({ where: { role: role.code } });
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. It is assigned to ${usageCount} users.`
            });
        }
        await database_1.prisma.role.delete({ where: { id } });
        return res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting role'
        });
    }
};
exports.deleteRole = deleteRole;
/**
 * List all available system permissions (Enum values)
 * Used for building the "Edit Role" UI
 */
const listSystemPermissions = async (_req, res) => {
    try {
        const permissions = Object.values(auth_1.Permission);
        // Return structured for UI?
        // Or just the list.
        return res.json({
            success: true,
            data: permissions
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Error listing permissions' });
    }
};
exports.listSystemPermissions = listSystemPermissions;
/**
 * Get Role Matrix (Roles + Users with Role Codes)
 */
const getRoleMatrix = async (_req, res) => {
    try {
        // Fetch all roles
        const roles = await database_1.prisma.role.findMany({
            orderBy: { name: 'asc' }
        });
        // Get user counts by role (since there is no direct relation)
        const userCounts = await database_1.prisma.user.groupBy({
            by: ['role'],
            _count: { role: true }
        });
        // Create a map of role code -> count
        const countMap = userCounts.reduce((acc, curr) => {
            acc[curr.role] = curr._count.role;
            return acc;
        }, {});
        // Fetch users for the matrix view
        const users = await database_1.prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                SeniorCitizen: {
                    select: { fullName: true }
                },
                officerProfile: {
                    select: { name: true }
                }
            },
            orderBy: { email: 'asc' }
        });
        // Transform users to flat structure expected by frontend
        const transformedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            phone: user.phone,
            roleCode: user.role,
            isActive: user.isActive,
            displayName: user.SeniorCitizen?.fullName || user.officerProfile?.name || user.email.split('@')[0]
        }));
        // Transform roles to include user count from the map
        const transformedRoles = roles.map(role => ({
            ...role,
            userCount: countMap[role.code] || 0
        }));
        return res.json({
            success: true,
            data: {
                roles: transformedRoles,
                users: transformedUsers
            }
        });
    }
    catch (error) {
        console.error('Get role matrix error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching role matrix'
        });
    }
};
exports.getRoleMatrix = getRoleMatrix;
//# sourceMappingURL=roleController.js.map