import { randomUUID } from 'crypto';
import { SubscriptionStateMachine } from './subscription-state-machine';
import {
    Subscription,
    SubscriptionStatus,
} from '../models/subscription';
import { SubscriptionRepository } from '../repositories/subscription-repository';
import { PaymentProvider } from './payment-provider';

export class SubscriptionService {
    constructor(
        private readonly repository: SubscriptionRepository,
        private readonly paymentProvider: PaymentProvider,
    ) { }

    async createSubscription(
        customerId: string,
        planId: string,
        amount: number,
    ): Promise<Subscription> {
        const now = new Date().toISOString();

        const paymentResult = await this.paymentProvider.charge(
            customerId,
            amount,
        );

        let status: SubscriptionStatus;

        if (paymentResult.status === 'success') {
            status = 'active';
        } else {
            status = 'past_due';
        }

        const subscription: Subscription = {
            id: randomUUID(),
            customerId,
            planId,
            status,
            createdAt: now,
            updatedAt: now,
        };

        this.repository.create(subscription);

        this.repository.createInvoice(
            randomUUID(),
            subscription.id,
            amount,
            paymentResult.status === 'success' ? 'paid' : 'pending',
            now,
        );

        return subscription;
    }
    getSubscription(id: string): Subscription {
        const subscription = this.repository.findById(id);

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        return subscription;
    }

    cancelSubscription(id: string): Subscription {
        const subscription = this.getSubscription(id);

        const nextStatus = SubscriptionStateMachine.transition(
            subscription.status,
            'canceled',
        );

        const updatedAt = new Date().toISOString();

        this.repository.updateStatus(
            id,
            nextStatus,
            updatedAt,
        );

        this.repository.addAuditLog(
            id,
            subscription.status,
            nextStatus,
            'Subscription canceled',
            updatedAt,
        );

        return {
            ...subscription,
            status: nextStatus,
            updatedAt,
        };
    }

    async handlePaymentWebhook(
        eventId: string,
        eventType: string,
        subscriptionId: string,
        payload: string,
        paymentId?: string,
        reason?: string,
    ): Promise<Subscription> {
        if (this.repository.webhookEventExists(eventId)) {
            return this.getSubscription(subscriptionId);
        }

        const subscription = this.getSubscription(subscriptionId);

        let nextStatus: SubscriptionStatus;

        if (eventType === 'payment_succeeded') {
            nextStatus = 'active';
        } else if (
            eventType === 'payment_failed' ||
            eventType === 'payment_timeout'
        ) {
            nextStatus = 'past_due';
        } else {
            throw new Error('Unsupported webhook event type');
        }

        if (subscription.status !== nextStatus) {
            if (
                SubscriptionStateMachine.canTransition(
                    subscription.status,
                    nextStatus,
                )
            ) {
                const updatedAt = new Date().toISOString();

                this.repository.updateStatus(
                    subscriptionId,
                    nextStatus,
                    updatedAt,
                );

                this.repository.addAuditLog(
                    subscriptionId,
                    subscription.status,
                    nextStatus,
                    `Payment webhook: ${eventType}`,
                    updatedAt,
                );
            }
        }

        this.repository.saveWebhookEvent(
            eventId,
            eventType,
            subscriptionId,
            payload,
            new Date().toISOString(),
        );

        return this.getSubscription(subscriptionId);
    }


}