import { Router } from 'express';
import { SubscriptionService } from '../services/subscription-service';

export function createWebhookRouter(
    subscriptionService: SubscriptionService,
): Router {
    const router = Router();

    router.post('/payment-provider', async (req, res) => {
        try {
            const {
                eventId,
                eventType,
                subscriptionId,
                paymentId,
                reason,
            } = req.body;

            if (!eventId || !eventType || !subscriptionId) {
                res.status(400).json({
                    error: 'eventId, eventType and subscriptionId are required',
                });

                return;
            }

            const subscription =
                await subscriptionService.handlePaymentWebhook(
                    eventId,
                    eventType,
                    subscriptionId,
                    JSON.stringify(req.body),
                    paymentId,
                    reason,
                );

            res.status(200).json(subscription);
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'Subscription not found'
            ) {
                res.status(404).json({
                    error: 'Subscription not found',
                });

                return;
            }

            if (
                error instanceof Error &&
                error.message === 'Unsupported webhook event type'
            ) {
                res.status(400).json({
                    error: error.message,
                });

                return;
            }

            res.status(500).json({
                error: 'Internal server error',
            });
        }
    });

    return router;
}