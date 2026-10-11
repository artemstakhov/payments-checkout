import { gql } from '@apollo/client';

// Not imported anywhere at runtime — PaymentMethods.tsx uses the typed
// RemotePaymentMethodsDocument from ./generated/graphql instead. This file exists purely
// as codegen's scanned input: the raw query text codegen reads to know what to generate.
export const REMOTE_PAYMENT_METHODS_QUERY = gql`
  query RemotePaymentMethods($currency: String!) {
    paymentMethods(currency: $currency) {
      id
      label
      currency
    }
  }
`;
