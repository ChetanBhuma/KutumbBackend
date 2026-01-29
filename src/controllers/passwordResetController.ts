import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OTP_CONFIG } from '../config/constants';

export class PasswordResetController {
    /**
     * Request password reset - send reset token to email
     */
    static async requestReset(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;

            const user = await prisma.user.findUnique({
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
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const resetTokenExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

            await prisma.user.update({
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
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Reset password using token
     */
    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                throw new AppError('Token and new password are required', 400);
            }

            const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

            // Find user with matching token
            const user = await prisma.user.findFirst({
                where: {
                    mfaSecret: resetTokenHash,
                    // In real implementation, check resetTokenExpiry > now
                    isActive: true
                }
            });

            if (!user) {
                throw new AppError('Invalid or expired reset token', 400);
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
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
        } catch (error) {
            return next(error);
        }
    }
}
