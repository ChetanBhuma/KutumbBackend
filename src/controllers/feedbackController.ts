import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { auditLogger } from '../config/logger';

const db = prisma as any;

export class FeedbackController {
    /**
     * Submit visit feedback
     */
    static async submitFeedback(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { visitId, rating, comments } = req.body;

            // Check if visit exists and is completed
            const visit = await db.visit.findUnique({
                where: { id: visitId },
                include: { SeniorCitizen: true }
            });

            if (!visit) {
                throw new AppError('Visit not found', 404);
            }

            if (visit.status !== 'Completed') {
                throw new AppError('Can only provide feedback for completed visits', 400);
            }

            // Check if feedback already exists
            const existing = await db.visitFeedback.findUnique({
                where: { visitId }
            });

            if (existing) {
                throw new AppError('Feedback already submitted for this visit', 409);
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

            auditLogger.info('Visit feedback submitted', {
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
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get feedback for a visit
     */
    static async getByVisit(req: Request, res: Response, next: NextFunction) {
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
                throw new AppError('Feedback not found', 404);
            }

            return res.json({
                success: true,
                data: { feedback }
            });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get officer performance metrics
     */
    static async getOfficerMetrics(req: Request, res: Response, next: NextFunction) {
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
                ? feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / totalFeedbacks
                : 0;

            const ratingDistribution = {
                1: feedbacks.filter((f: any) => f.rating === 1).length,
                2: feedbacks.filter((f: any) => f.rating === 2).length,
                3: feedbacks.filter((f: any) => f.rating === 3).length,
                4: feedbacks.filter((f: any) => f.rating === 4).length,
                5: feedbacks.filter((f: any) => f.rating === 5).length
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
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get all feedbacks with filters
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { officerId, rating, startDate, endDate } = req.query;

            const where: any = {};

            if (officerId) {
                where.visit = { officerId: String(officerId) };
            }

            if (rating) {
                where.rating = parseInt(String(rating));
            }

            if (startDate || endDate) {
                where.submittedAt = {};
                if (startDate) where.submittedAt.gte = new Date(String(startDate));
                if (endDate) where.submittedAt.lte = new Date(String(endDate));
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
        } catch (error) {
            return next(error);
        }
    }
}
