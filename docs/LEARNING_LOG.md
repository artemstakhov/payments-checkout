# Learning log

## Day 1, Step 1: npm workspaces monorepo, strict TypeScript, Prettier, ESLint, shared Babel config

What we did: created the root `package.json` with an npm `workspaces` field pointing at `apps/*`, added
`apps/host`, `apps/payment-methods`, `apps/server` as separate packages each with their own `package.json` and
`tsconfig.json` (extending a shared `tsconfig.base.json` with `strict: true`), set up ESLint (flat config) with
`typescript-eslint` plus `eslint-config-prettier` so the two tools don't fight over formatting, added Prettier,
and added a root `babel.config.json` that Webpack's `babel-loader` will point to later.

Why: one repo + one `node_modules` is easier to manage than three separate repos, and the three packages genuinely
need to be built/deployed independently later (host, remote, server), which is what workspaces are for. Strict
TypeScript, linting, and formatting are cheap to add on day 1 and expensive to bolt on later once there's real code.

How I'd explain it in an interview: "We used npm workspaces so the host app, the micro-frontend, and the GraphQL
server live in one repository but install and version their dependencies independently. TypeScript strict mode was
on from the start so the compiler catches null/undefined bugs early. ESLint checks code quality, Prettier only
handles formatting, and `eslint-config-prettier` turns off the ESLint rules that would otherwise conflict with
Prettier's formatting choices."

## Day 1, Step 2: Webpack 5 bundles the host app

What we did: wrote `apps/host/webpack.config.js` — entry `src/index.tsx`, `babel-loader` pointed at the shared
root `babel.config.json`, `HtmlWebpackPlugin` to generate `index.html`, output filenames with `[contenthash]`, and
a `devServer` on port 3000. Added a minimal `App.tsx` + `index.tsx` that mounts React with `createRoot`. Verified
both `npm run build` (production bundle) and `npm run dev` (dev server, checked in an actual browser) work.

Why: Webpack is the actual bundler being learned here (not Vite), and `contenthash` + `HtmlWebpackPlugin` is the
standard pattern for cache-busting production deploys — the filename only changes when the file's content does,
so old bundles can be cached forever by the browser/CDN.

How I'd explain it in an interview: "Webpack's `babel-loader` transpiles each TypeScript/JSX file using our shared
Babel config, bundles everything starting from one entry point, and `HtmlWebpackPlugin` injects the right
`<script>` tag automatically so we never hand-edit it. The `[contenthash]` in the output filename changes only
when the file's bytes change, which is what makes long-term browser caching safe."

## Day 1, Step 3: payment-methods remote, standalone, styled-components

What we did: same Webpack setup as the host (babel-loader, HtmlWebpackPlugin, contenthash, devServer), but on
port 3001 and with `Access-Control-Allow-Origin: *` on the dev server — needed later once the host fetches this
app's `remoteEntry.js` across origins for Module Federation. Styling uses `styled-components` instead of SCSS
Modules, plus `babel-plugin-styled-components` added to the shared root `babel.config.json`. Verified build and
dev server both work, checked rendering + actual CSS in a browser.

Why: this app needs to run two ways — standalone on its own port (what we just verified) and later embedded
inside the host via Module Federation. Getting it working standalone first, before adding Module Federation's
complexity, keeps this step small and isolates bugs.

How I'd explain it in an interview: "The remote app bundles with the same Webpack setup as the host, just a
different port, so it can run and be tested completely on its own. It uses styled-components for CSS-in-JS
instead of SCSS Modules, as a deliberate contrast with the host's styling approach — both are real patterns
teams use, so I wanted hands-on experience with each."

## Day 1, Step 4: SCSS Modules for host

What we did: added a Webpack rule for `*.module.scss` — `sass-loader` compiles Sass to CSS, `css-loader` scopes
every class name to the file (with `namedExport: false, exportLocalsConvention: 'as-is'` so `import styles from
'./x.module.scss'` keeps working instead of needing named imports), `style-loader` injects the result into the
page. Added a `scss.d.ts` ambient type so TypeScript knows what `import styles from './x.module.scss'` returns.
Verified in the browser that the generated class name is a hash, not literally `.wrapper` — proving the scoping
is real, not just visual coincidence.

