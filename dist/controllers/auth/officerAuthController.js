"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerAuthController = void 0;
const database_1 = require("../../config/database");
const tokenService_1 = require("../../services/tokenService");
const otpService_1 = require("../../services/otpService");
const redisService_1 = require("../../services/redisService");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../config/logger");
const auth_1 = require("../../types/auth");
const resolveUserRole = (user) => {
    return user.role || auth_1.Role.OFFICER;
};
class OfficerAuthController {
    static async sendOTP(req, res, next) {
        try {
            const { badgeNumber } = req.body;
            if (!badgeNumber) {
                throw new errorHandler_1.AppError('Badge number is required', 400);
            }
            // Find officer by badge number
            const officer = await database_1.prisma.beatOfficer.findUnique({
                where: { badgeNumber },
                include: { user: true }
            });
            if (!officer) {
                throw new errorHandler_1.AppError('Officer not found', 404);
            }
            if (!officer.mobileNumber) {
                throw new errorHandler_1.AppError('Officer mobile number not registered', 400);
            }
            // Generate OTP
            const otp = otpService_1.OTPService.generate();
            // Store OTP in Redis (10 minutes) - Use badgeNumber as key prefix or mobile
            // Using mobileNumber ensures consistency if we reuse OTP verification logic,
            // but here we want to verify against badgeNumber flow.
            // Let's store against mobileNumber to reuse common OTP verification if needed,
            // or store against badgeNumber. Let's store against badgeNumber for this specific flow.
            await redisService_1.redisService.storeOTP(`officer:${badgeNumber}`, otp.code, 10 * 60);
            // TODO: Send OTP via SMS gateway to officer.mobileNumber
            if (process.env.NODE_ENV !== 'production') {
                console.log(`OTP for Officer ${badgeNumber} (${officer.mobileNumber}): ${otp.code}`);
            }
            logger_1.auditLogger.info('Officer OTP sent', {
                officerId: officer.id,
                badgeNumber,
                mobileNumber: officer.mobileNumber, // Mask in prod
                ip: req.ip
            });
            res.json({
                success: true,
                data: {
                    expiresAt: otp.expiresAt,
                    message: `OTP sent to mobile ending in ${officer.mobileNumber.slice(-4)}`,
                    ...(process.env.NODE_ENV === 'development' && { otp: otp.code })
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyOTP(req, res, next) {
        try {
            const { badgeNumber, otp } = req.body;
            if (!badgeNumber || !otp) {
                throw new errorHandler_1.AppError('Badge number and OTP are required', 400);
            }
            const isDevBypass = process.env.NODE_ENV !== 'production' && otp === '000000';
            if (!isDevBypass) {
                const storedOTP = await redisService_1.redisService.getOTP(`officer:${badgeNumber}`);
                if (!storedOTP) {
                    throw new errorHandler_1.AppError('OTP expired or not found', 400);
                }
                if (storedOTP !== otp) {
                    logger_1.auditLogger.warn('Invalid Officer OTP attempt', { badgeNumber, ip: req.ip });
                    throw new errorHandler_1.AppError('Invalid OTP', 400);
                }
                await redisService_1.redisService.deleteOTP(`officer:${badgeNumber}`);
            }
            // Find officer and linked user
            const officer = await database_1.prisma.beatOfficer.findUnique({
                where: { badgeNumber },
                include: { user: true }
            });
            if (!officer) {
                throw new errorHandler_1.AppError('Officer not found', 404);
            }
            let user = officer.user;
            if (!user) {
                // If officer exists but no user account, create one?
                // Or fail? Requirement says "Officers will log in using their unique Official ID".
                // It implies they should be able to log in.
                // Let's create a user if missing, linked to this officer.
                // We need a unique email or phone for the User table.
                // Officer has mobileNumber.
                user = await database_1.prisma.user.create({
                    data: {
                        email: officer.email || `officer.${officer.badgeNumber}@delhipolice.gov.in`, // Fallback email
                        phone: officer.mobileNumber,
                        passwordHash: '', // No password
                        role: auth_1.Role.OFFICER,
                        isActive: true,
                        officerProfile: {
                            connect: { id: officer.id }
                        }
                    }
                });
            }
            const resolvedRole = resolveUserRole(user);
            // Generate tokens
            const tokens = tokenService_1.TokenService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: resolvedRole
            });
            await redisService_1.redisService.storeRefreshToken(user.id, tokens.refreshToken, 7 * 24 * 60 * 60);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });
            logger_1.auditLogger.info('Officer logged in', {
                userId: user.id,
                officerId: officer.id,
                badgeNumber,
                ip: req.ip
            });
            const permissionCodes = await database_1.prisma.role.findUnique({
                where: { code: resolvedRole },
                select: {
                    permissions: {
                        select: { code: true }
                    }
                }
            });
            console.log('[AuthDebug] Officer Login:', {
                userRole: user.role,
                resolvedRole: resolvedRole,
                officerBadge: officer.badgeNumber
            });
            console.log('[AuthDebug] Raw Permission Codes from DB:', JSON.stringify(permissionCodes));
            const permissions = permissionCodes?.permissions.map(p => p.code) || [];
            console.log('[AuthDebug] Mapped Permissions:', permissions);
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: resolvedRole,
                        permissions, // Send permissions to frontend
                        officerProfile: {
                            id: officer.id,
                            name: officer.name,
                            badgeNumber: officer.badgeNumber,
                            rank: officer.rank
                        }
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
exports.OfficerAuthController = OfficerAuthController;
//# sourceMappingURL=officerAuthController.js.map