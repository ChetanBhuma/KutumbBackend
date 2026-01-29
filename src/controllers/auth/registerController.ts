import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { PasswordService } from '../../services/passwordService';
import { AppError } from '../../middleware/errorHandler';
import { auditLogger } from '../../config/logger';
import { Role } from '../../types/auth';

const resolveUserRole = (user: { role?: string }): Role => {
    return (user.role as Role) || Role.CITIZEN;
};

export class RegisterController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, phone, password, role = Role.CITIZEN } = req.body;

            // Validate password strength
            const passwordValidation = PasswordService.validateStrength(password);
            if (!passwordValidation.valid) {
                throw new AppError(passwordValidation.errors.join(', '), 400);
            }

            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [{ email }, { phone }]
                }
            });

            if (existingUser) {
                throw new AppError('User with this email or phone already exists', 409);
            }

            // Hash password
            const passwordHash = await PasswordService.hash(password);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    phone,
                    passwordHash,
                    role,
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true
                }
            });

            // Log registration
            const resolvedRole = resolveUserRole(user);
            const formattedUser = {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: resolvedRole,
                createdAt: user.createdAt
            };

            auditLogger.info('User registered', {
                userId: user.id,
                email: user.email,
                role: resolvedRole,
                ip: req.ip
            });

            res.status(201).json({
                success: true,
                data: { user: formattedUser },
                message: 'User registered successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
