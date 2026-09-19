export type PaymentWebhookEventType =
    | 'payment_succeeded'
    | 'payment_failed'
    | 'payment_timeout';

export interface PaymentWebhookEvent {
    eventId: string;
    eventType: PaymentWebhookEventType;
    subscriptionId: string;
    paymentId?: string;
    reason?: string;
    createdAt: string;
}