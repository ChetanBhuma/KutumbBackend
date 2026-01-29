"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const citizenAuthController_1 = require("../controllers/citizenAuthController");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const asyncHandler_1 = require("../middleware/asyncHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /citizen-auth/check-registration:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Check if mobile number is registered
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: '9876543210'
 *     responses:
 *       200:
 *         description: Registration status returned
 */
router.post('/check-registration', [
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.checkRegistration));
/**
 * @swagger
 * /citizen-auth/request-otp:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Request OTP for mobile number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: '9876543210'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/request-otp', rateLimiter_1.otpLimiter, // Rate limit: 5 requests per 5 minutes
[
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.requestOTP));
/**
 * @swagger
 * /citizen-auth/verify-otp:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Verify OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber, otp]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', rateLimiter_1.authLimiter, // Rate limit: 5 requests per 15 minutes
[
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    (0, express_validator_1.body)('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('Valid 6-digit OTP required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.verifyOTP));
/**
 * @swagger
 * /citizen-auth/register:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Register new citizen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber, password]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Citizen registered successfully
 */
router.post('/register', [
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.register));
/**
 * @swagger
 * /citizen-auth/login:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Login citizen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber, password]
 *             properties:
 *               mobileNumber:
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
 *                 citizen:
 *                   $ref: '#/components/schemas/Citizen'
 */
router.post('/login', rateLimiter_1.authLimiter, // Rate limit: 5 requests per 15 minutes
[
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.login));
/**
 * @swagger
 * /citizen-auth/forgot-password:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Request password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/forgot-password', rateLimiter_1.passwordResetLimiter, // Rate limit: 3 requests per hour
[
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.forgotPassword));
/**
 * @swagger
 * /citizen-auth/reset-password:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Reset password with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber, otp, newPassword]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', rateLimiter_1.passwordResetLimiter, // Rate limit: 3 requests per hour
[
    (0, express_validator_1.body)('mobileNumber')
        .matches(/^\d{10}$/)
        .withMessage('Valid 10-digit mobile number required'),
    (0, express_validator_1.body)('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('Valid 6-digit OTP required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.resetPassword));
/**
 * @swagger
 * /citizen-auth/refresh-token:
 *   post:
 *     tags: [Citizen Auth]
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
 *         description: New access token
 */
router.post('/refresh-token', [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('Refresh token required'),
    validate_1.validate
], (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.refreshToken));
/**
 * @swagger
 * /citizen-auth/logout:
 *   post:
 *     tags: [Citizen Auth]
 *     summary: Logout citizen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (0, asyncHandler_1.asyncHandler)(citizenAuthController_1.CitizenAuthController.logout));
exports.default = router;
//# sourceMappingURL=citizenAuthRoutes.js.map