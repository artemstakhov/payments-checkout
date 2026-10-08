export const typeDefs = `#graphql
  type PaymentMethod {
    id: ID!
    label: String!
    currency: String!
  }

  type Query {
    paymentMethods(currency: String!): [PaymentMethod!]!
  }

  input CreatePaymentInput {
    paymentMethodId: ID!
    amount: Int!
    currency: String!
    idempotencyKey: String!
  }

  enum PaymentStatus {
    SUCCEEDED
  }

  type Payment {
    id: ID!
    status: PaymentStatus!
    amount: Int!
    currency: String!
    paymentMethodId: ID!
  }

  type FieldError {
    field: String!
    message: String!
  }

  type CreatePaymentSuccess {
    payment: Payment!
  }

  type CreatePaymentError {
    errors: [FieldError!]!
  }

  union CreatePaymentResult = CreatePaymentSuccess | CreatePaymentError

  type Mutation {
    createPayment(input: CreatePaymentInput!): CreatePaymentResult!
  }
`;
