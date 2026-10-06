# payments-checkout: 3-day plan (learning project)

Goal: a small, real, working checkout that touches every item of a typical "React payments micro-frontend" job
description. Honest label: personal learning project.

## Architecture
- `apps/host`: shell app (React Router, header, pages). Loads the remote at runtime.
- `apps/payment-methods`: remote micro-frontend, exposes `PaymentMethods` (and later `PaymentForm`).
- `apps/server`: tiny GraphQL API (Apollo Server) with in-memory data.

## Day 1: Webpack + Module Federation (target: 5-6 h)
- [ ] Monorepo (npm workspaces), TS strict, Prettier, ESLint, shared Babel config.
- [ ] Webpack 5 config per app: babel-loader, SCSS Modules (host), styled-components (remote), HtmlWebpackPlugin,
      contenthash file names, devServer, code splitting by route (React.lazy).
- [ ] Module Federation: remote exposes `./PaymentMethods`; host consumes it; shared singletons; async bootstrap.
- [ ] Resilience: Suspense + error boundary; page still works when the remote is down.
- [ ] Remote runs standalone on :3001 as well.
- [ ] (Stretch, only if time is left) second remote `order-summary` to show several micro-frontends.
Acceptance: `npm run dev` shows /checkout with radio group from the remote; killing the remote shows a fallback
message and the header still works; `npm run build` passes; you can explain what `remoteEntry.js` is.

## Day 2: GraphQL + Apollo + checkout flow (target: 6-7 h)
- [ ] `apps/server`: schema `paymentMethods(currency)`, `createPayment(input)` mutation (validation errors,
      idempotency key), in-memory store.
- [ ] Apollo Client in host: `InMemoryCache` with `typePolicies`, a reactive variable for the cart/selected method.
- [ ] Share `@apollo/client` as a `singleton` in Module Federation: the REMOTE (`PaymentMethods`) runs its own GraphQL
      query through the HOST's Apollo Client / cache (explain what breaks with two client instances).
- [ ] GraphQL Code Generator (typescript + typescript-operations + typescript-react-apollo): typed hooks, `npm run codegen`.
- [ ] Multi-step checkout with React Router: /checkout/details, /checkout/pay, /checkout/done.
- [ ] Forms with validation (react-hook-form + zod), loading + error states for every request.
Acceptance: full happy path works end to end; the mutation returns a typed result; invalid input shows errors;
you can explain cache normalization and what a reactive variable is.

## Day 3: Quality + production mindset (target: 5-6 h)
- [ ] a11y: eslint-plugin-jsx-a11y, jest-axe, keyboard-only walkthrough, visible focus, labels/aria-live.
- [ ] Tests: Jest + React Testing Library (components, form validation); Cypress E2E (happy path + remote down);
      cypress-axe on the checkout page.
- [ ] Error logging / telemetry: small logger, `window.onerror` + error boundary report to `POST /log` on the server.
- [ ] Feature flag with gradual rollout (percentage by stable user hash) for a new payment method.
- [ ] GitLab CI (`.gitlab-ci.yml`): install, lint, typecheck, unit tests, build, e2e; cache node_modules.
- [ ] README: architecture diagram (mermaid), how to run, what you learned, honest "learning project" label.
Acceptance: pipeline green; README is clear; you can answer the interview questions in `docs/INTERVIEW.md`.
