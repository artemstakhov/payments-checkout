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
