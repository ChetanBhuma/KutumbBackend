import { Request, Response, NextFunction } from 'express';
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => any;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=apiKeyAuth.d.ts.map