Why: without module scoping, two components anywhere in the app using a `.wrapper` class would silently fight
over the same global CSS rule. The `namedExport: false` setting specifically exists because `css-loader` changed
its default a few major versions ago (a real gotcha Artem will hit again with any recently-bootstrapped project).

How I'd explain it in an interview: "Webpack's css-loader rewrites every class name in a `.module.scss` file into
a unique, scoped identifier, so `styles.wrapper` in my code becomes a hashed class at build time — two files can
both have a `.wrapper` rule and never collide. I had to explicitly disable css-loader's newer default of named
exports to keep using the common `import styles from './x.module.scss'` pattern."

## Day 1, Step 5: React Router shell in host

What we did: added `<BrowserRouter>` with a persistent `<Header>` outside `<Routes>`, one real route (`/checkout`
→ `CheckoutPage`), and a redirect from `/` to `/checkout` via `<Navigate replace />`. Installed
`react-router-dom@^7.18.4` instead of the 6.x line the gotcha notes assumed, because 6.x has an unpatched
open-redirect advisory (CVE-2025-68470) fixed only starting 7.18.0 — worth knowing for a checkout flow
specifically, where redirect handling is security-relevant. The v6-style API (`BrowserRouter`/`Routes`/`Route`)
still works unchanged in v7's "library mode."

Why: the header being outside `<Routes>` is deliberate groundwork for Day 1's resilience requirement — if the
routed content (later: the remote-loaded payment methods) fails, the header must keep rendering. Routing first,
before Module Federation, keeps the two concerns separate and testable independently.

How I'd explain it in an interview: "I used React Router's client-side routing so navigating to `/checkout`
updates the URL via the History API without a full page reload. The header lives outside the `<Routes>` block on
purpose, so it survives even if the routed page itself throws — that matters once the checkout route depends on
a remote micro-frontend that can fail independently."

## Day 1, Step 6: Module Federation — host consumes the remote at runtime

