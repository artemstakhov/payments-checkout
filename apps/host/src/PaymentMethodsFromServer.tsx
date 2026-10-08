import { useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { CREATE_PAYMENT_MUTATION, PAYMENT_METHODS_QUERY } from './queries';
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

interface Payment {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

interface FieldError {
  field: string;
  message: string;
}

type CreatePaymentResult =
  | { __typename: 'CreatePaymentSuccess'; payment: Payment }
  | { __typename: 'CreatePaymentError'; errors: FieldError[] };

interface CreatePaymentMutationResult {
  createPayment: CreatePaymentResult;
}

interface CreatePaymentMutationVariables {
  input: {
    paymentMethodId: string;
    amount: number;
    currency: string;
    idempotencyKey: string;
  };
}

const DEMO_AMOUNT_CENTS = 1000;

export function PaymentMethodsFromServer(): JSX.Element {
  const { data, loading, error } = useQuery<
    PaymentMethodsQueryResult,
    PaymentMethodsQueryVariables
  >(PAYMENT_METHODS_QUERY, {
    variables: { currency: 'USD' },
  });
  const selectedId = useReactiveVar(selectedPaymentMethodIdVar);
  const [createPayment, { loading: paying }] = useMutation<
    CreatePaymentMutationResult,
    CreatePaymentMutationVariables
  >(CREATE_PAYMENT_MUTATION);
  const [result, setResult] = useState<CreatePaymentResult | null>(null);

  async function handlePay(): Promise<void> {
    if (!selectedId) {
      return;
    }
    const { data: mutationData } = await createPayment({
      variables: {
        input: {
          paymentMethodId: selectedId,
          amount: DEMO_AMOUNT_CENTS,
          currency: 'USD',
          idempotencyKey: crypto.randomUUID(),
        },
      },
    });
    if (mutationData) {
      setResult(mutationData.createPayment);
    }
  }

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
      <button type="button" onClick={() => void handlePay()} disabled={!selectedId || paying}>
        {paying ? 'Paying…' : 'Pay $10.00'}
      </button>
      {result?.__typename === 'CreatePaymentSuccess' && (
        <p>
          Payment {result.payment.id} succeeded: {result.payment.amount} {result.payment.currency}
        </p>
      )}
      {result?.__typename === 'CreatePaymentError' && (
        <ul>
          {result.errors.map((fieldError) => (
            <li key={fieldError.field}>
              {fieldError.field}: {fieldError.message}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
