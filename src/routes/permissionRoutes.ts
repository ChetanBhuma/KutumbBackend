import { Router } from 'express';
import { PermissionController } from '../controllers/permissionController';
import { PermissionCategoryController } from '../controllers/permissionCategoryController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { Role } from '../types/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// PUBLIC ROUTES (All authenticated users)
// ============================================

/**
 * Get all permissions with hierarchical structure
 * Used by: Role Master, Permission Master
 */
router.get('/all', PermissionController.getAll);

/**
 * Get permissions grouped by category
 * Used by: Role Master for permission assignment
 */
router.get('/categories', PermissionController.getByCategory);

/**
 * Get only menu items (isMenuItem = true)
 * Used by: Sidebar for dynamic menu rendering
 */
router.get('/menu-items', PermissionController.getMenuItems);

/**
 * Get current user's permissions
 * Used by: Frontend auth context
 */
router.get('/my-permissions', PermissionController.getUserPermissions);

/**
 * Get permission by ID
 * Used by: Permission details view
 */
router.get('/:id', PermissionController.getById);

// ============================================
// ADMIN-ONLY ROUTES (Permission Management)
// ============================================

/**
 * Create new permission
 * Only SUPER_ADMIN can create permissions
 */
router.post(
  '/',
  requireRole([Role.SUPER_ADMIN]),
  PermissionController.create
);

/**
 * Update permission
 * Only SUPER_ADMIN can update permissions
 */
router.put(
  '/:id',
  requireRole([Role.SUPER_ADMIN]),
  PermissionController.update
);

/**
 * Delete permission
 * Only SUPER_ADMIN can delete permissions
 */
router.delete(
  '/:id',
  requireRole([Role.SUPER_ADMIN]),
  PermissionController.delete
);

// ============================================
// CATEGORY ROUTES
// ============================================

/**
 * Get all categories with permission count
 * Used by: Permission Master
 */
router.get('/categories/all', PermissionCategoryController.getAll);

/**
 * Get category by ID
 * Used by: Category details view
 */
router.get('/categories/:id', PermissionCategoryController.getById);

/**
 * Create new category
 * Only SUPER_ADMIN can create categories
 */
router.post(
  '/categories',
  requireRole([Role.SUPER_ADMIN]),
  PermissionCategoryController.create
);

/**
 * Update category
 * Only SUPER_ADMIN can update categories
 */
router.put(
  '/categories/:id',
  requireRole([Role.SUPER_ADMIN]),
  PermissionCategoryController.update
);

/**
 * Delete category
 * Only SUPER_ADMIN can delete categories
 */
router.delete(
  '/categories/:id',
  requireRole([Role.SUPER_ADMIN]),
  PermissionCategoryController.delete
);

export default router;
