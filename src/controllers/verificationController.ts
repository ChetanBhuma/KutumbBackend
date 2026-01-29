import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { auditLogger } from '../config/logger';
import * as verificationService from '../services/verificationService';
import { AppError } from '../middleware/errorHandler';

export class VerificationController {
    /**
     * Create verification request
     */
    static async createRequest(req: AuthRequest, res: Response, next: NextFunction) {
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

            auditLogger.info('Verification request created', {
                requestId: request.id,
                entityType,
                createdBy: req.user?.email
            });

            return res.status(201).json({
                success: true,
                data: { request },
                message: 'Verification request created successfully'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get all verification requests
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, entityType, assignedTo, seniorCitizenId, priority } = req.query;

            const requests = await verificationService.getVerificationRequests({
                status: status as any,
                entityType: entityType as any,
                assignedTo: assignedTo as string,
                seniorCitizenId: seniorCitizenId as string,
                priority: priority as any
            });

            return res.json({
                success: true,
                data: { requests, count: requests.length }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get verification request by ID
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const request = await verificationService.getVerificationRequests({});
            const found = request.find(r => r.id === id);

            if (!found) {
                throw new AppError('Verification request not found', 404);
            }

            return res.json({
                success: true,
                data: { request: found }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Assign verification request to officer
     */
    static async assign(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { officerId } = req.body;

            const request = await verificationService.assignVerificationRequest(id, officerId);

            auditLogger.info('Verification request assigned', {
                requestId: id,
                assignedTo: officerId,
                assignedBy: req.user?.email
            });

            return res.json({
                success: true,
                data: { request },
                message: 'Verification request assigned successfully'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Update verification status
     */
    static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
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

            auditLogger.info('Verification status updated', {
                requestId: id,
                status,
                verifiedBy: req.user?.email
            });

            return res.json({
                success: true,
                data: { request },
                message: 'Verification status updated successfully'
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get verification statistics
     */
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const { entityType, assignedTo } = req.query;

            const stats = await verificationService.getVerificationStatistics({
                entityType: entityType as any,
                assignedTo: assignedTo as string
            });

            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            return next(error);
        }
    }
}
