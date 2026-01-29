import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class SettingsController {
    /**
     * Get all system settings
     */
    static getSettings(_req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update a specific setting
     */
    static updateSetting(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=settingsController.d.ts.map