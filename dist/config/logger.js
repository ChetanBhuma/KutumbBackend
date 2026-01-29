"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_1 = require("./index");
// Create logs directory if it doesn't exist
const logsDir = path_1.default.resolve(index_1.config.logging.filePath);
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Define console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
}));
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: index_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'senior-citizen-portal' },
    transports: [
        // Write all logs to combined.log
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        // Write errors to error.log
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});
// Add console transport in development
// Add console transport in ALL environments (Critical for Render/Docker)
exports.logger.add(new winston_1.default.transports.Console({
    // Use JSON in production for better parsing, Colorized simple text in dev
    format: index_1.config.env === 'production' ? logFormat : consoleFormat
}));
// Create audit logger for security events
exports.auditLogger = winston_1.default.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'audit' },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'audit.log'),
            maxsize: 10485760,
            maxFiles: 10 // Keep audit logs longer (CERT-In compliance)
        })
    ]
});
//# sourceMappingURL=logger.js.map