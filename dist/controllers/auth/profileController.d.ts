import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
export declare class ProfileController {
    static me(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=profileController.d.ts.map