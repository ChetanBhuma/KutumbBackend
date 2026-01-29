"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationController = void 0;
const logger_1 = require("../config/logger");
const verificationService = __importStar(require("../services/verificationService"));
const errorHandler_1 = require("../middleware/errorHandler");
class VerificationController {
    /**
     * Create verification request
     */
    static async createRequest(req, res, next) {
        try {
            const { entityType, entityId, seniorCitizenId, priority, remarks, documents } = req.body;
            const request = await verificationService.createVerificationRequest({
                entityType,
                entityId,
                seniorCitizenId,
                requestedBy: req.user?.id || '',
                priority,
                remarks,
                documents
            });
            logger_1.auditLogger.info('Verification request created', {
                requestId: request.id,
                entityType,
                createdBy: req.user?.email
            });
            return res.status(201).json({
                success: true,
                data: { request },
                message: 'Verification request created successfully'
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Get all verification requests
     */
    static async list(req, res, next) {
        try {
            const { status, entityType, assignedTo, seniorCitizenId, priority } = req.query;
            const requests = await verificationService.getVerificationRequests({
                status: status,
                entityType: entityType,
                assignedTo: assignedTo,
                seniorCitizenId: seniorCitizenId,
                priority: priority
            });
            return res.json({
                success: true,
                data: { requests, count: requests.length }
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Get verification request by ID
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const request = await verificationService.getVerificationRequests({});
            const found = request.find(r => r.id === id);
            if (!found) {
                throw new errorHandler_1.AppError('Verification request not found', 404);
            }
            return res.json({
                success: true,
                data: { request: found }
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Assign verification request to officer
     */
    static async assign(req, res, next) {
        try {
            const { id } = req.params;
            const { officerId } = req.body;
            const request = await verificationService.assignVerificationRequest(id, officerId);
            logger_1.auditLogger.info('Verification request assigned', {
                requestId: id,
                assignedTo: officerId,
                assignedBy: req.user?.email
            });
            return res.json({
                success: true,
                data: { request },
                message: 'Verification request assigned successfully'
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Update verification status
     */
    static async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, verificationMethod, verificationNotes, rejectionReason } = req.body;
            const request = await verificationService.updateVerificationStatus(id, {
                status,
                verifiedBy: req.user?.id,
                verificationMethod,
                verificationNotes,
                rejectionReason
            });
            logger_1.auditLogger.info('Verification status updated', {
                requestId: id,
                status,
                verifiedBy: req.user?.email
            });
            return res.json({
                success: true,
                data: { request },
                message: 'Verification status updated successfully'
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Get verification statistics
     */
    static async getStatistics(req, res, next) {
        try {
            const { entityType, assignedTo } = req.query;
            const stats = await verificationService.getVerificationStatistics({
                entityType: entityType,
                assignedTo: assignedTo
            });
            return res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            return next(error);
        }
    }
}
exports.VerificationController = VerificationController;
//# sourceMappingURL=verificationController.js.map