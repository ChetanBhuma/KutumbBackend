"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEvent = exports.eventBus = void 0;
const events_1 = require("events");
/**
 * Application Event Bus
 * Central event emitter for decoupled communication
 */
class EventBus extends events_1.EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Increase if needed
    }
}
exports.eventBus = new EventBus();
/**
 * Event Types
 */
var AppEvent;
(function (AppEvent) {
    // Citizen Events
    AppEvent["CITIZEN_REGISTERED"] = "citizen.registered";
    AppEvent["CITIZEN_VERIFIED"] = "citizen.verified";
    AppEvent["CITIZEN_UPDATED"] = "citizen.updated";
    AppEvent["CITIZEN_DELETED"] = "citizen.deleted";
    // Visit Events
    AppEvent["VISIT_SCHEDULED"] = "visit.scheduled";
    AppEvent["VISIT_STARTED"] = "visit.started";
    AppEvent["VISIT_COMPLETED"] = "visit.completed";
    AppEvent["VISIT_CANCELLED"] = "visit.cancelled";
    // SOS Events
    AppEvent["SOS_CREATED"] = "sos.created";
    AppEvent["SOS_RESPONDED"] = "sos.responded";
    AppEvent["SOS_RESOLVED"] = "sos.resolved";
    // Officer Events
    AppEvent["OFFICER_ASSIGNED"] = "officer.assigned";
    AppEvent["OFFICER_LEAVE_APPROVED"] = "officer.leave.approved";
    // System Events
    AppEvent["NOTIFICATION_SEND"] = "notification.send";
})(AppEvent || (exports.AppEvent = AppEvent = {}));
//# sourceMappingURL=eventBus.js.map