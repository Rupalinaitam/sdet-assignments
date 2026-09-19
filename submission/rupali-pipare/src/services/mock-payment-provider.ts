import {
    PaymentProvider,
    PaymentResult,
} from './payment-provider';

export class MockPaymentProvider implements PaymentProvider {
    public callCount = 0;

    public calls: Array<{
        customerId: string;
        amount: number;
    }> = [];

    constructor(
        private readonly result: PaymentResult = {
            status: 'success',
            paymentId: 'payment-001',
        },
    ) { }

    async charge(
        customerId: string,
        amount: number,
    ): Promise<PaymentResult> {
        this.callCount += 1;

        this.calls.push({
            customerId,
            amount,
        });

        return this.result;
    }
}