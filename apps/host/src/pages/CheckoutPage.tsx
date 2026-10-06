import { lazy, Suspense } from 'react';

const PaymentMethods = lazy(() =>
  import('paymentMethods/PaymentMethods').then((module) => ({ default: module.PaymentMethods })),
);

export function CheckoutPage(): JSX.Element {
  return (
    <section>
      <Suspense fallback={<p>Loading payment methods…</p>}>
        <PaymentMethods />
      </Suspense>
    </section>
  );
}
