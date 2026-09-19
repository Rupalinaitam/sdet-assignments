import { SubscriptionBuilder } from '../src/models/subscription-builder';

describe('SubscriptionBuilder', () => {
    it('should build a valid subscription', () => {
        const subscription = new SubscriptionBuilder()
            .withId('sub-builder-001')
            .withCustomerId('customer-builder-001')
            .withPlanId('basic')
            .withStatus('trialing')
            .withCreatedAt('2026-01-01T00:00:00.000Z')
            .withUpdatedAt('2026-01-01T00:00:00.000Z')
            .build();

        expect(subscription).toEqual({
            id: 'sub-builder-001',
            customerId: 'customer-builder-001',
            planId: 'basic',
            status: 'trialing',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        });
    });

    it('should reject incomplete subscription data', () => {
        expect(() => {
            new SubscriptionBuilder()
                .withId('sub-builder-002')
                .withCustomerId('customer-builder-002')
                .build();
        }).toThrow('All subscription fields are required');
    });
});