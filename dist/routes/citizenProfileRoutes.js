"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const citizenProfileController_1 = require("../controllers/citizenProfileController");
const citizenAuth_1 = require("../middleware/citizenAuth");
const multer_1 = require("../config/multer");
const authorize_1 = require("../middleware/authorize");
const auth_1 = require("../types/auth");
const router = express_1.default.Router();
// All routes require citizen authentication
router.use(citizenAuth_1.authenticateCitizen);
// Profile
router.get('/profile', (0, authorize_1.requirePermission)(auth_1.Permission.PROFILE_READ_OWN), citizenProfileController_1.CitizenProfileController.getProfile);
router.patch('/profile', (0, authorize_1.requirePermission)(auth_1.Permission.PROFILE_UPDATE_OWN), citizenProfileController_1.CitizenProfileController.updateProfile);
// Visits
router.get('/visits', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_READ_OWN), citizenProfileController_1.CitizenProfileController.getVisits);
router.post('/visits/request', (0, authorize_1.requirePermission)(auth_1.Permission.VISITS_REQUEST), citizenProfileController_1.CitizenProfileController.requestVisit);
// SOS
router.get('/sos', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_READ_OWN), citizenProfileController_1.CitizenProfileController.getSOS);
router.post('/sos', (0, authorize_1.requirePermission)(auth_1.Permission.SOS_CREATE), citizenProfileController_1.CitizenProfileController.createSOS);
// Documents
router.get('/documents', (0, authorize_1.requirePermission)(auth_1.Permission.DOCUMENTS_READ_OWN), citizenProfileController_1.CitizenProfileController.getDocuments);
router.post('/documents', (0, authorize_1.requirePermission)(auth_1.Permission.DOCUMENTS_UPLOAD), multer_1.uploadSingle, citizenProfileController_1.CitizenProfileController.uploadDocument);
// Notifications
router.patch('/notifications', (0, authorize_1.requirePermission)(auth_1.Permission.NOTIFICATIONS_MANAGE), citizenProfileController_1.CitizenProfileController.updateNotifications);
// Feedback
router.post('/feedback', (0, authorize_1.requirePermission)(auth_1.Permission.FEEDBACK_SUBMIT), citizenProfileController_1.CitizenProfileController.submitFeedback);
exports.default = router;
//# sourceMappingURL=citizenProfileRoutes.js.map