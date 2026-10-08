import { useQuery } from '@apollo/client/react';
import { useReactiveVar } from '@apollo/client/react';
import { PAYMENT_METHODS_QUERY } from './queries';
import { selectedPaymentMethodIdVar } from './apolloClient';

interface PaymentMethod {
  id: string;
  label: string;
  currency: string;
}

interface PaymentMethodsQueryResult {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: string | null;
}

interface PaymentMethodsQueryVariables {
  currency: string;
}

export function PaymentMethodsFromServer(): JSX.Element {
  const { data, loading, error } = useQuery<
    PaymentMethodsQueryResult,
    PaymentMethodsQueryVariables
  >(PAYMENT_METHODS_QUERY, {
    variables: { currency: 'USD' },
  });
  const selectedId = useReactiveVar(selectedPaymentMethodIdVar);

  if (loading) {
    return <p>Loading payment methods…</p>;
  }

  if (error) {
    return <p>Could not load payment methods: {error.message}</p>;
  }

  return (
    <fieldset>
      <legend>Payment method (via host Apollo Client)</legend>
      {data?.paymentMethods.map((method) => (
        <label key={method.id} style={{ display: 'block' }}>
          <input
            type="radio"
            name="paymentMethod"
            checked={selectedId === method.id}
            onChange={() => selectedPaymentMethodIdVar(method.id)}
          />
          {method.label}
        </label>
      ))}
      <p>Selected: {selectedId ?? 'none'}</p>
    </fieldset>
  );
}
