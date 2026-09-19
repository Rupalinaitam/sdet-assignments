import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app';

const webhookSecret = process.env.WEBHOOK_SECRET || 'test-webhook-secret';

function createSignature(payload: string): string {
    return crypto
        .createHmac('sha256', webhookSecret)
        .update(Buffer.from(payload))
        .digest('hex');
}

describe('Health API', () => {
    it('should return service health status', async () => {
        const response = await request(app)
            .get('/health');

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            status: 'ok',
            message: 'Subscription & Billing Service is running',
        });
    });

    it('should return 404 when subscription is not found', async () => {
        const response = await request(app)
            .get('/subscriptions/unknown-subscription-id');

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
            error: 'Subscription not found',
        });
    });

    it('should create a subscription successfully', async () => {
        const response = await request(app)
            .post('/subscriptions')
            .send({
                customerId: 'customer-001',
                planId: 'basic-monthly',
                amount: 999,
            });

        expect(response.status).toBe(201);

        expect(response.body).toEqual(
            expect.objectContaining({
                customerId: 'customer-001',
                planId: 'basic-monthly',
                status: 'active',
            }),
        );

        expect(response.body.id).toBeDefined();
        expect(response.body.createdAt).toBeDefined();
        expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 when required fields are missing', async () => {
        const response = await request(app)
            .post('/subscriptions')
            .send({
                customerId: 'customer-002',
            });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'customerId, planId and numeric amount are required',
        });
    });

    it('should cancel an active subscription successfully', async () => {
        const createResponse = await request(app)
            .post('/subscriptions')
            .send({
                customerId: 'customer-cancel-001',
                planId: 'basic-monthly',
                amount: 999,
            });

        expect(createResponse.status).toBe(201);

        const subscriptionId = createResponse.body.id;

        const cancelResponse = await request(app)
            .post(`/subscriptions/${subscriptionId}/cancel`);

        expect(cancelResponse.status).toBe(200);

        expect(cancelResponse.body).toEqual(
            expect.objectContaining({
                id: subscriptionId,
                status: 'canceled',
            }),
        );
    });

    it('should reject cancellation of an already canceled subscription', async () => {
        const createResponse = await request(app)
            .post('/subscriptions')
            .send({
                customerId: 'customer-cancel-002',
                planId: 'basic-monthly',
                amount: 999,
            });

        const subscriptionId = createResponse.body.id;

        const firstCancelResponse = await request(app)
            .post(`/subscriptions/${subscriptionId}/cancel`);

        expect(firstCancelResponse.status).toBe(200);

        const secondCancelResponse = await request(app)
            .post(`/subscriptions/${subscriptionId}/cancel`);

        expect(secondCancelResponse.status).toBe(409);

        expect(secondCancelResponse.body.error).toContain(
            'Invalid subscription transition',
        );
    });
});

describe('Payment Webhook API', () => {
    async function createSubscription(): Promise<string> {
        const response = await request(app)
            .post('/subscriptions')
            .send({
                customerId: `webhook-customer-${Date.now()}`,
                planId: 'basic-monthly',
                amount: 999,
            });

        expect(response.status).toBe(201);

        return response.body.id;
    }

    it('should accept a webhook with a valid signature', async () => {
        const subscriptionId = await createSubscription();

        const payload = JSON.stringify({
            eventId: `event-valid-${Date.now()}`,
            eventType: 'payment_succeeded',
            subscriptionId,
            paymentId: 'payment-001',
        });

        const response = await request(app)
            .post('/webhooks/payment-provider')
            .set('Content-Type', 'application/json')
            .set('x-webhook-signature', createSignature(payload))
            .send(payload);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(subscriptionId);
        expect(response.body.status).toBe('active');
    });

    it('should reject a webhook with an invalid signature', async () => {
        const subscriptionId = await createSubscription();

        const payload = JSON.stringify({
            eventId: `event-invalid-${Date.now()}`,
            eventType: 'payment_succeeded',
            subscriptionId,
        });

        const response = await request(app)
            .post('/webhooks/payment-provider')
            .set('Content-Type', 'application/json')
            .set('x-webhook-signature', 'invalid-signature')
            .send(payload);

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            error: 'Invalid webhook signature',
        });
    });

    it('should reject a webhook when the signature is missing', async () => {
        const subscriptionId = await createSubscription();

        const payload = JSON.stringify({
            eventId: `event-missing-${Date.now()}`,
            eventType: 'payment_succeeded',
            subscriptionId,
        });

        const response = await request(app)
            .post('/webhooks/payment-provider')
            .set('Content-Type', 'application/json')
            .send(payload);

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            error: 'Invalid webhook signature',
        });
    });

    it('should reject malformed JSON payloads', async () => {
        const payload = '{"eventId":';

        const response = await request(app)
            .post('/webhooks/payment-provider')
            .set('Content-Type', 'application/json')
            .set('x-webhook-signature', createSignature(payload))
            .send(payload);

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: 'Malformed JSON payload',
        });
    });

    it('should process duplicate webhook events only once', async () => {
        const subscriptionId = await createSubscription();

        const payload = JSON.stringify({
            eventId: `event-duplicate-${Date.now()}`,
            eventType: 'payment_succeeded',
            subscriptionId,
            paymentId: 'payment-duplicate',
        });

        const signature = createSignature(payload);

        const firstResponse = await request(app)
            .post('/webhooks/payment-provider')
            .set('Content-Type', 'application/json')
            .set('x-webhook-signature', signature)
            .send(payload);

        const secondResponse = await request(app)
            .post('/webhooks/payment-provider')
            .set('Content-Type', 'application/json')
            .set('x-webhook-signature', signature)
            .send(payload);

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);

        expect(firstResponse.body.id).toBe(subscriptionId);
        expect(secondResponse.body.id).toBe(subscriptionId);
        expect(secondResponse.body.status).toBe('active');
    });
});