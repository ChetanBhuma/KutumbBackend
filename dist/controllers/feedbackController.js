"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const db = database_1.prisma;
class FeedbackController {
    /**
     * Submit visit feedback
     */
    static async submitFeedback(req, res, next) {
        try {
            const { visitId, rating, comments } = req.body;
            // Check if visit exists and is completed
            const visit = await db.visit.findUnique({
                where: { id: visitId },
                include: { SeniorCitizen: true }
            });
            if (!visit) {
                throw new errorHandler_1.AppError('Visit not found', 404);
            }
            if (visit.status !== 'Completed') {
                throw new errorHandler_1.AppError('Can only provide feedback for completed visits', 400);
            }
            // Check if feedback already exists
            const existing = await db.visitFeedback.findUnique({
                where: { visitId }
            });
            if (existing) {
                throw new errorHandler_1.AppError('Feedback already submitted for this visit', 409);
            }
            // Create feedback
            const feedback = await db.visitFeedback.create({
                data: {
                    visitId,
                    rating,
                    comments,
                    submittedBy: req.user?.id || visit.seniorCitizenId
                }
            });
            logger_1.auditLogger.info('Visit feedback submitted', {
                feedbackId: feedback.id,
                visitId,
                rating,
                submittedBy: req.user?.email
            });
            return res.status(201).json({
                success: true,
                data: { feedback },
                message: 'Feedback submitted successfully'
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Get feedback for a visit
     */
    static async getByVisit(req, res, next) {
        try {
            const { visitId } = req.params;
            const feedback = await db.visitFeedback.findUnique({
                where: { visitId },
                include: {
                    Visit: {
                        include: {
                            SeniorCitizen: {
                                select: {
                                    id: true,
                                    fullName: true
                                }
                            },
                            officer: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            if (!feedback) {
                throw new errorHandler_1.AppError('Feedback not found', 404);
            }
            return res.json({
                success: true,
                data: { feedback }
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Get officer performance metrics
     */
    static async getOfficerMetrics(req, res, next) {
        try {
            const { officerId } = req.params;
            const feedbacks = await db.visitFeedback.findMany({
                where: {
                    Visit: {
                        officerId
                    }
                },
                include: {
                    Visit: {
                        select: {
                            id: true,
                            scheduledDate: true,
                            completedDate: true
                        }
                    }
                }
            });
            const totalFeedbacks = feedbacks.length;
            const averageRating = totalFeedbacks > 0
                ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
                : 0;
            const ratingDistribution = {
                1: feedbacks.filter((f) => f.rating === 1).length,
                2: feedbacks.filter((f) => f.rating === 2).length,
                3: feedbacks.filter((f) => f.rating === 3).length,
                4: feedbacks.filter((f) => f.rating === 4).length,
                5: feedbacks.filter((f) => f.rating === 5).length
            };
            return res.json({
                success: true,
                data: {
                    officerId,
                    totalFeedbacks,
                    averageRating: parseFloat(averageRating.toFixed(2)),
                    ratingDistribution,
                    recentFeedbacks: feedbacks.slice(0, 10)
                }
            });
        }
        catch (error) {
            return next(error);
        }
    }
    /**
     * Get all feedbacks with filters
     */
    static async list(req, res, next) {
        try {
            const { officerId, rating, startDate, endDate } = req.query;
            const where = {};
            if (officerId) {
                where.visit = { officerId: String(officerId) };
            }
            if (rating) {
                where.rating = parseInt(String(rating));
            }
            if (startDate || endDate) {
                where.submittedAt = {};
                if (startDate)
                    where.submittedAt.gte = new Date(String(startDate));
                if (endDate)
                    where.submittedAt.lte = new Date(String(endDate));
            }
            const feedbacks = await db.visitFeedback.findMany({
                where,
                include: {
                    Visit: {
                        include: {
                            SeniorCitizen: {
                                select: {
                                    id: true,
                                    fullName: true
                                }
                            },
                            officer: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json({
                success: true,
                data: {
                    feedbacks,
                    count: feedbacks.length
                }
            });
        }
        catch (error) {
            return next(error);
        }
    }
}
exports.FeedbackController = FeedbackController;
//# sourceMappingURL=feedbackController.js.map