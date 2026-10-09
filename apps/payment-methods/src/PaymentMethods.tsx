import styled from 'styled-components';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const Wrapper = styled.div`
  font-family: sans-serif;
  padding: 1rem;
  border: 1px solid #ccc;
`;

interface PaymentMethod {
  id: string;
  label: string;
  currency: string;
}

interface PaymentMethodsQueryResult {
  paymentMethods: PaymentMethod[];
}

interface PaymentMethodsQueryVariables {
  currency: string;
}

const PAYMENT_METHODS_QUERY = gql`
  query RemotePaymentMethods($currency: String!) {
    paymentMethods(currency: $currency) {
      id
      label
      currency
    }
  }
`;

export function PaymentMethods(): JSX.Element {
  const { data, loading, error } = useQuery<
    PaymentMethodsQueryResult,
    PaymentMethodsQueryVariables
  >(PAYMENT_METHODS_QUERY, {
    variables: { currency: 'USD' },
  });

  if (loading) {
    return <Wrapper>Loading payment methods (remote)…</Wrapper>;
  }

  if (error) {
    return <Wrapper>Could not load payment methods: {error.message}</Wrapper>;
  }

  return (
    <Wrapper>
      <p>Payment methods (remote, via shared Apollo Client)</p>
      <ul>
        {data?.paymentMethods.map((method) => (
          <li key={method.id}>{method.label}</li>
        ))}
      </ul>
    </Wrapper>
  );
}
