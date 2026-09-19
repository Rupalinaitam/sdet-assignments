export type SubscriptionStatus =
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled';

export interface Subscription {
    id: string;
    customerId: string;
    planId: string;
    status: SubscriptionStatus;
    createdAt: string;
    updatedAt: string;
}