import { Express } from 'express-serve-static-core';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                mobileNumber?: string;
                role: string;
                citizenId?: string | null;
                permissions?: string[];
            };
            file?: Express.Multer.File;
            files?: Express.Multer.File[];
        }
    }
}

export { };
