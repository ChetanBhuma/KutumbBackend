import { logger } from '../config/logger';
import { config } from '../config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum NotificationType {
    SMS = 'SMS',
    EMAIL = 'EMAIL',
    PUSH = 'PUSH',
    IN_APP = 'IN_APP'
}

export enum NotificationPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export interface NotificationPayload {
    recipient: string; // Phone number, email, or user ID
    subject?: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    data?: Record<string, any>;
}

export class NotificationService {
    /**
     * Send SMS notification
     */
    static async sendSMS(phone: string, message: string): Promise<boolean> {
        try {
            // TODO: Integrate with SMS gateway (e.g., Twilio, AWS SNS, or Indian SMS provider)
            // For now, we'll simulate the SMS sending

            logger.info('SMS sent', {
                phone,
                message: message.substring(0, 50) + '...',
                gateway: config.sms?.gateway || 'SIMULATED',
                timestamp: new Date().toISOString()
            });

            // Simulated API call
            if (process.env.SMS_GATEWAY_URL && process.env.SMS_GATEWAY_API_KEY) {
                // Example implementation:
                // const response = await fetch(process.env.SMS_GATEWAY_URL, {
                //   method: 'POST',
                //   headers: {
                //     'Authorization': `Bearer ${process.env.SMS_GATEWAY_API_KEY}`,
                //     'Content-Type': 'application/json'
                //   },
                //   body: JSON.stringify({ phone, message })
                // });
                // return response.ok;
            }

            return true;
        } catch (error) {
            logger.error('SMS sending failed', { phone, error });
            return false;
        }
    }

    /**
     * Send Email notification
     */
    static async sendEmail(
        to: string,
        subject: string,
        _body: string,
        _html?: string
    ): Promise<boolean> {
        try {
            logger.info('Email sent', {
                to,
                subject,
                service: config.email?.service || 'SIMULATED',
                timestamp: new Date().toISOString()
            });

            // TODO: Integrate with email service (e.g., SendGrid, AWS SES, Nodemailer)
            // Example with Nodemailer:
            // const transporter = nodemailer.createTransport({...});
            // await transporter.sendMail({ from: config.email.from, to, subject, text: body, html });

            return true;
        } catch (error) {
            logger.error('Email sending failed', { to, subject, error });
            return false;
        }
    }

    /**
     * Send Push notification (Firebase Cloud Messaging)
     */
    static async sendPushNotification(
        deviceToken: string,
        title: string,
        _body: string,
        _data?: Record<string, any>
    ): Promise<boolean> {
        try {
            logger.info('Push notification sent', {
                deviceToken: deviceToken.substring(0, 20) + '...',
                title,
                timestamp: new Date().toISOString()
            });

            // TODO: Integrate with FCM
            // const message = {
            //   notification: { title, body },
            //   data,
            //   token: deviceToken
            // };
            // await admin.messaging().send(message);

            return true;
        } catch (error) {
            logger.error('Push notification failed', { deviceToken, error });
            return false;
        }
    }

    /**
     * Send notification (multi-channel)
     */
    static async send(payload: NotificationPayload): Promise<boolean> {
        switch (payload.type) {
            case NotificationType.SMS:
                return await this.sendSMS(payload.recipient, payload.message);

            case NotificationType.EMAIL:
                return await this.sendEmail(
                    payload.recipient,
                    payload.subject || 'Notification',
                    payload.message
                );

            case NotificationType.PUSH:
                return await this.sendPushNotification(
                    payload.recipient,
                    payload.subject || 'Notification',
                    payload.message,
                    payload.data
                );

            case NotificationType.IN_APP:
                await this.createInAppNotification({
                    userId: payload.recipient,
                    title: payload.subject || 'Notification',
                    message: payload.message,
                    type: 'system', // Default if not mapped
                    priority: payload.priority || NotificationPriority.NORMAL,
                    data: payload.data
                });
                return true;

            default:
                logger.error('Unknown notification type', { type: payload.type });
                return false;
        }
    }

    /**
     * Send SOS alert notifications
     */
    static async sendSOSAlert(
        citizenName: string,
        citizenPhone: string,
        address: string,
        latitude: number,
        longitude: number,
        targets: {
            officers?: { phone: string; name: string }[];
            emergencyContacts?: { phone: string; name: string }[];
        }
    ): Promise<void> {
        const message = `🚨 EMERGENCY ALERT 🚨\n\n${citizenName} (${citizenPhone}) has triggered SOS alert.\n\nLocation: ${address}\nCoordinates: ${latitude}, ${longitude}\n\nPlease respond immediately!`;

        // Send to officers
        if (targets.officers?.length) {
            for (const officer of targets.officers) {
                await this.sendSMS(officer.phone, message);
            }
        }

        // Send to emergency contacts
        if (targets.emergencyContacts?.length) {
            const contactMessage = `⚠️ ALERT: Your contact ${citizenName} has triggered an emergency alert at ${address}. Police have been notified.`;
            for (const contact of targets.emergencyContacts) {
                await this.sendSMS(contact.phone, contactMessage);
            }
        }

        logger.warn('SOS alert notifications sent', {
            citizenName,
            officerCount: targets.officers?.length || 0,
            contactCount: targets.emergencyContacts?.length || 0
        });
    }

