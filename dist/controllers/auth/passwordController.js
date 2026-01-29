"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../../config/database");
const passwordService_1 = require("../../services/passwordService");
const redisService_1 = require("../../services/redisService");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../config/logger");
class PasswordController {
    static async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const user = await database_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Don't reveal user existence
                res.json({
                    success: true,
                    message: 'If an account exists with this email, a password reset link has been sent.'
                });
                return;
            }
            // Generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
            // Store in Redis (1 hour)
            await redisService_1.redisService.storeResetToken(resetTokenHash, user.id, 3600);
            // Log for dev
            if (process.env.NODE_ENV === 'development') {
                logger_1.auditLogger.debug(`Reset Token for ${email}: ${resetToken}`, { email });
            }
            logger_1.auditLogger.info('Password reset requested', { email, ip: req.ip });
            res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            const resetTokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const userId = await redisService_1.redisService.getResetToken(resetTokenHash);
            if (!userId) {
                throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
            }
            // Validate new password
            const passwordValidation = passwordService_1.PasswordService.validateStrength(password);
            if (!passwordValidation.valid) {
                throw new errorHandler_1.AppError(passwordValidation.errors.join(', '), 400);
            }
            // Hash new password
            const passwordHash = await passwordService_1.PasswordService.hash(password);
            // Update user
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { passwordHash }
            });
            // Delete token
            await redisService_1.redisService.deleteResetToken(resetTokenHash);
            // SECURITY: Invalidate all active sessions for this user
            // This forces the user to log in again with the new password everywhere
            await redisService_1.redisService.deleteRefreshToken(userId);
            logger_1.auditLogger.info('Password reset successful', { userId, ip: req.ip });
            res.json({
                success: true,
                message: 'Password reset successful'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PasswordController = PasswordController;
//# sourceMappingURL=passwordController.js.map