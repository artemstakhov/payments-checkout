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
