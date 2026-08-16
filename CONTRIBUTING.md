# Contributing to ProForma

Thanks for looking. This file should be enough to get you productive without
asking anyone a question. If it isn't, that's a bug in this file — open an
issue.

## Setup

Node 22 or newer. There is an `.nvmrc`, so `nvm use` will do it.

```bash
git clone https://github.com/MenokoOG/proforma.git
cd proforma
npm ci
npm run dev          # http://localhost:5173
```

Before you open a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs exactly those four, in that order, on Node 22.

## The architecture in a paragraph

ProForma is a Vite + React 19 + TypeScript single-page app with **no runtime
dependencies beyond React** — no UI kit, no chart library, no icon font. State
lives in one reducer (`src/state/store.tsx`) holding a single `Doc` object, which
is debounce-persisted to `localStorage` and rehydrated forward-compatibly by
`src/lib/storage.ts`. Everything the user sees is derived: `src/lib/calc.ts`
takes the `Doc` and returns a `Results` object, and the components render that.
`src/steps/` holds one file per step of the eight-step flow, `src/data/` holds
the source framework content as typed data, and `src/lib/` holds the domain —
types, calculation, formatting, storage, export. There is exactly one
stylesheet, `src/styles/app.css`, and all colour comes from CSS custom
properties defined in the token block at the top of it.

## The rules that are not negotiable

**Do not change the arithmetic without a test and a conversation.**
`src/lib/calc.ts` is verified against the source workbook, and
`src/lib/__tests__/calc.test.ts` guards the known-good figures. If a change
moves any of those numbers, the change is wrong until proven otherwise. Open an
issue before writing the code.

**No new runtime dependencies.** The bundle is under 120 kB gzipped and staying
there is a feature, not an accident. Dev dependencies for tooling are fine.

**All colour goes through a token.** No hex literals in components, and no new
ones in `app.css` outside the token block. Two documented exceptions exist: the
risk severity ramp and the print block.

**Accessibility is not a follow-up.** Every input has a label, every tap target
is at least 44 px, colour never carries meaning alone, and text meets WCAG AA
contrast on every ground it can land on. There is a contrast check in the test
suite; if you add a token, add it there too.

**Mobile first.** Nothing may cause horizontal page scroll at 320 px. The only
sideways scroll allowed is inside `.tablewrap`, and only when the user has
opted into it.

## How to add a line item

Cost, benefit and mitigation lines are defined in `src/lib/defaults.ts` via the
`line(id, label, hint)` helper. Add one to the relevant array and it flows
through automatically: the editor, the year-by-year table, the year cards, the
exports and the print report all iterate the arrays.

Two things to know. The `id` is a persistence key — once shipped, changing it
orphans saved documents, so pick it carefully and never rename it. And the
spreading rule applies to every line without exception: the one-time amount
lands in Year 1, the annual amount applies to Years 2–5. That rule lives in
`spread()` and nothing should special-case around it.

Users can also add their own lines at runtime; those carry `custom: true` and
are preserved across hydration by `mergeLines()`.

## How to add a step

1. Create `src/steps/YourStep.tsx`, exporting a component that takes
   `{ goTo }` if it needs to navigate.
2. Register it in the step list in `src/App.tsx` — the order there drives the
   step rail, the bottom navigation, the progress bar and the `aria-current`
   state, so you do not wire those separately.
3. If the step collects data, extend the `Doc` type in `src/lib/types.ts`, give
   it a default in `createDoc()`, and add a branch to `hydrate()` in
   `src/lib/storage.ts` so documents saved before your change still open.
4. If the step should appear in exports, add it to `src/lib/export.ts` and
   `src/components/PrintReport.tsx`. Print renders the entire case, not the
   current step — that is deliberate.
5. If the step has a readiness condition, add it to `findGaps()` in
   `src/lib/calc.ts`.

Step 3 is the one people forget. A missing `hydrate()` branch does not throw —
it silently drops the user's saved data.

## Commits and pull requests

Conventional Commits:

```
feat(costs): add contingency line
fix(calc): guard payback interpolation when net is zero
docs(readme): quickstart for Windows
test(calc): cover the never-breaks-even case
chore(deps): bump vite to 6.4
```

Types in use: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `style`, `perf`, `ci`.

For pull requests:

- One concern per PR. A palette change and a calculation fix are two PRs.
- Include a `CHANGELOG.md` entry under `## [Unreleased]`, in Keep a Changelog
  format. Every PR gets one.
- Say what you verified, not just what you changed. "Checked at 375 px and
  1180 px in both themes" is worth more than a screenshot.
- If you touched anything under `src/lib/`, the test output goes in the PR
  description.
- Draft PRs are welcome early. Asking a question in a draft is cheaper for both
  of us than guessing.

## Source material

The frameworks in `src/data/` come from Ed Donner's _AI Leadership: Commercial
value with AI_ module. Read `NOTICE` before changing anything in that directory
— some of those files are attributed rather than rewritten on purpose, and
editing them changes what the framework says rather than how ProForma says it.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Taking part
means agreeing to it.
