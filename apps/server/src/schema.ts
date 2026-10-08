export const typeDefs = `#graphql
  type PaymentMethod {
    id: ID!
    label: String!
    currency: String!
  }

  type Query {
    paymentMethods(currency: String!): [PaymentMethod!]!
  }
`;
