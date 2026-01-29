import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authenticate';

export class SettingsController {
    /**
     * Get all system settings
     */
    static async getSettings(_req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await prisma.systemSetting.findMany({
                orderBy: { key: 'asc' }
            });

            // Convert array to object for easier frontend consumption
            const settingsMap = settings.reduce((acc: any, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            res.json({
                success: true,
                data: {
                    list: settings,
                    map: settingsMap
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a specific setting
     */
    static async updateSetting(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { key } = req.params;
            const { value, description } = req.body;

            if (value === undefined) {
                throw new AppError('Value is required', 400);
            }

            const setting = await prisma.systemSetting.upsert({
                where: { key },
                update: {
                    value: String(value),
                    description,
                    updatedBy: req.user?.email
                },
                create: {
                    key,
                    value: String(value),
                    description,
                    updatedBy: req.user?.email
                }
            });

            res.json({
                success: true,
                data: setting,
                message: 'Setting updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
