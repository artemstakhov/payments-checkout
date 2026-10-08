import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './apolloClient';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

createRoot(container).render(
  <ApolloProvider client={apolloClient}>
    <App />
  </ApolloProvider>,
);
