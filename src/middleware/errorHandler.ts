import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    details?: unknown;

    constructor(message: string, statusCode: number, code?: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 409, 'CONFLICT_ERROR', details);
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(error: any): { statusCode: number; message: string; code?: string } {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                const field = error.meta?.target as string[] | undefined;
                return {
                    statusCode: 409,
                    message: `A record with this ${field?.join(', ') || 'value'} already exists`,
                    code: 'DUPLICATE_ENTRY'
                };
            case 'P2025':
                // Record not found
                return {
                    statusCode: 404,
                    message: 'Record not found',
                    code: 'NOT_FOUND'
                };
            case 'P2003':
                // Foreign key constraint violation
                return {
                    statusCode: 400,
                    message: 'Invalid reference to related record',
                    code: 'INVALID_REFERENCE'
                };
            case 'P2014':
                // Required relation violation
                return {
                    statusCode: 400,
                    message: 'The change would violate a required relation',
                    code: 'RELATION_VIOLATION'
                };
            default:
                return {
                    statusCode: 400,
                    message: 'Database operation failed',
                    code: error.code
                };
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return {
            statusCode: 400,
            message: 'Invalid data provided',
            code: 'VALIDATION_ERROR'
        };
    }

    return {
        statusCode: 500,
        message: 'Database error occurred',
        code: 'DATABASE_ERROR'
    };
}

/**
 * Main error handler middleware
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code: string | undefined;
    let details: unknown;

    // Handle custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        details = err.details;
    }
    // Handle Prisma errors
    else if (err.constructor.name.includes('Prisma')) {
        const prismaError = handlePrismaError(err);
        statusCode = prismaError.statusCode;
        message = prismaError.message;
        code = prismaError.code;
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    // Handle validation errors
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
        code = 'VALIDATION_ERROR';
    }
    // Handle multer errors (file upload)
    else if (err.name === 'MulterError') {
        statusCode = 400;
        message = `File upload error: ${err.message}`;
        code = 'FILE_UPLOAD_ERROR';
    }

    // Log error (don't log 4xx errors as errors, log as warnings)
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel]({
        message: err.message,
        stack: err.stack,
        statusCode,
        code,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.id
    });

    // Send error response
    const errorResponse: any = {
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                name: err.name
            })
        }
    };

    if (code) {
        errorResponse.error.code = code;
    }

    if (details) {
        errorResponse.error.details = details;
    }

    res.status(statusCode).json(errorResponse);
};
