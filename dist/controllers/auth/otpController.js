"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPController = void 0;
const database_1 = require("../../config/database");
const tokenService_1 = require("../../services/tokenService");
const otpService_1 = require("../../services/otpService");
const redisService_1 = require("../../services/redisService");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../config/logger");
const auth_1 = require("../../types/auth");
const resolveUserRole = (user) => {
    if (user.role && typeof user.role === 'object' && 'code' in user.role) {
        return user.role.code || auth_1.Role.CITIZEN;
    }
    return user.legacyRole || user.role || auth_1.Role.CITIZEN;
};
class OTPController {
    static async sendOTP(req, res, next) {
        try {
            const { identifier } = req.body; // phone or email
            // Generate OTP
            const otp = otpService_1.OTPService.generate();
            // Store OTP in Redis (10 minutes)
            await redisService_1.redisService.storeOTP(identifier, otp.code, 10 * 60);
            // TODO: Send OTP via SMS/Email gateway
            // For now, log it (in production, remove this!)
            if (process.env.NODE_ENV !== 'production') {
                console.log(`OTP for ${identifier}: ${otp.code}`);
            }
            logger_1.auditLogger.info('OTP sent', {
                identifier,
                expiresAt: otp.expiresAt,
                ip: req.ip
            });
            res.json({
                success: true,
                data: {
                    expiresAt: otp.expiresAt,
                    ...(process.env.NODE_ENV === 'development' && { otp: otp.code }) // Only in dev
                },
                message: 'OTP sent successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyOTP(req, res, next) {
        try {
            const { identifier, otp } = req.body;
            // Get stored OTP from Redis
            const storedOTP = await redisService_1.redisService.getOTP(identifier);
            if (!storedOTP) {
                throw new errorHandler_1.AppError('OTP expired or not found', 400);
            }
            // Verify OTP
            if (storedOTP !== otp) {
                logger_1.auditLogger.warn('Invalid OTP attempt', {
                    identifier,
                    ip: req.ip
                });
                throw new errorHandler_1.AppError('Invalid OTP', 400);
            }
            // Delete OTP after successful verification
            await redisService_1.redisService.deleteOTP(identifier);
            // Find or create user
            let user = await database_1.prisma.user.findFirst({
                where: {
                    OR: [{ email: identifier }, { phone: identifier }]
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true
                }
            });
            if (!user) {
                // Auto-register user with OTP login
                user = await database_1.prisma.user.create({
                    data: {
                        email: identifier.includes('@') ? identifier : '',
                        phone: identifier.includes('@') ? '' : identifier,
                        passwordHash: '', // No password for OTP users
                        role: auth_1.Role.CITIZEN,
                        isActive: true
                    },
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        role: true
                    }
                });
            }
            const resolvedRole = resolveUserRole(user);
            let citizenId;
            if (resolvedRole === auth_1.Role.CITIZEN) {
                const citizen = await database_1.prisma.seniorCitizen.findUnique({
                    where: { userId: user.id }
                });
                if (citizen) {
                    citizenId = citizen.id;
                }
            }
            // Generate tokens
            const tokens = tokenService_1.TokenService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                citizenId
            });
            // Store refresh token
            await redisService_1.redisService.storeRefreshToken(user.id, tokens.refreshToken, 7 * 24 * 60 * 60);
            // Update last login
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });
            logger_1.auditLogger.info('OTP login successful', {
                userId: user.id,
                role: resolvedRole,
                identifier,
                ip: req.ip
            });
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        role: resolvedRole
                    },
                    tokens
                },
                message: 'Login successful'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OTPController = OTPController;
//# sourceMappingURL=otpController.js.map