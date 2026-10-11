import { gql } from '@apollo/client';

// Neither export here is imported at runtime — components use the typed documents from
// ./generated/graphql instead. This file exists purely as codegen's scanned input: the raw
// query/mutation text codegen reads to know what to generate.
export const PAYMENT_METHODS_QUERY = gql`
  query PaymentMethodsWithSelection($currency: String!) {
    paymentMethods(currency: $currency) {
      id
      label
      currency
    }
    selectedPaymentMethodId @client
  }
`;

export const CREATE_PAYMENT_MUTATION = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      __typename
      ... on CreatePaymentSuccess {
        payment {
          id
          status
          amount
          currency
        }
      }
      ... on CreatePaymentError {
        errors {
          field
          message
        }
      }
    }
  }
`;
