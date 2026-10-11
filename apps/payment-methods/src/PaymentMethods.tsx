import styled from 'styled-components';
import { useQuery } from '@apollo/client/react';
import { RemotePaymentMethodsDocument } from './generated/graphql';

const Wrapper = styled.div`
  font-family: sans-serif;
  padding: 1rem;
  border: 1px solid #ccc;
`;

export function PaymentMethods(): JSX.Element {
  const { data, loading, error } = useQuery(RemotePaymentMethodsDocument, {
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
