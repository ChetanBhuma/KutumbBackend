"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const constants_1 = require("../config/constants");
class PasswordResetController {
    /**
     * Request password reset - send reset token to email
     */
    static async requestReset(req, res, next) {
        try {
            const { email } = req.body;
            const user = await database_1.prisma.user.findUnique({
                where: { email }
            });
            // Don't reveal if user exists
            if (!user) {
                return res.json({
                    success: true,
                    message: 'If the email exists, a reset link has been sent'
                });
            }
            // Generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
            const resetTokenExpiry = new Date(Date.now() + constants_1.OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    // Note: schema doesn't have resetToken field yet
                    // This would need a migration to add resetToken, resetTokenExpiry fields
                    // For now, using mfaSecret as temporary storage (not ideal)
                    mfaSecret: resetTokenHash,
                    updatedAt: resetTokenExpiry
                }
            });
            // TODO: Send email with reset link
            // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            // await EmailService.sendPasswordReset(user.email, resetUrl);
            console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
            return res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent',
                // Remove in production:
                dev_token: process.env.NODE_ENV === 'development' ? resetToken : undefined
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Reset password using token
     */
    static async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                throw new errorHandler_1.AppError('Token and new password are required', 400);
            }
            const resetTokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            // Find user with matching token
            const user = await database_1.prisma.user.findFirst({
                where: {
                    mfaSecret: resetTokenHash,
                    // In real implementation, check resetTokenExpiry > now
                    isActive: true
                }
            });
            if (!user) {
                throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
            }
            // Hash new password
            const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    mfaSecret: null // Clear the token
                }
            });
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        }
        catch (error) {
            return next(error);
        }
    }
}
exports.PasswordResetController = PasswordResetController;
//# sourceMappingURL=passwordResetController.js.map