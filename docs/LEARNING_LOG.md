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
