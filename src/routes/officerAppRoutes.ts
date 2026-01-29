import { Router } from 'express';
import { OfficerAuthController } from '../controllers/auth/officerAuthController';
import { OfficerDashboardController } from '../controllers/officerDashboardController';
import { authenticate } from '../middleware/authenticate';
import { requireRole, requirePermission } from '../middleware/authorize';
import { Role, Permission } from '../types/auth';
import { VisitController } from '../controllers/visitController';

const router = Router();

// Public routes (Auth)
/**
 * @swagger
 * /officer-app/auth/send-otp:
 *   post:
 *     tags: [Officer App]
 *     summary: Send OTP for officer login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [badgeNumber]
 *             properties:
 *               badgeNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/auth/send-otp', OfficerAuthController.sendOTP);

/**
 * @swagger
 * /officer-app/auth/verify-otp:
 *   post:
 *     tags: [Officer App]
 *     summary: Verify officer OTP and login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [badgeNumber, otp]
 *             properties:
 *               badgeNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/auth/verify-otp', OfficerAuthController.verifyOTP);

// Protected routes (Dashboard)
// All these require authentication and OFFICER role
router.use(authenticate);

/**
 * @swagger
 * /officer-app/assignments:
 *   get:
 *     tags: [Officer App]
 *     summary: Get visits assigned to current officer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned visits
 */
router.get('/assignments', VisitController.getOfficerAssignments);

// Removed hardcoded role requirement - now using permission-based auth
// Any authenticated user with appropriate permissions can access officer-app routes

/**
 * @swagger
 * /officer-app/dashboard/metrics:
 *   get:
 *     tags: [Officer App]
 *     summary: Get officer dashboard metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get('/dashboard/metrics', requirePermission(Permission.CITIZENS_READ), OfficerDashboardController.getMetrics);

/**
 * @swagger
 * /officer-app/dashboard/suggestions:
 *   get:
 *     tags: [Officer App]
 *     summary: Get daily visit suggestions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suggested visits
 */
router.get('/dashboard/suggestions', requirePermission(Permission.CITIZENS_READ), OfficerDashboardController.getSuggestions);

/**
 * @swagger
 * /officer-app/dashboard/citizens:
 *   get:
 *     tags: [Officer App]
 *     summary: Get citizens in officer's beat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of beat citizens
 */
router.get('/dashboard/citizens', requirePermission(Permission.CITIZENS_READ), OfficerDashboardController.getMyBeatCitizens);

/**
 * @swagger
 * /officer-app/dashboard/nearby:
 *   get:
 *     tags: [Officer App]
 *     summary: Get nearby citizens based on location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of nearby citizens
 */
router.get('/dashboard/nearby', requirePermission(Permission.CITIZENS_READ), OfficerDashboardController.getNearbyCitizens);

/**
 * @swagger
 * /officer-app/profile:
 *   get:
 *     tags: [Officer App]
 *     summary: Get officer profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Officer profile
 */
router.get('/profile', OfficerDashboardController.getProfile);

export default router;
