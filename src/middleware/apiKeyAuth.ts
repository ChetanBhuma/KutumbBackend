import { Request, Response, NextFunction } from 'express';
import apiKeyService from '../services/apiKeyService';

// Middleware to authenticate API key
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): any => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required. Provide X-API-Key header.'
        });
    }

    const validKey = apiKeyService.validateApiKey(apiKey);

    if (!validKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired API key'
        });
    }

    // Attach API key to request
    (req as any).apiKey = validKey;

    next();
};

// Middleware to check API key permissions
export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction): any => {
        const apiKey = (req as any).apiKey;

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API key not authenticated'
            });
        }

        if (!apiKeyService.hasPermission(apiKey, permission)) {
            return res.status(403).json({
                success: false,
                message: `Permission denied. Required: ${permission}`
            });
        }

        next();
    };
};
