import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { PasswordService } from '../../services/passwordService';
import { redisService } from '../../services/redisService';
import { AppError } from '../../middleware/errorHandler';
import { auditLogger } from '../../config/logger';

export class PasswordController {
    static async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Don't reveal user existence
                res.json({
                    success: true,
                    message: 'If an account exists with this email, a password reset link has been sent.'
                });
                return;
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Store in Redis (1 hour)
            await redisService.storeResetToken(resetTokenHash, user.id, 3600);

            // Log for dev
            if (process.env.NODE_ENV === 'development') {
                auditLogger.debug(`Reset Token for ${email}: ${resetToken}`, { email });
            }

            auditLogger.info('Password reset requested', { email, ip: req.ip });

            res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body;

            const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const userId = await redisService.getResetToken(resetTokenHash);

            if (!userId) {
                throw new AppError('Invalid or expired reset token', 400);
            }

            // Validate new password
            const passwordValidation = PasswordService.validateStrength(password);
            if (!passwordValidation.valid) {
                throw new AppError(passwordValidation.errors.join(', '), 400);
            }

            // Hash new password
            const passwordHash = await PasswordService.hash(password);

            // Update user
            await prisma.user.update({
                where: { id: userId },
                data: { passwordHash }
            });

            // Delete token
            await redisService.deleteResetToken(resetTokenHash);

            // SECURITY: Invalidate all active sessions for this user
            // This forces the user to log in again with the new password everywhere
            await redisService.deleteRefreshToken(userId);

            auditLogger.info('Password reset successful', { userId, ip: req.ip });

            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            next(error);
        }
    }
}
