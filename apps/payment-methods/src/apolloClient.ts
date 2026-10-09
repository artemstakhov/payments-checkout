import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// Used only by App.tsx, the standalone dev harness (npm run dev at :3001 alone).
// When this component is embedded in host via Module Federation, host's own
// ApolloProvider further up the tree is used instead — @apollo/client is shared
// as a singleton, so there's exactly one real client either way, never two.
export const standaloneApolloClient = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/' }),
  cache: new InMemoryCache(),
});
