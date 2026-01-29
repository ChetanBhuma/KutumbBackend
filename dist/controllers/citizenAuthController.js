"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenAuthController = void 0;
const citizenAuthService = __importStar(require("../services/citizenAuthService"));
const logger_1 = require("../config/logger");
const formatMobile = (mobile) => {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    // If 10 digits, add +91
    if (digits.length === 10)
        return `+91${digits}`;
    // If 12 digits (91...), add +
    if (digits.length === 12 && digits.startsWith('91'))
        return `+${digits}`;
    // Return original if unknown (let validation handle it)
    return mobile;
};
class CitizenAuthController {
    /**
     * Check if mobile number is registered
     */
    static async checkRegistration(req, res, next) {
        try {
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const result = await citizenAuthService.checkRegistration(mobileNumber);
            return res.status(200).json({
                success: true,
                data: {
                    isRegistered: result.isRegistered
                }
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Request OTP for mobile number
     */
    static async requestOTP(req, res, next) {
        try {
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const result = await citizenAuthService.requestOTP(mobileNumber, true);
            logger_1.auditLogger.info('OTP requested', {
                mobileNumber,
                success: result.success
            });
            const responseData = {
                success: result.success,
                message: result.message,
                data: result.expiresAt ? {
                    expiresAt: result.expiresAt
                    // OTP removed from response for security
                    // OTP should only be delivered via SMS
                } : undefined
            };
            console.log('DEBUG: Sending response:', JSON.stringify(responseData, null, 2));
            return res.status(result.success ? 200 : 400).json(responseData);
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Verify OTP
     */
    static async verifyOTP(req, res, next) {
        try {
            const { otp } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const result = await citizenAuthService.verifyOTP(mobileNumber, otp);
            logger_1.auditLogger.info('OTP verification attempted', {
                mobileNumber,
                success: result.success
            });
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        tokens: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken
                        },
                        citizen: result.citizen
                    }
                });
            }
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Register new citizen
     */
    static async register(req, res, next) {
        try {
            const { password } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const result = await citizenAuthService.registerCitizen(mobileNumber, password);
            logger_1.auditLogger.info('Citizen registration attempted', {
                mobileNumber,
                success: result.success
            });
            return res.status(result.success ? 201 : 400).json({
                success: result.success,
                message: result.message
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Login citizen
     */
    static async login(req, res, next) {
        try {
            const { password } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await citizenAuthService.loginCitizen(mobileNumber, password, ipAddress);
            logger_1.auditLogger.info('Citizen login attempted', {
                mobileNumber,
                success: result.success,
                ipAddress
            });
            if (result.success) {
                return res.json({
                    success: true,
                    message: result.message,
                    data: {
                        tokens: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken
                        },
                        citizen: result.citizen
                    }
                });
            }
            return res.status(401).json({
                success: false,
                message: result.message
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Forgot password - request OTP
     */
    static async forgotPassword(req, res, next) {
        try {
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const result = await citizenAuthService.forgotPassword(mobileNumber);
            logger_1.auditLogger.info('Password reset requested', {
                mobileNumber,
                success: result.success
            });
            return res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.message,
                data: result.expiresAt ? { expiresAt: result.expiresAt } : undefined
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Reset password with OTP
     */
    static async resetPassword(req, res, next) {
        try {
            const { otp, newPassword } = req.body;
            const mobileNumber = formatMobile(req.body.mobileNumber);
            const result = await citizenAuthService.resetPassword(mobileNumber, otp, newPassword);
            logger_1.auditLogger.info('Password reset attempted', {
                mobileNumber,
                success: result.success
            });
            return res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.message
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Refresh access token
     */
    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }
            // Verify refresh token
            const payload = await citizenAuthService.verifyRefreshToken(refreshToken);
            if (!payload.success) {
                return res.status(401).json({
                    success: false,
                    message: payload.message || 'Invalid refresh token'
                });
            }
            logger_1.auditLogger.info('Token refreshed', {
                userId: payload.userId
            });
            return res.json({
                success: true,
                data: {
                    accessToken: payload.accessToken,
                    refreshToken: payload.refreshToken
                }
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Logout citizen
     */
    static async logout(req, res, next) {
        try {
            const user = req.user;
            if (user && user.mobileNumber) {
                await citizenAuthService.logout(user.mobileNumber);
                logger_1.auditLogger.info(`Citizen logged out: ${user.mobileNumber}`);
            }
            else {
                logger_1.auditLogger.info('Citizen logout attempt without user context');
            }
            return res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            return next(error);
        }
    }
}
exports.CitizenAuthController = CitizenAuthController;
//# sourceMappingURL=citizenAuthController.js.map