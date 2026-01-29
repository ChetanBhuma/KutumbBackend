"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookEvent = void 0;
// Webhook system for external integrations
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../config/logger");
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["CITIZEN_CREATED"] = "citizen.created";
    WebhookEvent["CITIZEN_UPDATED"] = "citizen.updated";
    WebhookEvent["CITIZEN_VERIFIED"] = "citizen.verified";
    WebhookEvent["VISIT_SCHEDULED"] = "visit.scheduled";
    WebhookEvent["VISIT_COMPLETED"] = "visit.completed";
    WebhookEvent["SOS_CREATED"] = "sos.created";
    WebhookEvent["SOS_RESOLVED"] = "sos.resolved";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
class WebhookService {
    subscriptions = new Map();
    // Register a webhook subscription
    registerWebhook(url, events, secret) {
        const webhookId = `webhook_${Date.now()}`;
        const subscription = {
            id: webhookId,
            url,
            events,
            secret: secret || this.generateSecret(),
            active: true,
            createdAt: new Date(),
        };
        this.subscriptions.set(webhookId, subscription);
        logger_1.logger.info('Webhook registered', { webhookId, url, events });
        return webhookId;
    }
    // Trigger webhook for an event
    async triggerWebhook(event, data) {
        const subscribedWebhooks = Array.from(this.subscriptions.values()).filter((sub) => sub.active && sub.events.includes(event));
        logger_1.logger.info('Triggering webhooks', { event, count: subscribedWebhooks.length });
        const promises = subscribedWebhooks.map((webhook) => this.sendWebhook(webhook, event, data));
        await Promise.allSettled(promises);
    }
    // Send webhook to endpoint
    async sendWebhook(webhook, event, data) {
        try {
            const payload = {
                event,
                timestamp: new Date().toISOString(),
                data,
            };
            // Generate signature for verification
            const signature = this.generateSignature(payload, webhook.secret);
            payload.signature = signature;
            const response = await axios_1.default.post(webhook.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event,
                },
                timeout: 5000,
            });
            logger_1.logger.info('Webhook delivered', {
                webhookId: webhook.id,
                event,
                status: response.status,
            });
        }
        catch (error) {
            logger_1.logger.error('Webhook delivery failed', {
                webhookId: webhook.id,
                event,
                error: error.message,
                url: webhook.url,
            });
        }
    }
    // Generate webhook signature
    generateSignature(payload, secret) {
        const payloadString = JSON.stringify(payload);
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(payloadString)
            .digest('hex');
    }
    // Verify webhook signature
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    // Generate secret key
    generateSecret() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    // Get webhook by ID
    getWebhook(webhookId) {
        return this.subscriptions.get(webhookId);
    }
    // Delete webhook
    deleteWebhook(webhookId) {
        return this.subscriptions.delete(webhookId);
    }
    // List all webhooks
    listWebhooks() {
        return Array.from(this.subscriptions.values());
    }
}
exports.webhookService = new WebhookService();
exports.default = exports.webhookService;
//# sourceMappingURL=webhookService.js.map