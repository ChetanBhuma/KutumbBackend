import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class SOSController {
    /**
     * Create SOS alert (panic button)
     */
    static createAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get all SOS alerts
     */
    /**
     * Get all SOS alerts
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get SOS alert by ID
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update alert status (respond to alert)
     */
    static updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Citizen/officer updates SOS location for real-time tracking
     */
    static updateLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get active alerts (real-time monitoring)
     */
    static getActiveAlerts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get SOS statistics
     */
    static getStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get alert history for a citizen
     */
    static getCitizenHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=sosController.d.ts.map