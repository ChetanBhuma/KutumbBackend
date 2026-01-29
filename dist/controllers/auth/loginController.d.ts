import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
export declare class LoginController {
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=loginController.d.ts.map