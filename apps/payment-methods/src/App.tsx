import { ApolloProvider } from '@apollo/client/react';
import { standaloneApolloClient } from './apolloClient';
import { PaymentMethods } from './PaymentMethods';

export function App(): JSX.Element {
  return (
    <ApolloProvider client={standaloneApolloClient}>
      <PaymentMethods />
    </ApolloProvider>
  );
}
