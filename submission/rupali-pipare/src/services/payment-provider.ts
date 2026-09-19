export type PaymentResult =
    | {
        status: 'success';
        paymentId: string;
    }
    | {
        status: 'declined';
        reason: string;
    }
    | {
        status: 'timeout';
        reason: string;
    };

export interface PaymentProvider {
    charge(
        customerId: string,
        amount: number,
    ): Promise<PaymentResult>;
}