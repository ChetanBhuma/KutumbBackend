import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';

/**
 * Permission Controller
 * Handles all permission-related operations
 */
export class PermissionController {
  /**
   * Get all permissions (hierarchical structure)
   * GET /api/permissions/all
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await prisma.permission.findMany({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions grouped by category
   * GET /api/permissions/categories
   */
  static async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.permissionCategory.findMany({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get only menu items (permissions with isMenuItem = true)
   * GET /api/permissions/menu-items
   */
  static async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const menuItems = await prisma.permission.findMany({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's permissions
   * GET /api/permissions/my-permissions
   */
  static async getUserPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
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
        throw new AppError('User not found', 404);
      }

      // Get role from user or beatOfficer
      let role;
      if (user.role) {
        role = await prisma.role.findUnique({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new permission (Admin only)
   * POST /api/permissions
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
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
      } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw new AppError('Code and name are required', 400);
      }

      // Check if permission code already exists
      const existing = await prisma.permission.findUnique({
        where: { code }
      });

      if (existing) {
        throw new AppError('Permission with this code already exists', 400);
      }

      // Validate category exists
      if (categoryId) {
        const category = await prisma.permissionCategory.findUnique({
          where: { id: categoryId }
        });
        if (!category) {
          throw new AppError('Category not found', 404);
        }
      }

      // Validate parent exists
      if (parentId) {
        const parent = await prisma.permission.findUnique({
          where: { id: parentId }
        });
        if (!parent) {
          throw new AppError('Parent permission not found', 404);
        }
      }

      const permission = await prisma.permission.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a permission (Admin only)
   * PUT /api/permissions/:id
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
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
      } = req.body;

      // Check if permission exists
      const existing = await prisma.permission.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new AppError('Permission not found', 404);
      }

      // If code is being changed, check for duplicates
      if (code && code !== existing.code) {
        const duplicate = await prisma.permission.findUnique({
          where: { code }
        });
        if (duplicate) {
          throw new AppError('Permission with this code already exists', 400);
        }
      }

      // Validate category exists
      if (categoryId) {
        const category = await prisma.permissionCategory.findUnique({
          where: { id: categoryId }
        });
        if (!category) {
          throw new AppError('Category not found', 404);
        }
      }

      // Validate parent exists and prevent circular reference
      if (parentId) {
        if (parentId === id) {
          throw new AppError('Permission cannot be its own parent', 400);
        }
        const parent = await prisma.permission.findUnique({
          where: { id: parentId }
        });
        if (!parent) {
          throw new AppError('Parent permission not found', 404);
        }
      }

      const permission = await prisma.permission.update({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a permission (Admin only)
   * DELETE /api/permissions/:id
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if permission exists
      const permission = await prisma.permission.findUnique({
        where: { id },
        include: {
          roles: true,
          children: true
        }
      });

      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      // Check if permission is assigned to any roles
      if (permission.roles.length > 0) {
        throw new AppError(
          `Cannot delete permission assigned to ${permission.roles.length} role(s). Remove from roles first.`,
          400
        );
      }

      // Check if permission has children
      if (permission.children.length > 0) {
        throw new AppError(
          `Cannot delete permission with ${permission.children.length} child permission(s). Delete children first.`,
          400
        );
      }

      await prisma.permission.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permission by ID
   * GET /api/permissions/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const permission = await prisma.permission.findUnique({
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
        throw new AppError('Permission not found', 404);
      }

      res.json({
        success: true,
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }
}
