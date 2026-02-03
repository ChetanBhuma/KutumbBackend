import { Request, Response } from 'express';
import { prisma } from '../config/database'; // Adjust path
import { Permission } from '../types/auth'; // Adjust path for enums

/**
 * List all roles
 */
export const listRoles = async (_req: Request, res: Response) => {
    try {
        const roles = await prisma.role.findMany({
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
    } catch (error) {
        console.error('List roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching roles'
        });
    }
};

/**
 * Get role by ID
 */
export const getRoleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const role = await prisma.role.findUnique({
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
    } catch (error) {
        console.error('Get role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching role'
        });
    }
};

/**
 * Create a new custom role
 */
export const createRole = async (req: Request, res: Response) => {
    try {
        const { code, name, description, permissions, jurisdictionLevel, isMultiSelect } = req.body;

        // Validation
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: 'Code and Name are required'
            });
        }

        const existing = await prisma.role.findUnique({ where: { code } });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Role with this code already exists'
            });
        }

        // Prepare role data
        let roleData: any = {
            code: code.toUpperCase(),
            name,
            description,
            isActive: true,
            jurisdictionLevel: jurisdictionLevel || 'NONE',
            isMultiSelect: isMultiSelect || false
        };

        // If permissions are provided as string array (permission codes), convert to relations
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            const permissionRecords = await prisma.permission.findMany({
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

        const role = await prisma.role.create({
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
            permissions: role.permissions.map((p: any) => p.code)
        };

        return res.status(201).json({
            success: true,
            data: roleWithPermissionCodes,
            message: 'Role created successfully'
        });
    } catch (error) {
        console.error('Create role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating role'
        });
    }
};

/**
 * Update role (permissions, name, description)
 */
export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, isActive, jurisdictionLevel, isMultiSelect } = req.body;

        // If permissions are provided as string array (permission codes), we need to convert to relations
        let updateData: any = {
            name,
            description,
            isActive,
            jurisdictionLevel,
            isMultiSelect
        };

        if (permissions && Array.isArray(permissions)) {
            // Get permission IDs from codes
            const permissionRecords = await prisma.permission.findMany({
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

        const role = await prisma.role.update({
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
            permissions: role.permissions.map((p: any) => p.code)
        };

        return res.json({
            success: true,
            data: roleWithPermissionCodes,
            message: 'Role updated successfully'
        });
    } catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating role'
        });
    }
};

/**
 * Delete Role
 * Protects system roles (defined in AUTH types) from deletion if necessary,
 * or checks for existing user assignments.
 */
export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if role is assigned to any user
        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Optional: Check if it's a system role code from Enums?
        // if (Object.keys(RolePermissions).includes(role.code)) {
        //     return res.status(400).json({ success: false, message: 'Cannot delete core system roles' });
        // }

        // Check usage
        const usageCount = await prisma.user.count({ where: { role: role.code } });
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. It is assigned to ${usageCount} users.`
            });
        }

        await prisma.role.delete({ where: { id } });

        return res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        console.error('Delete role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting role'
        });
    }
};

/**
 * List all available system permissions (Enum values)
 * Used for building the "Edit Role" UI
 */
export const listSystemPermissions = async (_req: Request, res: Response) => {
    try {
        const permissions = Object.values(Permission);

        // Return structured for UI?
        // Or just the list.
        return res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error listing permissions' });
    }
};
/**
 * Get Role Matrix (Roles + Users with Role Codes)
 */
export const getRoleMatrix = async (_req: Request, res: Response) => {
    try {
        // OPTIMIZATION: Parallelize all independent queries
        const [roles, userCounts, users] = await Promise.all([
            // Query 1: Fetch all roles
            prisma.role.findMany({
                orderBy: { name: 'asc' }
            }),
            // Query 2: Get user counts by role
            prisma.user.groupBy({
                by: ['role'],
                _count: { role: true }
            }),
            // Query 3: Fetch users with minimal data
            // OPTIMIZATION: Added limit to prevent fetching potentially thousands of users
            prisma.user.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    // OPTIMIZATION: Only fetch officerProfile name, skip SeniorCitizen for matrix view
                    officerProfile: {
                        select: { name: true }
                    }
                },
                take: 500, // Limit for performance
                orderBy: { email: 'asc' }
            })
        ]);

        // Create a map of role code -> count
        const countMap = userCounts.reduce((acc, curr) => {
            acc[curr.role] = curr._count.role;
            return acc;
        }, {} as Record<string, number>);

        // Transform users to flat structure expected by frontend
        const transformedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            phone: user.phone,
            roleCode: user.role,
            isActive: user.isActive,
            displayName: user.officerProfile?.name || user.email.split('@')[0]
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
    } catch (error) {
        console.error('Get role matrix error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching role matrix'
        });
    }
};
