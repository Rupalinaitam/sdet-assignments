import { Router } from 'express';
import { SubscriptionService } from '../services/subscription-service';

export function createSubscriptionRouter(
    subscriptionService: SubscriptionService,
): Router {
    const router = Router();

    router.post('/', async (req, res) => {
        try {
            const { customerId, planId, amount } = req.body;

            if (!customerId || !planId || typeof amount !== 'number') {
                res.status(400).json({
                    error: 'customerId, planId and numeric amount are required',
                });

                return;
            }

            const subscription =
                await subscriptionService.createSubscription(
                    customerId,
                    planId,
                    amount,
                );

            res.status(201).json(subscription);
        } catch (_error) {
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    });

    router.post('/:id/cancel', (req, res) => {
        try {
            const subscription =
                subscriptionService.cancelSubscription(req.params.id);

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
                error.message.startsWith('Invalid subscription transition')
            ) {
                res.status(409).json({
                    error: error.message,
                });

                return;
            }

            res.status(500).json({
                error: 'Internal server error',
            });
        }
    });

    router.get('/:id', (req, res) => {
        try {
            const subscription = subscriptionService.getSubscription(
                req.params.id,
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

            res.status(500).json({
                error: 'Internal server error',
            });
        }
    });



    return router;
}