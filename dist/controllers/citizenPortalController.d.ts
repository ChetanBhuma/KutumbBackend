import { Request, Response, NextFunction } from 'express';
export declare class CitizenPortalController {
    /**
     * Start a new citizen registration (mobile + basic info)
     */
    static startRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Verify OTP and finalize simple registration
     */
    static verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Save incremental registration step data (wizard progress)
     */
    static saveRegistrationStep(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Fetch registration details by ID (for citizen self-service)
     * Public endpoint - Returns only status/basic info
     */
    static getRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Detailed view for admin inbox with timeline + linked entities
     * Secured: Requires Admin/Officer permission OR Ownership
     */
    static getRegistrationDetails(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Finalize registration and create the citizen record
     */
    /**
     * Finalize registration and update the citizen record
     */
    static submitRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Admin inbox: list citizen registrations
     */
    static listRegistrations(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update registration status (admin action)
     */
    static updateRegistrationStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List visit requests for admins
     */
    static listVisitRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update visit request status
     */
    static updateVisitRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Citizens (or applicants) can request a visit
     */
    static createVisitRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Visit request tied to a registration (before approval)
     */
    static createRegistrationVisitRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get list of visits for the logged-in citizen
     */
    static getMyVisits(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=citizenPortalController.d.ts.map