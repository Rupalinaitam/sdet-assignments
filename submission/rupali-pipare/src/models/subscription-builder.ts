import {
    Subscription,
    SubscriptionStatus,
} from './subscription';

export class SubscriptionBuilder {
    private subscription: Partial<Subscription> = {};

    withId(id: string): this {
        this.subscription.id = id;
        return this;
    }

    withCustomerId(customerId: string): this {
        this.subscription.customerId = customerId;
        return this;
    }

    withPlanId(planId: string): this {
        this.subscription.planId = planId;
        return this;
    }

    withStatus(status: SubscriptionStatus): this {
        this.subscription.status = status;
        return this;
    }

    withCreatedAt(createdAt: string): this {
        this.subscription.createdAt = createdAt;
        return this;
    }

    withUpdatedAt(updatedAt: string): this {
        this.subscription.updatedAt = updatedAt;
        return this;
    }

    build(): Subscription {
        if (
            !this.subscription.id ||
            !this.subscription.customerId ||
            !this.subscription.planId ||
            !this.subscription.status ||
            !this.subscription.createdAt ||
            !this.subscription.updatedAt
        ) {
            throw new Error(
                'All subscription fields are required',
            );
        }

        return this.subscription as Subscription;
    }
}