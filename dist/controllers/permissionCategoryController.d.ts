import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
/**
 * Permission Category Controller
 * Handles permission category operations
 */
export declare class PermissionCategoryController {
    /**
     * Get all permission categories
     * GET /api/permissions/categories/all
     */
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get category by ID
     * GET /api/permissions/categories/:id
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create a new category (Admin only)
     * POST /api/permissions/categories
     */
    static create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a category (Admin only)
     * PUT /api/permissions/categories/:id
     */
    static update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete a category (Admin only)
     * DELETE /api/permissions/categories/:id
     */
    static delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=permissionCategoryController.d.ts.map