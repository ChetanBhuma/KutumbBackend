"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfErrorHandler = exports.getCsrfToken = exports.attachCsrfToken = exports.csrfProtection = void 0;
const csurf_1 = __importDefault(require("csurf"));
/**
 * CSRF protection middleware
 * Uses double-submit cookie pattern
 */
exports.csrfProtection = (0, csurf_1.default)({
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
const attachCsrfToken = (req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
};
exports.attachCsrfToken = attachCsrfToken;
/**
 * Endpoint to get CSRF token
 */
const getCsrfToken = (req, res) => {
    res.json({
        success: true,
        data: {
            csrfToken: req.csrfToken()
        }
    });
};
exports.getCsrfToken = getCsrfToken;
/**
 * CSRF error handler
 */
const csrfErrorHandler = (err, _req, res, next) => {
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
exports.csrfErrorHandler = csrfErrorHandler;
//# sourceMappingURL=csrf.js.map