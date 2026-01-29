"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceRequestController_1 = require("../controllers/serviceRequestController");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const router = express_1.default.Router();
router.use(authenticate_1.authenticate);
// Create service request
router.post('/', serviceRequestController_1.ServiceRequestController.create);
// List all service requests with filters
router.get('/', serviceRequestController_1.ServiceRequestController.list);
// Get statistics
router.get('/stats', serviceRequestController_1.ServiceRequestController.getStats);
// Get specific service request
router.get('/:id', serviceRequestController_1.ServiceRequestController.getById);
// Update service request status
router.patch('/:id/status', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.OFFICER, auth_1.Role.SUPERVISOR]), serviceRequestController_1.ServiceRequestController.updateStatus);
// Assign request to officer
router.patch('/:id/assign', (0, authorize_1.requireRole)([auth_1.Role.ADMIN, auth_1.Role.SUPERVISOR]), serviceRequestController_1.ServiceRequestController.assign);
// Delete service request (admin only)
router.delete('/:id', (0, authorize_1.requireRole)([auth_1.Role.SUPER_ADMIN, auth_1.Role.ADMIN]), serviceRequestController_1.ServiceRequestController.delete);
exports.default = router;
//# sourceMappingURL=serviceRequestRoutes.js.map