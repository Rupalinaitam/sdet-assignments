import { randomUUID } from 'crypto';
import db from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { SubscriptionRepository } from '../src/repositories/subscription-repository';
import { SubscriptionBuilder } from '../src/models/subscription-builder';

describe('SubscriptionRepository persistence', () => {
    const repository = new SubscriptionRepository();

    beforeAll(() => {
        initializeDatabase();
    });

    it('should persist audit logs and invoices', () => {
        const subscription = new SubscriptionBuilder()
            .withId(randomUUID())
            .withCustomerId('customer-persistence-001')
            .withPlanId('basic')
            .withStatus('active')
            .withCreatedAt('2026-01-01T00:00:00.000Z')
            .withUpdatedAt('2026-01-01T00:00:00.000Z')
            .build();

        repository.create(subscription);

        repository.addAuditLog(
            subscription.id,
            null,
            'active',
            'Subscription activated',
            '2026-01-01T00:00:00.000Z',
        );

        repository.createInvoice(
            randomUUID(),
            subscription.id,
            999,
            'paid',
            '2026-01-01T00:00:00.000Z',
        );

        const auditLog = db
            .prepare(
                'SELECT * FROM audit_logs WHERE subscription_id = ?',
            )
            .get(subscription.id);

        const invoice = db
            .prepare(
                'SELECT * FROM invoices WHERE subscription_id = ?',
            )
            .get(subscription.id);

        expect(auditLog).toBeDefined();
        expect(invoice).toBeDefined();
    });
});