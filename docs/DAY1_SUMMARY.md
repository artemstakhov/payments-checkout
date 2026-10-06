# Day 1 summary — interview quiz + review priorities

End-of-day quiz from [LEARNING_LOG.md](LEARNING_LOG.md)'s step-by-step work. Keeping the actual Q&A here so it's
easy to re-quiz myself later without scrolling back through the whole session transcript.

## Questions asked, my answers, and the correction

1. **npm workspaces — what problem do they solve?**
   My answer: thought it was about "nested repos," declaring folders with their own `package.json`.
   Correction: it's **one repo**, not nested repos. The real problem solved is one shared `node_modules` + one
   lockfile instead of three separately-drifting installs, and critically: a way to guarantee all three apps
   agree on the same dependency versions (directly relevant to Module Federation's singleton requirement).

2. **Webpack/Babel — division of labor, why TS/JSX needs compiling.**
   My answer: correct — browsers only understand JS/HTML, so TS/JSX has to be compiled first; Webpack runs
   `babel-loader` to do that compilation per file as part of bundling.

3. **SCSS Modules vs styled-components — a real trade-off beyond build-time/runtime.**
   My answer: restated the build-time/runtime mechanism rather than naming an actual trade-off.
   Correction: a concrete trade-off is **performance vs. flexibility** — SCSS Modules compile to plain CSS the
   browser can apply before any JS runs; styled-components ships its own runtime and executes JS to generate
   styles (more bytes, a little render-blocking cost) — in exchange for trivial _dynamic_ styling driven by props,
   which SCSS Modules can't do without manually toggling between pre-defined classes.

4. **Module Federation — full step-by-step flow from `/checkout` to rendered payment methods.**
   My answer: got the gist (manifest → load function → "usually by bootstrap") but didn't understand _why_
   `index.ts`/`bootstrap.tsx` are split, or the full request sequence.
   Correction: `index.ts` does only `import('./bootstrap')` — a dynamic import — specifically so Module
   Federation's runtime gets an async window to negotiate shared dependency versions _before_ any real app code
   (with its synchronous imports of `react`, `react-dom`, etc.) runs. Skipping this causes Module Federation's
   best-known error: `"Shared module is not available for eager consumption."` Full 9-step trace is in
   [LEARNING_LOG.md](LEARNING_LOG.md)'s Step 6 entry.

5. **Resilience — why both `<Suspense>` AND an error boundary.**
   My answer: correct — one handles loading, one handles error, without both you get a "black box" on that
   branch.
   Addition for precision: without `<Suspense>`, `React.lazy` throws a hard error even on the _happy_ path —
   Suspense isn't optional polish, React requires it structurally. Without the error boundary, a rejected import
   crashes the _entire_ tree (header included), because Suspense only catches the pending state, not failures.

## What to review again, and more often

Ranked by how shaky my answer was:

1. **Module Federation's async boundary (`index.ts` → `bootstrap.tsx`)** — this was the weakest spot by far. I
   should be able to explain, unprompted, _why_ a dynamic `import()` is required here and what error you get if
   you skip it, not just that "it's the pattern."
2. **npm workspaces' actual value proposition** — I know the syntax but not the "why" well enough to say it
   cleanly in an interview. Practice stating it in one sentence without saying "nested repos."
3. **Naming concrete trade-offs between two technical approaches** (not just mechanism differences) — this is a
   general interview-answering skill, not just a Module Federation thing. When asked "trade-off between X and Y,"
   answer with a consequence (performance, DX, bundle size, flexibility), not a restatement of how each works.
4. Already solid, keep as-is: Babel/Webpack's division of labor, the three-state (loading/success/error) mental
   model for async UI.

## Day 1 acceptance check (from PROJECT_SPEC.md)

- `npm run dev` shows `/checkout` with content from the remote — ✅ verified live in browser
- Killing the remote shows a fallback message, header still works — ✅ verified live in browser (killed the
  payment-methods dev server, confirmed via screenshot)
- `npm run build` passes — ✅ both apps build cleanly
- Can explain what `remoteEntry.js` is — getting there; see Module Federation review item above
