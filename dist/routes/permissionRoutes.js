"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permissionController_1 = require("../controllers/permissionController");
const permissionCategoryController_1 = require("../controllers/permissionCategoryController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authenticate_1.authenticate);
// ============================================
// PUBLIC ROUTES (All authenticated users)
// ============================================
/**
 * Get all permissions with hierarchical structure
 * Used by: Role Master, Permission Master
 */
router.get('/all', permissionController_1.PermissionController.getAll);
/**
 * Get permissions grouped by category
 * Used by: Role Master for permission assignment
 */
router.get('/categories', permissionController_1.PermissionController.getByCategory);
/**
 * Get only menu items (isMenuItem = true)
 * Used by: Sidebar for dynamic menu rendering
 */
router.get('/menu-items', permissionController_1.PermissionController.getMenuItems);
/**
 * Get current user's permissions
 * Used by: Frontend auth context
 */
router.get('/my-permissions', permissionController_1.PermissionController.getUserPermissions);
/**
 * Get permission by ID
 * Used by: Permission details view
 */
router.get('/:id', permissionController_1.PermissionController.getById);
// ============================================
// ADMIN-ONLY ROUTES (Permission Management)
// ============================================
/**
 * Create new permission
 * Only SUPER_ADMIN can create permissions
 */
router.post('/', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), permissionController_1.PermissionController.create);
/**
 * Update permission
 * Only SUPER_ADMIN can update permissions
 */
router.put('/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), permissionController_1.PermissionController.update);
/**
 * Delete permission
 * Only SUPER_ADMIN can delete permissions
 */
router.delete('/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), permissionController_1.PermissionController.delete);
// ============================================
// CATEGORY ROUTES
// ============================================
/**
 * Get all categories with permission count
 * Used by: Permission Master
 */
router.get('/categories/all', permissionCategoryController_1.PermissionCategoryController.getAll);
/**
 * Get category by ID
 * Used by: Category details view
 */
router.get('/categories/:id', permissionCategoryController_1.PermissionCategoryController.getById);
/**
 * Create new category
 * Only SUPER_ADMIN can create categories
 */
router.post('/categories', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), permissionCategoryController_1.PermissionCategoryController.create);
/**
 * Update category
 * Only SUPER_ADMIN can update categories
 */
router.put('/categories/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), permissionCategoryController_1.PermissionCategoryController.update);
/**
 * Delete category
 * Only SUPER_ADMIN can delete categories
 */
router.delete('/categories/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN]), permissionCategoryController_1.PermissionCategoryController.delete);
exports.default = router;
//# sourceMappingURL=permissionRoutes.js.map