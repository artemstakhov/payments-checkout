import { ApolloClient, HttpLink, InMemoryCache, makeVar } from '@apollo/client';
import { LocalState } from '@apollo/client/local-state';

export const selectedPaymentMethodIdVar = makeVar<string | null>(null);

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/' }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          paymentMethods: {
            keyArgs: ['currency'],
          },
        },
      },
    },
  }),
  localState: new LocalState({
    resolvers: {
      Query: {
        selectedPaymentMethodId: () => selectedPaymentMethodIdVar(),
      },
    },
  }),
});
