"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const leaveController_1 = require("../controllers/leaveController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const router = express_1.default.Router();
router.use(authenticate_1.authenticate);
// Create leave request
router.post('/', leaveController_1.LeaveController.create);
// Get all leave requests
router.get('/', leaveController_1.LeaveController.list);
// Get statistics
router.get('/stats', leaveController_1.LeaveController.getStats);
// Get officer's leaves
router.get('/officer/:officerId', leaveController_1.LeaveController.getOfficerLeaves);
// Get specific leave
router.get('/:id', leaveController_1.LeaveController.getById);
// Approve leave (admin/supervisor only)
router.patch('/:id/approve', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPERVISOR, auth_1.Role.SUPER_ADMIN]), leaveController_1.LeaveController.approve);
// Reject leave (admin/supervisor only)
router.patch('/:id/reject', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPERVISOR, auth_1.Role.SUPER_ADMIN]), leaveController_1.LeaveController.reject);
// Cancel leave
router.patch('/:id/cancel', leaveController_1.LeaveController.cancel);
exports.default = router;
//# sourceMappingURL=leaveRoutes.js.map