import express from 'express';
import { CitizenProfileController } from '../controllers/citizenProfileController';
import { authenticateCitizen } from '../middleware/citizenAuth';
import { uploadSingle } from '../config/multer';

import { requirePermission } from '../middleware/authorize';
import { Permission } from '../types/auth';

const router = express.Router();

// All routes require citizen authentication
router.use(authenticateCitizen);

// Profile
router.get('/profile', requirePermission(Permission.PROFILE_READ_OWN), CitizenProfileController.getProfile);
router.patch('/profile', requirePermission(Permission.PROFILE_UPDATE_OWN), CitizenProfileController.updateProfile);

// Visits
router.get('/visits', requirePermission(Permission.VISITS_READ_OWN), CitizenProfileController.getVisits);
router.post('/visits/request', requirePermission(Permission.VISITS_REQUEST), CitizenProfileController.requestVisit);

// SOS
router.get('/sos', requirePermission(Permission.SOS_READ_OWN), CitizenProfileController.getSOS);
router.post('/sos', requirePermission(Permission.SOS_CREATE), CitizenProfileController.createSOS);

// Documents
router.get('/documents', requirePermission(Permission.DOCUMENTS_READ_OWN), CitizenProfileController.getDocuments);
router.post('/documents', requirePermission(Permission.DOCUMENTS_UPLOAD), uploadSingle as any, CitizenProfileController.uploadDocument);

// Notifications
router.patch('/notifications', requirePermission(Permission.NOTIFICATIONS_MANAGE), CitizenProfileController.updateNotifications);

// Feedback
router.post('/feedback', requirePermission(Permission.FEEDBACK_SUBMIT), CitizenProfileController.submitFeedback);

export default router;
