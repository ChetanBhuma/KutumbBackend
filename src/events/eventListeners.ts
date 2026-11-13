import { eventBus, AppEvent, CitizenRegisteredPayload, VisitScheduledPayload, SOSCreatedPayload } from './eventBus';
import { NotificationService } from '../services/notificationService';
import { auditLogger } from '../config/logger';
import { websocketService } from '../services/websocketService';

/**
 * Register all event listeners
 */
export const registerEventListeners = () => {
    // Citizen registered -> Send welcome notification, notify officers
    eventBus.on(AppEvent.CITIZEN_REGISTERED, async (payload: CitizenRegisteredPayload) => {
        try {
            auditLogger.info('Event: Citizen registered', payload);

            // Notify officer mobile apps in real-time
            websocketService.notifyOfficersSync('CITIZEN_REGISTERED', {
                citizenId: payload.citizenId,
                beatId: payload.beatId
            });

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

            // Notify officer mobile apps in real-time
            websocketService.notifyOfficersSync('VISIT_SCHEDULED', {
                visitId: payload.visitId,
                officerId: payload.officerId,
                citizenId: payload.citizenId
            });
        } catch (error) {
            auditLogger.error('Error handling VISIT_SCHEDULED event', { error, payload });
        }
    });

    // SOS created -> Notify officer, emergency contacts, control room
    eventBus.on(AppEvent.SOS_CREATED, async (payload: SOSCreatedPayload) => {
        try {
            auditLogger.error('Event: SOS ALERT CREATED', payload);

            // Real-time broadcast to officer app
            websocketService.notifyOfficersSync('SOS_ALERT', {
                sosId: payload.sosId,
                citizenId: payload.citizenId
            });
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

            // Notify officers of reassigned visits
            websocketService.notifyOfficersSync('VISITS_REASSIGNED', {
                officerId: payload.officerId
            });

            auditLogger.info('Leave reassignment completed', result);
        } catch (error) {
            auditLogger.error('Error handling OFFICER_LEAVE_APPROVED event', { error, payload });
        }
    });

    auditLogger.info('Event listeners registered');
};

