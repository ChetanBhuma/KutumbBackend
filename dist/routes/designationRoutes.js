"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const asyncHandler_1 = require("../middleware/asyncHandler");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const designationController_1 = require("../controllers/designationController");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Designations can be viewed by more roles, but managed only by Admins
router.get('/', (0, asyncHandler_1.asyncHandler)(designationController_1.listDesignations));
router.use((0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]));
router.post('/', auditMiddleware_1.auditCRUD.create('designation'), (0, asyncHandler_1.asyncHandler)(designationController_1.createDesignation));
router.patch('/:id', auditMiddleware_1.auditCRUD.update('designation'), (0, asyncHandler_1.asyncHandler)(designationController_1.updateDesignation));
router.delete('/:id', auditMiddleware_1.auditCRUD.delete('designation'), (0, asyncHandler_1.asyncHandler)(designationController_1.deleteDesignation));
exports.default = router;
//# sourceMappingURL=designationRoutes.js.map