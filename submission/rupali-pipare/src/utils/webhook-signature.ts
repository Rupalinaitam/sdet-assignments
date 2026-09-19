import crypto from 'crypto';

export function verifyWebhookSignature(
    rawBody: Buffer,
    signature: string | undefined,
    secret: string,
): boolean {
    if (!signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer,
    );
}