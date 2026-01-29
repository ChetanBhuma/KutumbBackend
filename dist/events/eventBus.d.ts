import { EventEmitter } from 'events';
/**
 * Application Event Bus
 * Central event emitter for decoupled communication
 */
declare class EventBus extends EventEmitter {
    constructor();
}
export declare const eventBus: EventBus;
/**
 * Event Types
 */
export declare enum AppEvent {
    CITIZEN_REGISTERED = "citizen.registered",
    CITIZEN_VERIFIED = "citizen.verified",
    CITIZEN_UPDATED = "citizen.updated",
    CITIZEN_DELETED = "citizen.deleted",
    VISIT_SCHEDULED = "visit.scheduled",
    VISIT_STARTED = "visit.started",
    VISIT_COMPLETED = "visit.completed",
    VISIT_CANCELLED = "visit.cancelled",
    SOS_CREATED = "sos.created",
    SOS_RESPONDED = "sos.responded",
    SOS_RESOLVED = "sos.resolved",
    OFFICER_ASSIGNED = "officer.assigned",
    OFFICER_LEAVE_APPROVED = "officer.leave.approved",
    NOTIFICATION_SEND = "notification.send"
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
export {};
//# sourceMappingURL=eventBus.d.ts.map