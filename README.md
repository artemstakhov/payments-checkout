# payments-checkout

A personal learning project — a small, real checkout flow built to practice Webpack 5, Module Federation
micro-frontends, GraphQL + Apollo, a11y, testing, and CI, end to end. Not a commercial product and not client
work; see [PROJECT_SPEC.md](PROJECT_SPEC.md) for the plan and [docs/LEARNING_LOG.md](docs/LEARNING_LOG.md) for
what's actually been built so far and why.

## Running locally

Requires Node 22+ (the project currently runs on Node 24).

```bash
npm install
npm run dev
```

That one command starts all four apps together, in parallel, with labeled output:

| App                    | Port                                           | What it is                                          |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `apps/host`            | [http://localhost:3000](http://localhost:3000) | Shell app — header, routing, loads the remotes      |
| `apps/payment-methods` | [http://localhost:3001](http://localhost:3001) | Remote micro-frontend (also runs standalone)        |
| `apps/order-summary`   | [http://localhost:3002](http://localhost:3002) | Second remote micro-frontend (also runs standalone) |
| `apps/server`          | [http://localhost:4000](http://localhost:4000) | GraphQL API (Apollo Server)                         |

Open [http://localhost:3000/checkout](http://localhost:3000/checkout) to see the host page load both remotes.

To run just one app on its own (useful while working on it in isolation):

```bash
npm run dev -w apps/host
npm run dev -w apps/payment-methods
npm run dev -w apps/order-summary
npm run dev -w apps/server
```

### Trying out the GraphQL server directly

With `apps/server` running, send it a query with `curl` (or open
[http://localhost:4000](http://localhost:4000) in a browser for Apollo's own query explorer):

```bash
curl -s -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{"query":"query { paymentMethods(currency: \"USD\") { id label currency } }"}'
```

Try swapping `"USD"` for `"EUR"`, or a currency with no matches, or removing the `query { ... }` wrapper to see
GraphQL's schema validation reject a malformed request before any resolver code runs.

### Other commands

```bash
npm run typecheck   # TypeScript across every workspace
npm run lint         # ESLint across every workspace
npm run format:check # Prettier check (npm run format to auto-fix)
npm run build -w apps/host   # production build for one app (same for other apps)
```

### Resilience check

Start everything with `npm run dev`, confirm `/checkout` shows both remotes, then stop just one remote (e.g.
`Ctrl+C` the `payment-methods` process, or edit `apps/host/public/remotes.json` to point at a URL that doesn't
exist) and reload `/checkout` — the header and the other remote should keep working; only the affected remote
shows its own fallback message.
