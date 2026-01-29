import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
export declare class CitizenProfileController {
    /**
     * Helper to check if a profile is effectively complete (no placeholders)
     */
    static isProfileComplete(citizen: any): boolean;
    /**
     * Get own profile
     */
    static getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Update own profile
     */
    static updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Helper to sync SeniorCitizen status with CitizenRegistration
     */
    private static syncCitizenStatus;
    /**
     * Get own visits
     */
    static getVisits(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Request a visit
     */
    static requestVisit(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Get own SOS alerts
     */
    static getSOS(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Create SOS alert
     */
    static createSOS(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Upload document
     */
    static uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Get own documents
     */
    static getDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Update notification preferences
     */
    static updateNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Submit feedback
     */
    static submitFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
//# sourceMappingURL=citizenProfileController.d.ts.map