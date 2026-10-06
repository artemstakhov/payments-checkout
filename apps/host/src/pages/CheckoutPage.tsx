import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

const PaymentMethods = lazy(() =>
  import('paymentMethods/PaymentMethods').then((module) => ({ default: module.PaymentMethods })),
);

export function CheckoutPage(): JSX.Element {
  return (
    <section>
      <ErrorBoundary
        fallback={<p>Payment methods are unavailable right now. Please try again later.</p>}
      >
        <Suspense fallback={<p>Loading payment methods…</p>}>
          <PaymentMethods />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
