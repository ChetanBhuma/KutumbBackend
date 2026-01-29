"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventListeners = void 0;
const eventBus_1 = require("./eventBus");
const notificationService_1 = require("../services/notificationService");
const logger_1 = require("../config/logger");
/**
 * Register all event listeners
 */
const registerEventListeners = () => {
    // Citizen registered -> Send welcome notification, assign officer
    eventBus_1.eventBus.on(eventBus_1.AppEvent.CITIZEN_REGISTERED, async (payload) => {
        try {
            logger_1.auditLogger.info('Event: Citizen registered', payload);
            // Send welcome notification
            await notificationService_1.NotificationService.sendRegistrationConfirmation(payload.mobileNumber, null, payload.fullName).catch(err => logger_1.auditLogger.error('Failed to send welcome notification', err));
            // Auto-assign officer to beat (handled in controller)
        }
        catch (error) {
            logger_1.auditLogger.error('Error handling CITIZEN_REGISTERED event', { error, payload });
        }
    });
    // Visit scheduled -> Notify citizen and officer
    eventBus_1.eventBus.on(eventBus_1.AppEvent.VISIT_SCHEDULED, async (payload) => {
        try {
            logger_1.auditLogger.info('Event: Visit scheduled', payload);
            // Notifications handled in controller for now
            // Could be moved here for decoupling
        }
        catch (error) {
            logger_1.auditLogger.error('Error handling VISIT_SCHEDULED event', { error, payload });
        }
    });
    // SOS created -> Notify officer, emergency contacts, control room
    eventBus_1.eventBus.on(eventBus_1.AppEvent.SOS_CREATED, async (payload) => {
        try {
            logger_1.auditLogger.error('Event: SOS ALERT CREATED', payload);
            // Critical alerts should trigger multiple notifications
            // Implementation in SOSController
        }
        catch (error) {
            logger_1.auditLogger.error('Error handling SOS_CREATED event', { error, payload });
        }
    });
    // Officer leave approved -> Reassign visits
    eventBus_1.eventBus.on(eventBus_1.AppEvent.OFFICER_LEAVE_APPROVED, async (payload) => {
        try {
            logger_1.auditLogger.info('Event: Officer leave approved', payload);
            const { handleLeaveReassignment } = await Promise.resolve().then(() => __importStar(require('../utils/leaveReassignment')));
            const result = await handleLeaveReassignment(payload.officerId, payload.startDate, payload.endDate);
            logger_1.auditLogger.info('Leave reassignment completed', result);
        }
        catch (error) {
            logger_1.auditLogger.error('Error handling OFFICER_LEAVE_APPROVED event', { error, payload });
        }
    });
    logger_1.auditLogger.info('Event listeners registered');
};
exports.registerEventListeners = registerEventListeners;
//# sourceMappingURL=eventListeners.js.map