import db from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { SubscriptionRepository } from '../src/repositories/subscription-repository';
import { Subscription } from '../src/models/subscription';

describe('SubscriptionRepository', () => {
    let repository: SubscriptionRepository;

    beforeEach(() => {
        db.exec(`
            DELETE FROM audit_logs;
            DELETE FROM invoices;
            DELETE FROM webhook_events;
            DELETE FROM subscriptions;
        `);

        repository = new SubscriptionRepository();
    });

    beforeAll(() => {
        initializeDatabase();
    });

    it('should create and retrieve a subscription', () => {
        const subscription: Subscription = {
            id: 'sub-001',
            customerId: 'customer-001',
            planId: 'basic',
            status: 'trialing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        repository.create(subscription);

        const savedSubscription = repository.findById('sub-001');

        expect(savedSubscription).toEqual(subscription);
    });

    it('should update subscription status', () => {
        const subscription: Subscription = {
            id: 'sub-002',
            customerId: 'customer-002',
            planId: 'premium',
            status: 'trialing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        repository.create(subscription);

        const updatedAt = new Date().toISOString();

        repository.updateStatus(
            'sub-002',
            'active',
            updatedAt,
        );

        const updatedSubscription = repository.findById('sub-002');

        expect(updatedSubscription?.status).toBe('active');
        expect(updatedSubscription?.updatedAt).toBe(updatedAt);
    });

    it('should save an audit log entry', () => {
        const createdAt = new Date().toISOString();
        const subscription: Subscription = {
            id: 'sub-003',
            customerId: 'customer-003',
            planId: 'basic',
            status: 'active',
            createdAt,
            updatedAt: createdAt,
        };

        repository.create(subscription);

        repository.addAuditLog(
            'sub-003',
            'active',
            'canceled',
            'Subscription canceled',
            createdAt,
        );

        const auditLog = db
            .prepare(`
                SELECT
                    subscription_id AS subscriptionId,
                    previous_status AS previousStatus,
                    new_status AS newStatus,
                    reason,
                    created_at AS createdAt
                FROM audit_logs
                WHERE subscription_id = ?
            `)
            .get('sub-003') as {
                subscriptionId: string;
                previousStatus: string;
                newStatus: string;
                reason: string;
                createdAt: string;
            };

        expect(auditLog).toEqual({
            subscriptionId: 'sub-003',
            previousStatus: 'active',
            newStatus: 'canceled',
            reason: 'Subscription canceled',
            createdAt,
        });
    });

    it('should create an invoice', () => {
        const createdAt = new Date().toISOString();

        const subscription: Subscription = {
            id: 'sub-004',
            customerId: 'customer-004',
            planId: 'basic',
            status: 'active',
            createdAt,
            updatedAt: createdAt,
        };

        repository.create(subscription);

        repository.createInvoice(
            'invoice-001',
            'sub-004',
            999,
            'paid',
            createdAt,
        );

        const invoice = db
            .prepare(`
                SELECT
                    id,
                    subscription_id AS subscriptionId,
                    amount,
                    status,
                    created_at AS createdAt
                FROM invoices
                WHERE id = ?
            `)
            .get('invoice-001') as {
                id: string;
                subscriptionId: string;
                amount: number;
                status: string;
                createdAt: string;
            };

        expect(invoice).toEqual({
            id: 'invoice-001',
            subscriptionId: 'sub-004',
            amount: 999,
            status: 'paid',
            createdAt,
        });
    });
});