    /**
     * Send visit reminder
     */
    static async sendVisitReminder(
        citizenPhone: string,
        officerName: string,
        visitDate: Date
    ): Promise<void> {
        const message = `Reminder: Officer ${officerName} will visit you on ${visitDate.toLocaleDateString()} at ${visitDate.toLocaleTimeString()}. Stay safe!`;
        await this.sendSMS(citizenPhone, message);
    }

    /**
     * Send visit completion notification
     */
    static async sendVisitCompletionNotification(
        citizenPhone: string,
        officerName: string
    ): Promise<void> {
        const message = `Visit completed by Officer ${officerName}. Thank you for your cooperation. Stay safe!`;
        await this.sendSMS(citizenPhone, message);
    }

    /**
     * Send OTP
     */
    static async sendOTP(phone: string, otp: string): Promise<boolean> {
        const message = `Your OTP for Senior Citizen Portal is: ${otp}. Valid for 10 minutes. Do not share this code.`;
        return await this.sendSMS(phone, message);
    }

    /**
     * Send registration confirmation
     */
    static async sendRegistrationConfirmation(
        phone: string,
        email: string | null,
        name: string
    ): Promise<void> {
        const smsMessage = `Welcome ${name} to Delhi Police Senior Citizen Portal! Your registration is successful. Stay connected, stay safe.`;
        await this.sendSMS(phone, smsMessage);

        if (email) {
            const emailSubject = 'Welcome to Senior Citizen Portal';
            const emailBody = `Dear ${name},\n\nYour registration with Delhi Police Senior Citizen Portal has been completed successfully.\n\nYou can now:\n- Connect with your beat officer\n- Request emergency assistance\n- Schedule visits\n- Access various services\n\nStay safe!\n\nRegards,\nDelhi Police`;
            await this.sendEmail(email, emailSubject, emailBody);
        }
    }

    /**
     * Send verification request notification
     */
    static async sendVerificationRequestNotification(
        citizenName: string,
        citizenPhone: string,
        entityType: string
    ): Promise<boolean> {
        const message = `Dear ${citizenName}, a verification request has been submitted for your ${entityType}. You will be notified once the verification is complete. - Delhi Police`;

        return await this.sendSMS(citizenPhone, message);
    }

    /**
     * Send verification outcome notification
     */
    static async sendVerificationOutcomeNotification(
        citizenName: string,
        citizenPhone: string,
        entityType: string,
        status: string
    ): Promise<boolean> {
        const outcome = status === 'Approved' ? 'approved' : 'rejected';
        const message = `Dear ${citizenName}, your ${entityType} verification has been ${outcome}. For details, please contact your local police station. - Delhi Police`;

        return await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send visit scheduled notification
     */
    static async sendVisitScheduled(
        citizenPhone: string,
        citizenName: string,
        officerName: string,
        visitDate: Date,
        visitType: string
    ): Promise<void> {
        const dateStr = visitDate.toLocaleDateString();
        const timeStr = visitDate.toLocaleTimeString();
        const message = `Hello ${citizenName}, a ${visitType} visit by Officer ${officerName} has been scheduled for ${dateStr} at ${timeStr}.`;

        await this.sendSMS(citizenPhone, message);
    }

    /**
     * Send visit cancelled notification
     */
    static async sendVisitCancelled(
        citizenPhone: string,
        citizenName: string,
        reason: string
    ): Promise<void> {
        const message = `Hello ${citizenName}, your scheduled visit has been cancelled. Reason: ${reason}. Please contact us if you have questions.`;
        await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send officer task assignment notification
     */
    static async sendOfficerTaskAssignment(
        officerPhone: string,
        citizenName: string,
        taskType: string,
        date: Date
    ): Promise<void> {
        const message = `New Task: You have a ${taskType} visit scheduled for ${citizenName} on ${date.toLocaleDateString()}. Check app for details.`;
        await this.sendSMS(officerPhone, message);
    }

    // --- In-App Notification Methods ---

    static async createInAppNotification(data: {
        userId: string;
        title: string;
        message: string;
        type?: string;
        priority?: string;
        data?: any;
    }) {
        try {
            return await prisma.notification.create({
                data: {
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type || 'system',
                    priority: data.priority || 'normal',
                    data: data.data || {}
                }
            });
        } catch (error) {
            logger.error('Failed to create in-app notification', error);
            return null;
        }
    }

    static async getUserNotifications(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total, unread] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.notification.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, isRead: false } })
        ]);

        return { notifications, total, unread, pages: Math.ceil(total / limit) };
    }

    static async markAsRead(id: string, userId: string) {
        return await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });
    }

    static async markAllAsRead(userId: string) {
        return await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }

    static async deleteNotification(id: string, userId: string) {
        return await prisma.notification.deleteMany({
            where: { id, userId }
        });
    }
}

