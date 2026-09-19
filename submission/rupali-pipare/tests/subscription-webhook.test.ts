import { SubscriptionRepository } from '../src/repositories/subscription-repository';
import { MockPaymentProvider } from '../src/services/mock-payment-provider';
import { SubscriptionService } from '../src/services/subscription-service';
import { SubscriptionBuilder } from '../src/models/subscription-builder';
import { initializeDatabase } from '../src/db/schema';

describe('Payment webhook handling', () => {

    beforeAll(() => {
        initializeDatabase();
    });

    it('should update a trialing subscription to active', async () => {
        const repository = new SubscriptionRepository();
        const paymentProvider = new MockPaymentProvider();

        const service = new SubscriptionService(
            repository,
            paymentProvider,
        );

        const subscription = new SubscriptionBuilder()
            .withId('sub-webhook-001')
            .withCustomerId('customer-webhook-001')
            .withPlanId('basic')
            .withStatus('trialing')
            .withCreatedAt('2026-01-01T00:00:00.000Z')
            .withUpdatedAt('2026-01-01T00:00:00.000Z')
            .build();

        repository.create(subscription);

        const updatedSubscription =
            await service.handlePaymentWebhook(
                'event-webhook-001',
                'payment_succeeded',
                subscription.id,
                JSON.stringify({
                    eventId: 'event-webhook-001',
                    subscriptionId: subscription.id,
                }),
            );

        expect(updatedSubscription.status).toBe('active');
    });
});