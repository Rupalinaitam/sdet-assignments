import 'dotenv/config';
import express from 'express';
import { initializeDatabase } from './db/schema';
import { SubscriptionRepository } from './repositories/subscription-repository';
import { MockPaymentProvider } from './services/mock-payment-provider';
import { SubscriptionService } from './services/subscription-service';
import { createSubscriptionRouter } from './routes/subscription-routes';
import { createWebhookRouter } from './routes/webhook-routes';

const app = express();

initializeDatabase();

app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

const repository = new SubscriptionRepository();
const paymentProvider = new MockPaymentProvider();

const subscriptionService = new SubscriptionService(
    repository,
    paymentProvider,
);

app.use('/subscriptions', createSubscriptionRouter(subscriptionService));

app.use('/webhooks', createWebhookRouter(subscriptionService));

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Subscription & Billing Service is running',
    });
});

export default app;