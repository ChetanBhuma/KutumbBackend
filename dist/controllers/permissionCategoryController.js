"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCategoryController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Permission Category Controller
 * Handles permission category operations
 */
class PermissionCategoryController {
    /**
     * Get all permission categories
     * GET /api/permissions/categories/all
     */
    static async getAll(req, res, next) {
        try {
            const categories = await database_1.prisma.permissionCategory.findMany({
                include: {
                    _count: {
                        select: { permissions: true }
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
     * Get category by ID
     * GET /api/permissions/categories/:id
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await database_1.prisma.permissionCategory.findUnique({
                where: { id },
                include: {
                    permissions: {
                        orderBy: { displayOrder: 'asc' }
                    },
                    _count: {
                        select: { permissions: true }
                    }
                }
            });
            if (!category) {
                throw new errorHandler_1.AppError('Category not found', 404);
            }
            res.json({
                success: true,
                data: category
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a new category (Admin only)
     * POST /api/permissions/categories
     */
    static async create(req, res, next) {
        try {
            const { code, name, description, icon, displayOrder, isActive } = req.body;
            // Validate required fields
            if (!code || !name) {
                throw new errorHandler_1.AppError('Code and name are required', 400);
            }
            // Check if category code already exists
            const existing = await database_1.prisma.permissionCategory.findUnique({
                where: { code }
            });
            if (existing) {
                throw new errorHandler_1.AppError('Category with this code already exists', 400);
            }
            const category = await database_1.prisma.permissionCategory.create({
                data: {
                    code,
                    name,
                    description,
                    icon,
                    displayOrder: displayOrder || 0,
                    isActive: isActive !== undefined ? isActive : true
                }
            });
            res.status(201).json({
                success: true,
                data: category,
                message: 'Category created successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a category (Admin only)
     * PUT /api/permissions/categories/:id
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { code, name, description, icon, displayOrder, isActive } = req.body;
            // Check if category exists
            const existing = await database_1.prisma.permissionCategory.findUnique({
                where: { id }
            });
            if (!existing) {
                throw new errorHandler_1.AppError('Category not found', 404);
            }
            // If code is being changed, check for duplicates
            if (code && code !== existing.code) {
                const duplicate = await database_1.prisma.permissionCategory.findUnique({
                    where: { code }
                });
                if (duplicate) {
                    throw new errorHandler_1.AppError('Category with this code already exists', 400);
                }
            }
            const category = await database_1.prisma.permissionCategory.update({
                where: { id },
                data: {
                    code,
                    name,
                    description,
                    icon,
                    displayOrder,
                    isActive
                }
            });
            res.json({
                success: true,
                data: category,
                message: 'Category updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a category (Admin only)
     * DELETE /api/permissions/categories/:id
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            // Check if category exists
            const category = await database_1.prisma.permissionCategory.findUnique({
                where: { id },
                include: {
                    permissions: true
                }
            });
            if (!category) {
                throw new errorHandler_1.AppError('Category not found', 404);
            }
            // Check if category has permissions
            if (category.permissions.length > 0) {
                throw new errorHandler_1.AppError(`Cannot delete category with ${category.permissions.length} permission(s). Delete or reassign permissions first.`, 400);
            }
            await database_1.prisma.permissionCategory.delete({
                where: { id }
            });
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PermissionCategoryController = PermissionCategoryController;
//# sourceMappingURL=permissionCategoryController.js.map