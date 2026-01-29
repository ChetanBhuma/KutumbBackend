export declare enum WebhookEvent {
    CITIZEN_CREATED = "citizen.created",
    CITIZEN_UPDATED = "citizen.updated",
    CITIZEN_VERIFIED = "citizen.verified",
    VISIT_SCHEDULED = "visit.scheduled",
    VISIT_COMPLETED = "visit.completed",
    SOS_CREATED = "sos.created",
    SOS_RESOLVED = "sos.resolved"
}
interface WebhookSubscription {
    id: string;
    url: string;
    events: WebhookEvent[];
    secret: string;
    active: boolean;
    createdAt: Date;
}
declare class WebhookService {
    private subscriptions;
    registerWebhook(url: string, events: WebhookEvent[], secret?: string): string;
    triggerWebhook(event: WebhookEvent, data: any): Promise<void>;
    private sendWebhook;
    private generateSignature;
    verifySignature(payload: any, signature: string, secret: string): boolean;
    private generateSecret;
    getWebhook(webhookId: string): WebhookSubscription | undefined;
    deleteWebhook(webhookId: string): boolean;
    listWebhooks(): WebhookSubscription[];
}
export declare const webhookService: WebhookService;
export default webhookService;
//# sourceMappingURL=webhookService.d.ts.map