import { MockPaymentProvider } from '../src/services/mock-payment-provider';

describe('MockPaymentProvider', () => {
    it('should return a successful payment result', async () => {
        const provider = new MockPaymentProvider();

        const result = await provider.charge('customer-001', 999);

        expect(result).toEqual({
            status: 'success',
            paymentId: 'payment-001',
        });
    });

    it('should track call count and arguments', async () => {
        const provider = new MockPaymentProvider();

        await provider.charge('customer-001', 999);
        await provider.charge('customer-002', 1499);

        expect(provider.callCount).toBe(2);

        expect(provider.calls).toEqual([
            {
                customerId: 'customer-001',
                amount: 999,
            },
            {
                customerId: 'customer-002',
                amount: 1499,
            },
        ]);
    });

    it('should support a declined payment result', async () => {
        const provider = new MockPaymentProvider({
            status: 'declined',
            reason: 'Insufficient funds',
        });

        const result = await provider.charge('customer-001', 999);

        expect(result).toEqual({
            status: 'declined',
            reason: 'Insufficient funds',
        });
    });
});