What we did: gave both apps an async bootstrap boundary (`index.ts` does only `import('./bootstrap')`, the real
app code moved to `bootstrap.tsx`) — required because Webpack must fetch and evaluate the federation "container"
before it knows which shared modules are even needed. Remote's `webpack.config.js` got a `ModuleFederationPlugin`
exposing `./PaymentMethods` (split out of `App.tsx` into its own `PaymentMethods.tsx`, so the exposed unit is
separate from the remote's standalone dev harness) and marking `react`/`react-dom`/`styled-components` as
`singleton: true`. Host's config got the matching consumer side: `remotes: { paymentMethods: 'paymentMethods@
http://localhost:3001/remoteEntry.js' }`, plus the same singleton list (adding `react-router-dom`). Host's
`CheckoutPage` loads the remote via `React.lazy(() => import('paymentMethods/PaymentMethods'))` wrapped in
`<Suspense>`, and a `remotes.d.ts` ambient type tells TypeScript what that otherwise-invisible module exports.
Hit one real bug along the way: navigating directly to `/checkout` (not via client-side link) 404'd, because the
dev server had nothing to serve at that literal path — fixed with `devServer.historyApiFallback: true`. Verified
with both dev servers running together: host (port 3000) actually fetched `remoteEntry.js` cross-origin from
port 3001 and rendered the remote's styled-components box inside the host page.

Why: `singleton: true` matters because React's hooks rely on one single module instance holding internal state —
two separate copies of React (one bundled in host, one in the remote) would make the remote's `useState` etc.
operate on a completely different React instance than the one actually managing the DOM, breaking silently or
loudly depending on what's used. The async-boundary rule exists because Module Federation needs a moment, before
any app code runs, to go fetch the manifest and agree on which shared module versions to actually use.

How I'd explain it in an interview: "Module Federation lets the host fetch and render a component from a
completely separately-built and separately-deployed app, at runtime, via a manifest file called `remoteEntry.js`.
Both apps mark `react` and `react-dom` as singleton shared dependencies so there's only ever one copy of React
running, which is required for hooks to work correctly across the module boundary. Because the federation runtime
has to load before any app code can safely run, the entry point of each app is just a dynamic `import()` — that's
the 'async boundary' gotcha."

## Day 1, Step 7: Resilience — error boundary around the remote

What we did: added `ErrorBoundary.tsx`, a class component (`getDerivedStateFromError` + `componentDidCatch` —
there's still no hook equivalent for this), wrapped around `<Suspense>` in `CheckoutPage`. Tested the real
scenario: ran both dev servers, confirmed the page worked, then killed the `payment-methods` server and reloaded
`/checkout`. Found a real gotcha along the way: webpack-dev-server's own error overlay (a dev-only feature) was
covering the page with a red "Uncaught runtime errors" screen even though our React app had already handled the
error correctly underneath it — confirmed via `document.getElementById('root').innerText`, which showed the
header _and_ our fallback message were both there. Scoped `devServer.client.overlay.runtimeErrors` to `false` so
compile errors still interrupt but handled runtime errors don't visually block the page in dev. Re-tested after
that change: header rendered, fallback message rendered, no crash, confirmed by screenshot.

Why: `<Suspense>` only knows how to wait, not how to handle failure — if the lazy import's promise rejects,
`React.lazy` turns that into a thrown render error, which by default unmounts the whole tree unless something
catches it. The error boundary's placement (around just the remote, not the whole app) is what keeps the header
alive when the remote fails — same principle as the header being a sibling of `<Routes>`, one level deeper.

How I'd explain it in an interview: "An error boundary is a class component that catches render-time errors in
its child tree and shows a fallback instead of letting the whole app crash. I wrapped it around just the
lazy-loaded remote component, so if the micro-frontend fails to load — network issue, remote deployment down,
whatever — the header and the rest of the page keep working, and the user sees a clear message instead of a blank
or broken page. I verified this by actually killing the remote's dev server and confirming the fallback rendered,
rather than just trusting the code looked right."

## Day 2, Step 0: Module Federation hardening — dynamic remotes, second remote, per-remote isolation

What we did, four related fixes:

1. **Shared version resolution**: host's webpack config claimed to share `styled-components` as a singleton but
   never declared it in host's own `package.json` — Webpack's auto version-detection had nothing to read. Fixed
   by adding it as a `peerDependency` (not a regular dependency — host coordinates the version but never actually
   imports the package, so `peerDependencies` is the semantically correct place for it).
2. **Dynamic remotes**: removed the hardcoded `remotes: { paymentMethods: '...' }` from host's
   `ModuleFederationPlugin` entirely. Added `public/remotes.json` (a plain URL lookup table) and
   `copy-webpack-plugin` so it ships in the production build too, not just served by the dev server. Wrote
   `remoteLoader.ts` — a manual implementation of Webpack's "dynamic remote" pattern: fetch the manifest, inject
   a `<script>` tag for the remote's `remoteEntry.js`, call `__webpack_init_sharing__`/`container.init()` to join
   the shared-dependency negotiation, then `container.get(module)` to retrieve the actual component. Deleted
   `remotes.d.ts` — it existed specifically to type the old static `import('paymentMethods/...')` syntax, which
   no longer exists in the code. Real trade-off: TypeScript and Webpack can no longer statically verify a remote
   exists at all — it's pure runtime wiring now. Verified host's production build output no longer has any
   `remote paymentMethods/...` reference, unlike Day 1's build.
3. **Second remote**: `apps/order-summary`, identical shape to `payment-methods` (own webpack config, own
   `ModuleFederationPlugin` exposing `./OrderSummary`, standalone on port 3002).
4. **Per-remote error boundaries**: `CheckoutPage` now renders two separate `<ErrorBoundary><Suspense>...` pairs,
   one per remote, each with its own fallback message. Verified by killing only `order-summary`'s dev server and
   confirming (via `document.getElementById('root').innerText`, not screenshots — see below) that
   `payment-methods` kept rendering normally while only order-summary showed its fallback.

A real dead end worth recording: tried to stop webpack-dev-server's error overlay from covering the page during
this failure test (same issue as Day 1 Step 7, different trigger — this time a native `<script>` tag's `onerror`,
not a rejected dynamic `import()`). Set `devServer.client.overlay: false` (the documented way to fully disable
it) and it still showed up — confirmed via `document.body.children` that the overlay is a real
`<iframe id="webpack-dev-server-client-overlay">` injected into the page, not a Claude Browser tool artifact, so
the setting genuinely isn't taking effect for this failure category in this webpack-dev-server version. Didn't
keep digging — not worth the time for a cosmetic dev-only issue when `innerText`/console/network inspection
already prove the app is behaving correctly underneath it. Lesson: when a dev tool's visual signal disagrees with
direct inspection of actual state, trust the direct inspection, and don't assume "red screen" means "broken."

Why: all four fixes point at the same theme — Day 1's Module Federation setup only worked because it ran on one
machine with hardcoded assumptions (one remote, one fixed URL, implicitly-resolved shared versions). None of that
survives contact with "this needs to deploy to three different environments" or "we're adding a second team's
micro-frontend." Hardening it now, with two remotes, is what actually proves the pattern generalizes.

How I'd explain it in an interview: "We moved from build-time-configured remotes to runtime-configured ones — the
host fetches a small JSON manifest on startup and uses Webpack's dynamic container API to load whatever remotes
that manifest lists, instead of baking URLs into the bundle. That's what lets the same build get deployed to
different environments without a rebuild. The trade-off is we lose compile-time verification that a remote
actually exists — Webpack can't check it anymore, it's pure runtime wiring. I also made sure each remote has its
own error boundary, not one shared boundary around both, so one micro-frontend failing doesn't take a working one
down with it — verified that by actually killing one remote's dev server and confirming the other kept working."

## Day 2, Step 1: apps/server — first GraphQL schema and query

What we did: Apollo Server (`@apollo/server`) serving a schema written in SDL — one object type
(`PaymentMethod`), one `Query` field (`paymentMethods(currency: String!): [PaymentMethod!]!`) — backed by a
resolver that filters an in-memory array by the `currency` argument. Split into `schema.ts` (the contract),
`resolvers.ts` (the "how"), `data.ts` (the fake store), kept separate on purpose so each has one job. Verified
with real HTTP requests (`curl` against the running server, not just a passing typecheck): USD returns card +
PayPal, EUR returns card + SEPA, a currency with no matches returns an empty array (not an error — a real `[]` is
a valid, correct answer), and omitting the required `currency` argument entirely fails with a GraphQL validation
error _before_ our resolver code ever runs — proof the schema is an enforced contract, not just documentation.

Real detour along the way, not part of the GraphQL work itself: `@apollo/server@5` (needed for a CSRF-bypass fix)
requires Node ≥22.15; our machine was on Node 20.18. Upgrading Node turned into its own multi-step debugging
session — a winget install that silently failed (registered as "installed" with no actual files), then an MSI
install that landed at the bare `E:\` drive root instead of a proper folder, which had to be relocated to
`E:\node24` and the system `PATH` cleaned up by hand. None of this was GraphQL-specific, but it's a realistic
example of how much of "add a library" work is actually "fight the environment until the library can run."

Why: splitting schema/resolvers/data isn't just tidiness — in a real codebase the schema is what the frontend
team reads to know what's possible to query, resolvers are backend implementation detail that can change without
the contract changing, and swapping `data.ts`'s array for a real database later shouldn't touch the other two
files at all.

How I'd explain it in an interview: "The schema defines what a client is allowed to ask for — field names, types,
nullability — completely separately from how that data gets produced. A resolver is just a plain function that
Apollo calls to fill in one field's value. Required-argument validation happens automatically against the schema,
before any of my own code runs, which I confirmed by sending a request missing the required `currency` argument
and getting a schema-level validation error back, not a crash from my resolver."

## Day 2, Step 1b: createPayment mutation — result unions and idempotency keys

What we did: added a `createPayment(input: CreatePaymentInput!): CreatePaymentResult!` mutation where
`CreatePaymentResult` is a union of `CreatePaymentSuccess | CreatePaymentError`, instead of throwing a generic
error for bad input. Validation (unknown `paymentMethodId`, `currency` that doesn't match the chosen method,
non-positive `amount`) collects _all_ problems into a `FieldError[]` instead of stopping at the first one, so a
client can fix everything in one round trip. Idempotency: a `Map<idempotencyKey, CreatePaymentResult>` remembers
every outcome (success or validation error) and returns the exact same stored result on a repeat key, instead of
reprocessing. Verified all of it with real `curl` requests, not just types: a successful payment, two validation
errors returned together in one response, a currency-mismatch error, a genuinely new payment getting a new id,
and — the one that actually proves idempotency works — replaying the same `idempotencyKey` twice and confirming
the second response had the _identical_ payment `id` as the first, meaning nothing was created twice.

Why: real payment APIs live or die on this exact problem — a client can never fully trust that a timed-out
request didn't actually succeed server-side, so blind retries without idempotency keys are how people get charged
twice. Returning structured validation errors as a typed union (rather than the generic top-level GraphQL
`errors` array) keeps "the user typo'd their input" and "the server crashed" as genuinely different, separately
typed outcomes a client can handle differently — one is worth showing inline on a form, the other isn't.

How I'd explain it in an interview: "createPayment returns a union type so the schema itself documents every
possible outcome — success with a payment, or a structured list of field-level validation errors — instead of
relying on GraphQL's generic error channel for something that's actually an expected, normal response. The
idempotency key is a client-generated id sent with the mutation; the server caches the result by that key, so a
network retry with the same key gets back the identical response instead of creating a second payment. I didn't
just trust that the code did this — I replayed the same key with curl and confirmed the payment id didn't
change."

## Day 2, Step 2: Apollo Client in host — cache, typePolicies, reactive variables

What we did: `apolloClient.ts` sets up an `ApolloClient` pointed at `http://localhost:4000/`, with an
`InMemoryCache` whose `typePolicies` explicitly declares `keyArgs: ['currency']` on the `paymentMethods` field —
documenting on purpose a caching behavior the cache would have done by default anyway, because being explicit
about cache keys survives schema changes better than relying on an implicit default. Added
`selectedPaymentMethodIdVar`, a `makeVar<string | null>(null)` reactive variable, and a real component
(`PaymentMethodsFromServer`) that queries `paymentMethods(currency: "USD")` from the live server via `useQuery`
and reads/writes the reactive variable via `useReactiveVar` as radio buttons get clicked.

Hit a genuine, undocumented-to-me API change: the query includes a `selectedPaymentMethodId @client` field (to
read local-only state alongside server data in one query), and Apollo Client v4 rejected it outright —
`"contains @client fields but local state has not been configured"`. In Apollo Client v3, a cache `typePolicies`
field `read()` function was enough to serve a `@client` field. In v4, that mechanism moved to a separate
`LocalState` class with its own `resolvers` map, passed to `ApolloClient({ localState: new LocalState({...}) })`
— confirmed by reading the actual `.d.ts` source in `node_modules`, not by guessing from memory of an older
version. Fixed by moving the `selectedPaymentMethodId` resolution there instead of the cache.

Verified live, not just typechecked: ran the real server + host together, confirmed the radio group rendered
real data fetched from the GraphQL server (not hardcoded), clicked "Credit or debit card," and confirmed "Selected: none" became "Selected: card" — proof the reactive variable actually drives a re-render, not just that the
code compiles.

Why: `typePolicies` exist so you can be explicit about cache behavior instead of hoping the defaults are right
forever — a schema change later (like `paymentMethods` gaining a second argument) could silently change what the
default cache key includes, breaking caching in a way that's hard to notice. Reactive variables solve the
specific problem of "UI-only state that several components need to read reactively" without inventing a second
state-management system (Redux, Zustand, etc.) alongside Apollo — the cache already has a re-render mechanism,
reactive variables just plug client state into it.

How I'd explain it in an interview: "Apollo Client normalizes server responses into one shared cache, so
multiple components querying overlapping data don't each hold their own stale copy. `typePolicies` let you
override the cache's default behavior per field — I used `keyArgs` to be explicit about which arguments should
produce separate cache entries. Reactive variables are Apollo's mechanism for client-only state — like which
radio button is selected — that still participates in the same re-render system as server data, so you don't
need a separate state library just for UI state. I actually hit a real version-to-version API change getting the
`@client` field working, which was a good reminder to verify library behavior against the installed version's
actual types instead of trusting memory of an older API."
