import { EventEmitter } from 'events';

/**
 * Application Event Bus
 * Central event emitter for decoupled communication
 */
class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Increase if needed
    }
}

export const eventBus = new EventBus();

/**
 * Event Types
 */
export enum AppEvent {
    // Citizen Events
    CITIZEN_REGISTERED = 'citizen.registered',
    CITIZEN_VERIFIED = 'citizen.verified',
    CITIZEN_UPDATED = 'citizen.updated',
    CITIZEN_DELETED = 'citizen.deleted',

    // Visit Events
    VISIT_SCHEDULED = 'visit.scheduled',
    VISIT_STARTED = 'visit.started',
    VISIT_COMPLETED = 'visit.completed',
    VISIT_CANCELLED = 'visit.cancelled',

    // SOS Events
    SOS_CREATED = 'sos.created',
    SOS_RESPONDED = 'sos.responded',
    SOS_RESOLVED = 'sos.resolved',

    // Officer Events
    OFFICER_ASSIGNED = 'officer.assigned',
    OFFICER_LEAVE_APPROVED = 'officer.leave.approved',

    // System Events
    NOTIFICATION_SEND = 'notification.send'
}

/**
 * Event payload types
 */
export interface CitizenRegisteredPayload {
    citizenId: string;
    fullName: string;
    mobileNumber: string;
    beatId?: string;
}

export interface VisitScheduledPayload {
    visitId: string;
    citizenId: string;
    officerId: string;
    scheduledDate: Date;
    visitType: string;
}

export interface SOSCreatedPayload {
    alertId: string;
    citizenId: string;
    latitude: number;
    longitude: number;
    address?: string;
}

export interface NotificationPayload {
    to: string;
    message: string;
    type: 'SMS' | 'EMAIL' | 'PUSH';
    metadata?: Record<string, any>;
}
