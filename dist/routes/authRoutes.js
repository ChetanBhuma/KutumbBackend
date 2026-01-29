"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authenticate_1 = require("../middleware/authenticate");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
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
router.post('/register', rateLimiter_1.authLimiter, [
    validation_1.ValidationRules.email(),
    validation_1.ValidationRules.phone(),
    validation_1.ValidationRules.password(),
    (0, express_validator_1.body)('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'OFFICER', 'CITIZEN', 'VIEWER']),
    validate_1.validate
], authController_1.AuthController.register);
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
router.post('/login', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('identifier').notEmpty().withMessage('Email or phone is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    validate_1.validate
], authController_1.AuthController.login);
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
router.post('/otp/send', rateLimiter_1.otpLimiter, [
    (0, express_validator_1.body)('identifier').notEmpty().withMessage('Email or phone is required'),
    validate_1.validate
], authController_1.AuthController.sendOTP);
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
router.post('/otp/verify', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('identifier').notEmpty().withMessage('Email or phone is required'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required'),
    validate_1.validate
], authController_1.AuthController.verifyOTP);
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
router.post('/refresh-token', [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate_1.validate
], authController_1.AuthController.refreshToken);
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
router.post('/forgot-password', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    validate_1.validate
], authController_1.AuthController.forgotPassword);
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
router.post('/reset-password', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Token is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    validate_1.validate
], authController_1.AuthController.resetPassword);
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
router.post('/logout', authenticate_1.authenticate, authController_1.AuthController.logout);
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
router.get('/me', authenticate_1.authenticate, authController_1.AuthController.me);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map