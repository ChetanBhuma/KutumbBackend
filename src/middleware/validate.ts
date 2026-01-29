import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';
import { auditLogger } from '../config/logger';

export const validate = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        auditLogger.warn('Validation Errors:', { errors: errors.array() });
        return next(new AppError(errorMessages, 400));
    }

    next();
};
