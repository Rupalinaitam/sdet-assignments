import {
    SubscriptionStatus,
} from '../models/subscription';

const validTransitions: Record<
    SubscriptionStatus,
    SubscriptionStatus[]
> = {
    trialing: ['active', 'past_due', 'canceled'],
    active: ['past_due', 'canceled'],
    past_due: ['active', 'canceled'],
    canceled: [],
};

export class SubscriptionStateMachine {
    static canTransition(
        currentStatus: SubscriptionStatus,
        nextStatus: SubscriptionStatus,
    ): boolean {
        return validTransitions[currentStatus].includes(nextStatus);
    }

    static transition(
        currentStatus: SubscriptionStatus,
        nextStatus: SubscriptionStatus,
    ): SubscriptionStatus {
        if (!this.canTransition(currentStatus, nextStatus)) {
            throw new Error(
                `Invalid subscription transition: ${currentStatus} -> ${nextStatus}`,
            );
        }

        return nextStatus;
    }
}
