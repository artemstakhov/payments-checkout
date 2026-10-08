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
