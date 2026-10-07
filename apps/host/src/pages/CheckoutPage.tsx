import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { loadRemoteModule } from '../remoteLoader';

interface PaymentMethodsModule {
  PaymentMethods: () => JSX.Element;
}

interface OrderSummaryModule {
  OrderSummary: () => JSX.Element;
}

const PaymentMethods = lazy(async () => {
  const remoteModule = await loadRemoteModule<PaymentMethodsModule>(
    'paymentMethods',
    './PaymentMethods',
  );
  return { default: remoteModule.PaymentMethods };
});

const OrderSummary = lazy(async () => {
  const remoteModule = await loadRemoteModule<OrderSummaryModule>('orderSummary', './OrderSummary');
  return { default: remoteModule.OrderSummary };
});

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
      <ErrorBoundary
        fallback={<p>Order summary is unavailable right now. Please try again later.</p>}
      >
        <Suspense fallback={<p>Loading order summary…</p>}>
          <OrderSummary />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
