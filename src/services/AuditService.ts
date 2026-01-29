
import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

export class AuditService {
    /**
     * Create an audit log entry
     * @param userId - ID of the user performing the action
     * @param action - Action performed (e.g., 'LOGIN', 'CREATE_USER')
     * @param resource - Resource affected (e.g., 'User', 'SeniorCitizen')
     * @param resourceId - Optional ID of the resource
     * @param details - Additional details about the action
     * @param ipAddress - IP address of the user
     * @param userAgent - User agent string
     */
    static async log(
        userId: string,
        action: string,
        resource: string,
        resourceId: string | undefined,
        details: any,
        ipAddress: string,
        userAgent: string
    ) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resource,
                    resourceId,
                    changes: typeof details === 'string' ? details : JSON.stringify(details),
                    ipAddress,
                    userAgent,
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to avoid blocking the main action
        }
    }
}
