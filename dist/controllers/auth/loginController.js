"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginController = void 0;
const database_1 = require("../../config/database");
const tokenService_1 = require("../../services/tokenService");
const passwordService_1 = require("../../services/passwordService");
const redisService_1 = require("../../services/redisService");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../config/logger");
const auth_1 = require("../../types/auth");
const resolveUserRole = (user) => {
    return user.role || auth_1.Role.CITIZEN;
};
class LoginController {
    static async login(req, res, next) {
        try {
            const { identifier, password } = req.body; // identifier can be email or phone
            // Find user
            const user = await database_1.prisma.user.findFirst({
                where: {
                    OR: [{ email: identifier }, { phone: identifier }],
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    passwordHash: true,
                    isActive: true,
                    role: true
                }
            });
            if (!user) {
                throw new errorHandler_1.AppError('Invalid credentials', 401);
            }
            // Verify password
            const isValidPassword = await passwordService_1.PasswordService.compare(password, user.passwordHash);
            if (!isValidPassword) {
                logger_1.auditLogger.warn('Failed login attempt', {
                    identifier,
                    ip: req.ip,
                    userAgent: req.get('user-agent')
                });
                throw new errorHandler_1.AppError('Invalid credentials', 401);
            }
            // Generate tokens
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
            const tokens = tokenService_1.TokenService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                citizenId
            });
            // Store refresh token in Redis (7 days)
            await redisService_1.redisService.storeRefreshToken(user.id, tokens.refreshToken, 7 * 24 * 60 * 60);
            // Update last login
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });
            // Log successful login
            logger_1.auditLogger.info('User logged in', {
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
            // Fetch dynamic permissions
            let dynamicPermissions = [];
            try {
                const roleDef = await database_1.prisma.role.findUnique({
                    where: { code: resolvedRole },
                    select: {
                        permissions: {
                            select: { code: true }
                        }
                    }
                });
                if (roleDef && roleDef.permissions) {
                    dynamicPermissions = roleDef.permissions.map(p => p.code);
                }
            }
            catch (err) {
                console.error('Failed to fetch permissions during login', err);
            }
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        role: resolvedRole,
                        permissions: dynamicPermissions
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
    static async logout(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Not authenticated', 401);
            }
            // Delete refresh token from Redis
            await redisService_1.redisService.deleteRefreshToken(req.user.id);
            logger_1.auditLogger.info('User logged out', {
                userId: req.user.id,
                ip: req.ip
            });
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errorHandler_1.AppError('Refresh token required', 400);
            }
            // Verify refresh token
            const payload = tokenService_1.TokenService.verifyRefreshToken(refreshToken);
            // Check if refresh token exists in Redis
            const storedToken = await redisService_1.redisService.getRefreshToken(payload.userId);
            if (storedToken !== refreshToken) {
                throw new errorHandler_1.AppError('Invalid refresh token', 401);
            }
            // Generate new access token
            const accessToken = tokenService_1.TokenService.generateAccessToken({
                userId: payload.userId,
                email: payload.email,
                role: payload.role
            });
            res.json({
                success: true,
                data: { accessToken },
                message: 'Token refreshed successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LoginController = LoginController;
//# sourceMappingURL=loginController.js.map