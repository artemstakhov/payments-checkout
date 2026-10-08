import { gql } from '@apollo/client';

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
