"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const workflowController_1 = require("../controllers/workflowController");
const authenticate_1 = require("../middleware/authenticate");
const router = express_1.default.Router();
// All routes require authentication
router.use(authenticate_1.authenticate);
// Start a new workflow
router.post('/start', workflowController_1.startWorkflow);
// Approve workflow step
router.post('/approve', workflowController_1.approveWorkflowStep);
// Reject workflow step
router.post('/reject', workflowController_1.rejectWorkflowStep);
// Get pending approvals for current user
router.get('/pending', workflowController_1.getPendingApprovals);
// Get workflow status
router.get('/:workflowId/status', workflowController_1.getWorkflowStatus);
exports.default = router;
//# sourceMappingURL=workflowRoutes.js.map