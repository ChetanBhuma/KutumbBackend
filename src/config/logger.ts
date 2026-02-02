import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from './index';

// Check if running in serverless environment (Vercel has read-only filesystem)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Create logs directory only if not in serverless environment
let logsDir: string | null = null;
if (!isServerless) {
    logsDir = path.resolve(config.logging.filePath);
    try {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    } catch (error) {
        console.warn('Could not create logs directory, using console logging only:', error);
        logsDir = null;
    }
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
);

// Build transports array based on environment
const loggerTransports: winston.transport[] = [];

// Add file transports only if logsDir is available
if (logsDir) {
    loggerTransports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760,
            maxFiles: 5
        })
    );
}

// Always add console transport
loggerTransports.push(new winston.transports.Console({
    format: config.env === 'production' ? logFormat : consoleFormat
}));

// Create logger instance
export const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'senior-citizen-portal' },
    transports: loggerTransports
});

// Build audit transports
const auditTransports: winston.transport[] = [];

// Add file transport for audit only if logsDir is available
if (logsDir) {
    auditTransports.push(
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            maxsize: 10485760,
            maxFiles: 10
        })
    );
}

// Always add console for audit in serverless
auditTransports.push(new winston.transports.Console({
    format: logFormat
}));

// Create audit logger for security events
export const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'audit' },
    transports: auditTransports
});
