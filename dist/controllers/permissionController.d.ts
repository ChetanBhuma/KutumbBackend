import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
/**
 * Permission Controller
 * Handles all permission-related operations
 */
export declare class PermissionController {
    /**
     * Get all permissions (hierarchical structure)
     * GET /api/permissions/all
     */
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get permissions grouped by category
     * GET /api/permissions/categories
     */
    static getByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get only menu items (permissions with isMenuItem = true)
     * GET /api/permissions/menu-items
     */
    static getMenuItems(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current user's permissions
     * GET /api/permissions/my-permissions
     */
    static getUserPermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a new permission (Admin only)
     * POST /api/permissions
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a permission (Admin only)
     * PUT /api/permissions/:id
     */
    static update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete a permission (Admin only)
     * DELETE /api/permissions/:id
     */
    static delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get permission by ID
     * GET /api/permissions/:id
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=permissionController.d.ts.map