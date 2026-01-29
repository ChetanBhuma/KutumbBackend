"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Permission Controller
 * Handles all permission-related operations
 */
class PermissionController {
    /**
     * Get all permissions (hierarchical structure)
     * GET /api/permissions/all
     */
    static async getAll(req, res, next) {
        try {
            const permissions = await database_1.prisma.permission.findMany({
                include: {
                    category: true,
                    parent: true,
                    children: true
                },
                orderBy: [
                    { category: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' }
                ]
            });
            res.json({
                success: true,
                data: permissions
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get permissions grouped by category
     * GET /api/permissions/categories
     */
    static async getByCategory(req, res, next) {
        try {
            const categories = await database_1.prisma.permissionCategory.findMany({
                include: {
                    permissions: {
                        orderBy: { displayOrder: 'asc' }
                    }
                },
                orderBy: { displayOrder: 'asc' }
            });
            res.json({
                success: true,
                data: categories
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get only menu items (permissions with isMenuItem = true)
     * GET /api/permissions/menu-items
     */
    static async getMenuItems(req, res, next) {
        try {
            const menuItems = await database_1.prisma.permission.findMany({
                where: {
                    isMenuItem: true,
                    isActive: true
                },
                include: {
                    category: true,
                    children: {
                        where: {
                            isMenuItem: true,
                            isActive: true
                        },
                        orderBy: { displayOrder: 'asc' }
                    }
                },
                orderBy: [
                    { category: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' }
                ]
            });
            res.json({
                success: true,
                data: menuItems
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current user's permissions
     * GET /api/permissions/my-permissions
     */
    static async getUserPermissions(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    officerProfile: {
                        include: {
                            user: {
                                include: {
                                // Role is a string field, not a relation, so we cannot include it here.
                                // Permissions are fetched separately below.
                                }
                            }
                        }
                    }
                }
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            // Get role from user or beatOfficer
            let role;
            if (user.role) {
                role = await database_1.prisma.role.findUnique({
                    where: { code: user.role },
                    include: {
                        permissions: {
                            include: {
                                category: true,
                                children: true
                            }
                        }
                    }
                });
            }
            const permissions = role?.permissions || [];
            res.json({
                success: true,
                data: permissions
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a new permission (Admin only)
     * POST /api/permissions
     */
    static async create(req, res, next) {
        try {
            const { code, name, description, categoryId, parentId, menuPath, menuLabel, menuIcon, displayOrder, isActive, isMenuItem } = req.body;
            // Validate required fields
            if (!code || !name) {
                throw new errorHandler_1.AppError('Code and name are required', 400);
            }
            // Check if permission code already exists
            const existing = await database_1.prisma.permission.findUnique({
                where: { code }
            });
            if (existing) {
                throw new errorHandler_1.AppError('Permission with this code already exists', 400);
            }
            // Validate category exists
            if (categoryId) {
                const category = await database_1.prisma.permissionCategory.findUnique({
                    where: { id: categoryId }
                });
                if (!category) {
                    throw new errorHandler_1.AppError('Category not found', 404);
                }
            }
            // Validate parent exists
            if (parentId) {
                const parent = await database_1.prisma.permission.findUnique({
                    where: { id: parentId }
                });
                if (!parent) {
                    throw new errorHandler_1.AppError('Parent permission not found', 404);
                }
            }
            const permission = await database_1.prisma.permission.create({
                data: {
                    code,
                    name,
                    description,
                    categoryId,
                    parentId,
                    menuPath,
                    menuLabel,
                    menuIcon,
                    displayOrder: displayOrder || 0,
                    isActive: isActive !== undefined ? isActive : true,
                    isMenuItem: isMenuItem || false
                },
                include: {
                    category: true,
                    parent: true
                }
            });
            res.status(201).json({
                success: true,
                data: permission,
                message: 'Permission created successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a permission (Admin only)
     * PUT /api/permissions/:id
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { code, name, description, categoryId, parentId, menuPath, menuLabel, menuIcon, displayOrder, isActive, isMenuItem } = req.body;
            // Check if permission exists
            const existing = await database_1.prisma.permission.findUnique({
                where: { id }
            });
            if (!existing) {
                throw new errorHandler_1.AppError('Permission not found', 404);
            }
            // If code is being changed, check for duplicates
            if (code && code !== existing.code) {
                const duplicate = await database_1.prisma.permission.findUnique({
                    where: { code }
                });
                if (duplicate) {
                    throw new errorHandler_1.AppError('Permission with this code already exists', 400);
                }
            }
            // Validate category exists
            if (categoryId) {
                const category = await database_1.prisma.permissionCategory.findUnique({
                    where: { id: categoryId }
                });
                if (!category) {
                    throw new errorHandler_1.AppError('Category not found', 404);
                }
            }
            // Validate parent exists and prevent circular reference
            if (parentId) {
                if (parentId === id) {
                    throw new errorHandler_1.AppError('Permission cannot be its own parent', 400);
                }
                const parent = await database_1.prisma.permission.findUnique({
                    where: { id: parentId }
                });
                if (!parent) {
                    throw new errorHandler_1.AppError('Parent permission not found', 404);
                }
            }
            const permission = await database_1.prisma.permission.update({
                where: { id },
                data: {
                    code,
                    name,
                    description,
                    categoryId,
                    parentId,
                    menuPath,
                    menuLabel,
                    menuIcon,
                    displayOrder,
                    isActive,
                    isMenuItem
                },
                include: {
                    category: true,
                    parent: true
                }
            });
            res.json({
                success: true,
                data: permission,
                message: 'Permission updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a permission (Admin only)
     * DELETE /api/permissions/:id
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            // Check if permission exists
            const permission = await database_1.prisma.permission.findUnique({
                where: { id },
                include: {
                    roles: true,
                    children: true
                }
            });
            if (!permission) {
                throw new errorHandler_1.AppError('Permission not found', 404);
            }
            // Check if permission is assigned to any roles
            if (permission.roles.length > 0) {
                throw new errorHandler_1.AppError(`Cannot delete permission assigned to ${permission.roles.length} role(s). Remove from roles first.`, 400);
            }
            // Check if permission has children
            if (permission.children.length > 0) {
                throw new errorHandler_1.AppError(`Cannot delete permission with ${permission.children.length} child permission(s). Delete children first.`, 400);
            }
            await database_1.prisma.permission.delete({
                where: { id }
            });
            res.json({
                success: true,
                message: 'Permission deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get permission by ID
     * GET /api/permissions/:id
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const permission = await database_1.prisma.permission.findUnique({
                where: { id },
                include: {
                    category: true,
                    parent: true,
                    children: true,
                    roles: {
                        select: {
                            id: true,
                            code: true,
                            name: true
                        }
                    }
                }
            });
            if (!permission) {
                throw new errorHandler_1.AppError('Permission not found', 404);
            }
            res.json({
                success: true,
                data: permission
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PermissionController = PermissionController;
//# sourceMappingURL=permissionController.js.map