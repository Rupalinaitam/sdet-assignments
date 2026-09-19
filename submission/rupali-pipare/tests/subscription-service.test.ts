import db from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { SubscriptionRepository } from '../src/repositories/subscription-repository';
import { SubscriptionService } from '../src/services/subscription-service';
import { MockPaymentProvider } from '../src/services/mock-payment-provider';

describe('SubscriptionService', () => {
    let repository: SubscriptionRepository;

    beforeAll(() => {
        initializeDatabase();
    });

    beforeEach(() => {
        db.exec(`
            DELETE FROM audit_logs;
            DELETE FROM invoices;
            DELETE FROM webhook_events;
            DELETE FROM subscriptions;
        `);

        repository = new SubscriptionRepository();
    });

    it('should create an active subscription after successful payment', async () => {
        const paymentProvider = new MockPaymentProvider({
            status: 'success',
            paymentId: 'payment-success',
        });

        const service = new SubscriptionService(
            repository,
            paymentProvider,
        );

        const subscription = await service.createSubscription(
            'customer-001',
            'basic',
            999,
        );

        expect(subscription.status).toBe('active');
        expect(paymentProvider.callCount).toBe(1);
        expect(paymentProvider.calls[0]).toEqual({
            customerId: 'customer-001',
            amount: 999,
        });

        const savedSubscription = repository.findById(subscription.id);

        expect(savedSubscription).toEqual(subscription);
    });

    it('should create a past_due subscription after declined payment', async () => {
        const paymentProvider = new MockPaymentProvider({
            status: 'declined',
            reason: 'Insufficient funds',
        });

        const service = new SubscriptionService(
            repository,
            paymentProvider,
        );

        const subscription = await service.createSubscription(
            'customer-002',
            'premium',
            1499,
        );

        expect(subscription.status).toBe('past_due');
        expect(paymentProvider.callCount).toBe(1);
    });

    it('should create an invoice when a subscription is created', async () => {
        const paymentProvider = new MockPaymentProvider({
            status: 'success',
            paymentId: 'payment-invoice-001',
        });

        const service = new SubscriptionService(
            repository,
            paymentProvider,
        );

        const subscription = await service.createSubscription(
            'customer-invoice-001',
            'basic',
            999,
        );

        const invoice = db
            .prepare(`
                SELECT
                    subscription_id AS subscriptionId,
                    amount,
                    status
                FROM invoices
                WHERE subscription_id = ?
            `)
            .get(subscription.id) as {
                subscriptionId: string;
                amount: number;
                status: string;
            };

        expect(invoice).toEqual({
            subscriptionId: subscription.id,
            amount: 999,
            status: 'paid',
        });
    });

    it('should create a past_due subscription after payment timeout', async () => {
        const paymentProvider = new MockPaymentProvider({
            status: 'timeout',
            reason: 'Payment provider timed out',
        });

        const service = new SubscriptionService(
            repository,
            paymentProvider,
        );

        const subscription = await service.createSubscription(
            'customer-003',
            'premium',
            1499,
        );

        expect(subscription.status).toBe('past_due');
        expect(paymentProvider.callCount).toBe(1);
    });
});