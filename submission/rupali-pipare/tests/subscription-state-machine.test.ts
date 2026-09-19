import { SubscriptionStateMachine } from '../src/services/subscription-state-machine';

describe('SubscriptionStateMachine', () => {
    it('should allow valid transitions', () => {
        expect(
            SubscriptionStateMachine.canTransition('trialing', 'active'),
        ).toBe(true);

        expect(
            SubscriptionStateMachine.canTransition('active', 'canceled'),
        ).toBe(true);

        expect(
            SubscriptionStateMachine.canTransition('past_due', 'active'),
        ).toBe(true);
    });

    it('should reject invalid transitions', () => {
        expect(
            SubscriptionStateMachine.canTransition('canceled', 'active'),
        ).toBe(false);

        expect(
            SubscriptionStateMachine.canTransition('active', 'trialing'),
        ).toBe(false);
    });

    it('should throw an error for invalid transitions', () => {
        expect(() =>
            SubscriptionStateMachine.transition('canceled', 'active'),
        ).toThrow(
            'Invalid subscription transition: canceled -> active',
        );
    });
});