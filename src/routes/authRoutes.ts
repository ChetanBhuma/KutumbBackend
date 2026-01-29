import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';
import { ValidationRules } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone, password]
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post(
    '/register',
    authLimiter,
    [
        ValidationRules.email(),
        ValidationRules.phone(),
        ValidationRules.password(),
        body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'OFFICER', 'CITIZEN', 'VIEWER']),
        validate
    ],
    AuthController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email/phone and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post(
    '/login',
    authLimiter,
    [
        body('identifier').notEmpty().withMessage('Email or phone is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    AuthController.login
);

/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     tags: [Authentication]
 *     summary: Send OTP to phone/email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
    '/otp/send',
    otpLimiter,
    [
        body('identifier').notEmpty().withMessage('Email or phone is required'),
        validate
    ],
    AuthController.sendOTP
);

/**
 * @swagger
 * /auth/otp/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify OTP and login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, otp]
 *             properties:
 *               identifier:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid OTP
 */
router.post(
    '/otp/verify',
    authLimiter,
    [
        body('identifier').notEmpty().withMessage('Email or phone is required'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required'),
        validate
    ],
    AuthController.verifyOTP
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 */
router.post(
    '/refresh-token',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
        validate
    ],
    AuthController.refreshToken
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post(
    '/forgot-password',
    authLimiter,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        validate
    ],
    AuthController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
    '/reset-password',
    authLimiter,
    [
        body('token').notEmpty().withMessage('Token is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    AuthController.resetPassword
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', authenticate, AuthController.me);

export default router;
