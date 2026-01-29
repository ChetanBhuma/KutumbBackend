// Webhook system for external integrations
import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../config/logger';

export enum WebhookEvent {
    CITIZEN_CREATED = 'citizen.created',
    CITIZEN_UPDATED = 'citizen.updated',
    CITIZEN_VERIFIED = 'citizen.verified',
    VISIT_SCHEDULED = 'visit.scheduled',
    VISIT_COMPLETED = 'visit.completed',
    SOS_CREATED = 'sos.created',
    SOS_RESOLVED = 'sos.resolved',
}

interface WebhookSubscription {
    id: string;
    url: string;
    events: WebhookEvent[];
    secret: string;
    active: boolean;
    createdAt: Date;
}

interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: any;
    signature?: string;
}

class WebhookService {
    private subscriptions: Map<string, WebhookSubscription> = new Map();

    // Register a webhook subscription
    registerWebhook(url: string, events: WebhookEvent[], secret?: string): string {
        const webhookId = `webhook_${Date.now()}`;
        const subscription: WebhookSubscription = {
            id: webhookId,
            url,
            events,
            secret: secret || this.generateSecret(),
            active: true,
            createdAt: new Date(),
        };

        this.subscriptions.set(webhookId, subscription);
        logger.info('Webhook registered', { webhookId, url, events });

        return webhookId;
    }

    // Trigger webhook for an event
    async triggerWebhook(event: WebhookEvent, data: any): Promise<void> {
        const subscribedWebhooks = Array.from(this.subscriptions.values()).filter(
            (sub) => sub.active && sub.events.includes(event)
        );

        logger.info('Triggering webhooks', { event, count: subscribedWebhooks.length });

        const promises = subscribedWebhooks.map((webhook) =>
            this.sendWebhook(webhook, event, data)
        );

        await Promise.allSettled(promises);
    }

    // Send webhook to endpoint
    private async sendWebhook(
        webhook: WebhookSubscription,
        event: WebhookEvent,
        data: any
    ): Promise<void> {
        try {
            const payload: WebhookPayload = {
                event,
                timestamp: new Date().toISOString(),
                data,
            };

            // Generate signature for verification
            const signature = this.generateSignature(payload, webhook.secret);
            payload.signature = signature;

            const response = await axios.post(webhook.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event,
                },
                timeout: 5000,
            });

            logger.info('Webhook delivered', {
                webhookId: webhook.id,
                event,
                status: response.status,
            });
        } catch (error: any) {
            logger.error('Webhook delivery failed', {
                webhookId: webhook.id,
                event,
                error: error.message,
                url: webhook.url,
            });
        }
    }

    // Generate webhook signature
    private generateSignature(payload: any, secret: string): string {
        const payloadString = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(payloadString)
            .digest('hex');
    }

    // Verify webhook signature
    verifySignature(payload: any, signature: string, secret: string): boolean {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    // Generate secret key
    private generateSecret(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Get webhook by ID
    getWebhook(webhookId: string): WebhookSubscription | undefined {
        return this.subscriptions.get(webhookId);
    }

    // Delete webhook
    deleteWebhook(webhookId: string): boolean {
        return this.subscriptions.delete(webhookId);
    }

    // List all webhooks
    listWebhooks(): WebhookSubscription[] {
        return Array.from(this.subscriptions.values());
    }
}

export const webhookService = new WebhookService();
export default webhookService;
