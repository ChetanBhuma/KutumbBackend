"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationPriority = exports.NotificationType = void 0;
const logger_1 = require("../config/logger");
const config_1 = require("../config");
var NotificationType;
(function (NotificationType) {
    NotificationType["SMS"] = "SMS";
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["IN_APP"] = "IN_APP";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["NORMAL"] = "NORMAL";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
class NotificationService {
    /**
     * Send SMS notification
     */
    static async sendSMS(phone, message) {
        try {
            // TODO: Integrate with SMS gateway (e.g., Twilio, AWS SNS, or Indian SMS provider)
            // For now, we'll simulate the SMS sending
            logger_1.logger.info('SMS sent', {
                phone,
                message: message.substring(0, 50) + '...',
                gateway: config_1.config.sms?.gateway || 'SIMULATED',
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
        }
        catch (error) {
            logger_1.logger.error('SMS sending failed', { phone, error });
            return false;
        }
    }
    /**
     * Send Email notification
     */
    static async sendEmail(to, subject, _body, _html) {
        try {
            logger_1.logger.info('Email sent', {
                to,
                subject,
                service: config_1.config.email?.service || 'SIMULATED',
                timestamp: new Date().toISOString()
            });
            // TODO: Integrate with email service (e.g., SendGrid, AWS SES, Nodemailer)
            // Example with Nodemailer:
            // const transporter = nodemailer.createTransport({...});
            // await transporter.sendMail({ from: config.email.from, to, subject, text: body, html });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Email sending failed', { to, subject, error });
            return false;
        }
    }
    /**
     * Send Push notification (Firebase Cloud Messaging)
     */
    static async sendPushNotification(deviceToken, title, _body, _data) {
        try {
            logger_1.logger.info('Push notification sent', {
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
        }
        catch (error) {
            logger_1.logger.error('Push notification failed', { deviceToken, error });
            return false;
        }
    }
    /**
     * Send notification (multi-channel)
     */
    static async send(payload) {
        switch (payload.type) {
            case NotificationType.SMS:
                return await this.sendSMS(payload.recipient, payload.message);
            case NotificationType.EMAIL:
                return await this.sendEmail(payload.recipient, payload.subject || 'Notification', payload.message);
            case NotificationType.PUSH:
                return await this.sendPushNotification(payload.recipient, payload.subject || 'Notification', payload.message, payload.data);
            case NotificationType.IN_APP:
                // Store in database for in-app display
                logger_1.logger.info('In-app notification queued', {
                    recipient: payload.recipient,
                    message: payload.message
                });
                return true;
            default:
                logger_1.logger.error('Unknown notification type', { type: payload.type });
                return false;
        }
    }
    /**
     * Send SOS alert notifications
     */
    static async sendSOSAlert(citizenName, citizenPhone, address, latitude, longitude, targets) {
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
        logger_1.logger.warn('SOS alert notifications sent', {
            citizenName,
            officerCount: targets.officers?.length || 0,
            contactCount: targets.emergencyContacts?.length || 0
        });
    }
    /**
     * Send visit reminder
     */
    static async sendVisitReminder(citizenPhone, officerName, visitDate) {
        const message = `Reminder: Officer ${officerName} will visit you on ${visitDate.toLocaleDateString()} at ${visitDate.toLocaleTimeString()}. Stay safe!`;
        await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send visit completion notification
     */
    static async sendVisitCompletionNotification(citizenPhone, officerName) {
        const message = `Visit completed by Officer ${officerName}. Thank you for your cooperation. Stay safe!`;
        await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send OTP
     */
    static async sendOTP(phone, otp) {
        const message = `Your OTP for Senior Citizen Portal is: ${otp}. Valid for 10 minutes. Do not share this code.`;
        return await this.sendSMS(phone, message);
    }
    /**
     * Send registration confirmation
     */
    static async sendRegistrationConfirmation(phone, email, name) {
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
    static async sendVerificationRequestNotification(citizenName, citizenPhone, entityType) {
        const message = `Dear ${citizenName}, a verification request has been submitted for your ${entityType}. You will be notified once the verification is complete. - Delhi Police`;
        return await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send verification outcome notification
     */
    static async sendVerificationOutcomeNotification(citizenName, citizenPhone, entityType, status) {
        const outcome = status === 'Approved' ? 'approved' : 'rejected';
        const message = `Dear ${citizenName}, your ${entityType} verification has been ${outcome}. For details, please contact your local police station. - Delhi Police`;
        return await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send visit scheduled notification
     */
    static async sendVisitScheduled(citizenPhone, citizenName, officerName, visitDate, visitType) {
        const dateStr = visitDate.toLocaleDateString();
        const timeStr = visitDate.toLocaleTimeString();
        const message = `Hello ${citizenName}, a ${visitType} visit by Officer ${officerName} has been scheduled for ${dateStr} at ${timeStr}.`;
        await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send visit cancelled notification
     */
    static async sendVisitCancelled(citizenPhone, citizenName, reason) {
        const message = `Hello ${citizenName}, your scheduled visit has been cancelled. Reason: ${reason}. Please contact us if you have questions.`;
        await this.sendSMS(citizenPhone, message);
    }
    /**
     * Send officer task assignment notification
     */
    static async sendOfficerTaskAssignment(officerPhone, citizenName, taskType, date) {
        const message = `New Task: You have a ${taskType} visit scheduled for ${citizenName} on ${date.toLocaleDateString()}. Check app for details.`;
        await this.sendSMS(officerPhone, message);
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map