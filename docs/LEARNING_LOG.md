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
