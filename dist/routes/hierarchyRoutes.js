"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const asyncHandler_1 = require("../middleware/asyncHandler");
const hierarchyController_1 = require("../controllers/hierarchyController");
const router = (0, express_1.Router)();
// Public or Authenticated? 
// Usually hierarchy is for Admin/Config, so Authenticated.
// But if used by public map visualization, might need to be public.
// Following `userRoutes.ts` open state, let's keep it authenticated for now.
router.use(authenticate_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(hierarchyController_1.getHierarchyTree));
exports.default = router;
//# sourceMappingURL=hierarchyRoutes.js.map