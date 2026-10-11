import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  generates: {
    'apps/host/src/generated/graphql.ts': {
      // host's queries mix real server fields with Apollo @client fields (local-only
      // state, e.g. selectedPaymentMethodId) — client-schema.graphql declares those so
      // schema validation doesn't reject them as unknown fields.
      schema: ['apps/server/schema.graphql', 'apps/host/client-schema.graphql'],
      // The negated pattern matters: without it, this glob also matches the generated
      // output file itself, which breaks on the next run trying to parse its own output.
      documents: ['apps/host/src/**/*.{ts,tsx}', '!apps/host/src/generated/**'],
      // Deliberately no bare 'typescript' plugin here: it emits full schema-wide types
      // (Query, Mutation, every object type) that collide with typescript-operations'
      // own self-contained re-declarations of any Input/Enum types an operation touches.
      // We only ever consume operation-specific composite types in components, never the
      // raw schema types directly, so typescript-operations alone is both sufficient and
      // collision-free.
      plugins: ['typescript-operations', 'typed-document-node'],
    },
    'apps/payment-methods/src/generated/graphql.ts': {
      schema: 'apps/server/schema.graphql',
      documents: [
        'apps/payment-methods/src/**/*.{ts,tsx}',
        '!apps/payment-methods/src/generated/**',
      ],
      plugins: ['typescript-operations', 'typed-document-node'],
    },
  },
};

export default config;
