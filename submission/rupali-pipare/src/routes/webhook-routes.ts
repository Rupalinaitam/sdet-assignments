import { Router } from 'express';
import { SubscriptionService } from '../services/subscription-service';
import { verifyWebhookSignature } from '../utils/webhook-signature';

export function createWebhookRouter(
    subscriptionService: SubscriptionService,
): Router {
    const router = Router();

    router.post('/payment-provider', async (req, res) => {
        try {
            const secret = process.env.WEBHOOK_SECRET;

            if (!secret) {
                res.status(500).json({
                    error: 'Webhook secret is not configured',
                });
                return;
            }

            const signature = req.header('x-webhook-signature');

            const rawBody = Buffer.isBuffer(req.body)
                ? req.body
                : Buffer.from(JSON.stringify(req.body));

            const isValidSignature = verifyWebhookSignature(
                rawBody,
                signature,
                secret,
            );

            if (!isValidSignature) {
                res.status(401).json({
                    error: 'Invalid webhook signature',
                });
                return;
            }

            const body = JSON.parse(rawBody.toString('utf-8'));

            const {
                eventId,
                eventType,
                subscriptionId,
                paymentId,
                reason,
            } = body;

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
                    rawBody.toString('utf-8'),
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

            if (error instanceof SyntaxError) {
                res.status(400).json({
                    error: 'Malformed JSON payload',
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