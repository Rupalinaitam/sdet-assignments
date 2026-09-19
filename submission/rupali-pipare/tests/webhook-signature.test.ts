import crypto from 'crypto';
import { verifyWebhookSignature } from '../src/utils/webhook-signature';

describe('Webhook signature verification', () => {
    const secret = 'test-webhook-secret';
    const rawBody = Buffer.from(
        JSON.stringify({
            eventId: 'event-001',
            eventType: 'payment_succeeded',
        }),
    );

    it('should accept a valid signature', () => {
        const signature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        expect(
            verifyWebhookSignature(rawBody, signature, secret),
        ).toBe(true);
    });

    it('should reject an invalid signature', () => {
        expect(
            verifyWebhookSignature(
                rawBody,
                'invalid-signature',
                secret,
            ),
        ).toBe(false);
    });

    it('should reject a missing signature', () => {
        expect(
            verifyWebhookSignature(
                rawBody,
                undefined,
                secret,
            ),
        ).toBe(false);
    });
});