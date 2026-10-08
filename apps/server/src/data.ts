export interface PaymentMethod {
  id: string;
  label: string;
  currency: string;
}

export const paymentMethods: PaymentMethod[] = [
  { id: 'card', label: 'Credit or debit card', currency: 'USD' },
  { id: 'paypal', label: 'PayPal', currency: 'USD' },
  { id: 'card-eur', label: 'Credit or debit card', currency: 'EUR' },
  { id: 'sepa', label: 'SEPA bank transfer', currency: 'EUR' },
];

export interface Payment {
  id: string;
  status: 'SUCCEEDED';
  amount: number;
  currency: string;
  paymentMethodId: string;
}

let nextPaymentId = 1;

export function createPaymentRecord(input: {
  paymentMethodId: string;
  amount: number;
  currency: string;
}): Payment {
  const payment: Payment = {
    id: String(nextPaymentId),
    status: 'SUCCEEDED',
    amount: input.amount,
    currency: input.currency,
    paymentMethodId: input.paymentMethodId,
  };
  nextPaymentId += 1;
  return payment;
}
