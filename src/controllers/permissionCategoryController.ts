import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';

/**
 * Permission Category Controller
 * Handles permission category operations
 */
export class PermissionCategoryController {
  /**
   * Get all permission categories
   * GET /api/permissions/categories/all
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.permissionCategory.findMany({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/permissions/categories/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await prisma.permissionCategory.findUnique({
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
        throw new AppError('Category not found', 404);
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category (Admin only)
   * POST /api/permissions/categories
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        code,
        name,
        description,
        icon,
        displayOrder,
        isActive
      } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw new AppError('Code and name are required', 400);
      }

      // Check if category code already exists
      const existing = await prisma.permissionCategory.findUnique({
        where: { code }
      });

      if (existing) {
        throw new AppError('Category with this code already exists', 400);
      }

      const category = await prisma.permissionCategory.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a category (Admin only)
   * PUT /api/permissions/categories/:id
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        code,
        name,
        description,
        icon,
        displayOrder,
        isActive
      } = req.body;

      // Check if category exists
      const existing = await prisma.permissionCategory.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new AppError('Category not found', 404);
      }

      // If code is being changed, check for duplicates
      if (code && code !== existing.code) {
        const duplicate = await prisma.permissionCategory.findUnique({
          where: { code }
        });
        if (duplicate) {
          throw new AppError('Category with this code already exists', 400);
        }
      }

      const category = await prisma.permissionCategory.update({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category (Admin only)
   * DELETE /api/permissions/categories/:id
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if category exists
      const category = await prisma.permissionCategory.findUnique({
        where: { id },
        include: {
          permissions: true
        }
      });

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Check if category has permissions
      if (category.permissions.length > 0) {
        throw new AppError(
          `Cannot delete category with ${category.permissions.length} permission(s). Delete or reassign permissions first.`,
          400
        );
      }

      await prisma.permissionCategory.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
