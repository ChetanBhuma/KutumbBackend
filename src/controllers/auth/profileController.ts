import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Role } from '../../types/auth';
import { AuthRequest } from '../../middleware/authenticate';

const resolveUserRole = (user: { role?: string }): Role => {
    return (user.role as Role) || Role.CITIZEN;
};

export class ProfileController {
    static async me(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new AppError('Not authenticated', 401);
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    mfaEnabled: true,
                    lastLogin: true,
                    createdAt: true
                }
            });

            if (!user) {
                throw new AppError('User not found', 404);
            }

            const resolvedRole = resolveUserRole(user);

            // Fetch dynamic permissions
            let dynamicPermissions: string[] = [];
            try {
                const roleDef = await prisma.role.findUnique({
                    where: { code: resolvedRole },
                    include: {
                        permissions: true
                    }
                });
                if (roleDef && roleDef.permissions) {
                    const perms = roleDef.permissions as any;
                    if (Array.isArray(perms)) {
                        dynamicPermissions = perms.map((p: any) => typeof p === 'string' ? p : p.code);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch permissions during profile fetch', err);
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        role: resolvedRole,
                        permissions: dynamicPermissions,
                        isActive: user.isActive,
                        mfaEnabled: user.mfaEnabled,
                        lastLogin: user.lastLogin,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
