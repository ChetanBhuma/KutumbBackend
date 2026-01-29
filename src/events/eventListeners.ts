import { eventBus, AppEvent, CitizenRegisteredPayload, VisitScheduledPayload, SOSCreatedPayload } from './eventBus';
import { NotificationService } from '../services/notificationService';
import { auditLogger } from '../config/logger';

/**
 * Register all event listeners
 */
export const registerEventListeners = () => {
    // Citizen registered -> Send welcome notification, assign officer
    eventBus.on(AppEvent.CITIZEN_REGISTERED, async (payload: CitizenRegisteredPayload) => {
        try {
            auditLogger.info('Event: Citizen registered', payload);

            // Send welcome notification
            await NotificationService.sendRegistrationConfirmation(
                payload.mobileNumber,
                null,
                payload.fullName
            ).catch(err => auditLogger.error('Failed to send welcome notification', err));

            // Auto-assign officer to beat (handled in controller)
        } catch (error) {
            auditLogger.error('Error handling CITIZEN_REGISTERED event', { error, payload });
        }
    });

    // Visit scheduled -> Notify citizen and officer
    eventBus.on(AppEvent.VISIT_SCHEDULED, async (payload: VisitScheduledPayload) => {
        try {
            auditLogger.info('Event: Visit scheduled', payload);

            // Notifications handled in controller for now
            // Could be moved here for decoupling
        } catch (error) {
            auditLogger.error('Error handling VISIT_SCHEDULED event', { error, payload });
        }
    });

    // SOS created -> Notify officer, emergency contacts, control room
    eventBus.on(AppEvent.SOS_CREATED, async (payload: SOSCreatedPayload) => {
        try {
            auditLogger.error('Event: SOS ALERT CREATED', payload);

            // Critical alerts should trigger multiple notifications
            // Implementation in SOSController
        } catch (error) {
            auditLogger.error('Error handling SOS_CREATED event', { error, payload });
        }
    });

    // Officer leave approved -> Reassign visits
    eventBus.on(AppEvent.OFFICER_LEAVE_APPROVED, async (payload: any) => {
        try {
            auditLogger.info('Event: Officer leave approved', payload);

            const { handleLeaveReassignment } = await import('../utils/leaveReassignment');
            const result = await handleLeaveReassignment(
                payload.officerId,
                payload.startDate,
                payload.endDate
            );

            auditLogger.info('Leave reassignment completed', result);
        } catch (error) {
            auditLogger.error('Error handling OFFICER_LEAVE_APPROVED event', { error, payload });
        }
    });

    auditLogger.info('Event listeners registered');
};
