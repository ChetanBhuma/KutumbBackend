"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../config/logger");
const validate = (req, _res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        logger_1.auditLogger.warn('Validation Errors:', { errors: errors.array() });
        return next(new errorHandler_1.AppError(errorMessages, 400));
    }
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map