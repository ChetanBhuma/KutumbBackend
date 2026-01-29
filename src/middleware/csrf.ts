import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';


/**
 * CSRF protection middleware
 * Uses double-submit cookie pattern
 */
export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    }
});

/**
 * Middleware to attach CSRF token to response
 */
export const attachCsrfToken = (req: Request, res: Response, next: NextFunction) => {
    res.locals.csrfToken = (req as any).csrfToken();
    next();
};

/**
 * Endpoint to get CSRF token
 */
export const getCsrfToken = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            csrfToken: (req as any).csrfToken()
        }
    });
};

/**
 * CSRF error handler
 */
export const csrfErrorHandler = (err: any, _req: Request, res: Response, next: NextFunction): any => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Invalid CSRF token. Please refresh the page and try again.'
            }
        });
    }
    next(err);
};
