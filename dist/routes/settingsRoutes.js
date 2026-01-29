"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.use((0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPER_ADMIN]));
router.get('/', settingsController_1.SettingsController.getSettings);
router.put('/:key', settingsController_1.SettingsController.updateSetting);
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map