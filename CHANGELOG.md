# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Worked example no longer shifts on load.** The sample hand-entered 50,000 for the AI API line, but its linked token plan computed about 14,191 a year, and the app replaces a linked line with the computed figure. The screen therefore showed Years 2-5 net of about +825,809 instead of the +790,000 the README and tests state. The sample plan now runs 6,342 requests a day, which computes 50,000, and a test fails if the plan and the line drift apart.
- **README bundle size.** It said 93 kB gzipped; the measured figure is about 116 kB.
- **CSV formula injection.** Text typed into the app (title, sponsor, justifications and so on)
  that began with `=`, `+`, `-` or `@` ran as a formula when the exported CSV was opened in Excel
  or Sheets. Such cells are now prefixed with an apostrophe and stay text. Real numbers, including
  negatives, are untouched. `buildCsv` is now a pure function so this is tested.
- **Payback on an empty case.** A case with no benefit reported "break-even Year 1" because the
  running total was `0 >= 0`. Payback now needs some benefit to have arrived.
- **IRR says why it is undefined.** No cost or benefit year, or a rate beyond -99.99% to 1,000%,
  now gives a reason instead of a bare "not defined". When the cash flows change sign more than
  once (so more than one IRR can exist) the rate is shown with a caution. `Results` gains
  `irrNote`; `irrDetail()` returns the rate and the note, and `irr()` is unchanged.
- **Discount rate is clamped to 0-100 in the calculation and on load.** A value from an imported
  file (a string, or one at or below -100) could previously give an `Infinity` or `NaN` NPV.

### Added

- **Sensitivity.** Results gains "What would change the answer": benefits, then costs and
  mitigation, each moved by -20%, -10%, +10% and +20% with everything else held, showing the
  five-year net, NPV and break-even year. A sentence beside it says how far benefits can fall
  before the five-year net reaches zero (18.0% for the worked example). The tables and the sentence
  are in the printed report, the CSV and the Markdown export. Every figure comes from
  `computeResults` on a scaled copy of the case, so the core arithmetic is untouched.
- **Markdown export says when it was generated**, as the CSV already did.

- **`npm run size`.** Sums the gzipped JS and CSS in `dist/assets` the way CI does and prints the
  headroom against the 120 kB budget (115,587 bytes at this commit). Run it after `npm run build`.

- **NPV timing toggle.** Year 1 = today (the default, as in the source workbook) or Year-end,
  which discounts every year one more period and matches Excel's `NPV()`. Set it on the Brief step
  or flip it on Results and watch the NPV move. IRR, payback, ROI and the totals are unaffected,
  and every figure the workbook regression guards is unchanged under the default. Files saved
  before the setting existed open as "Year 1 = today", so a case someone has already presented does
  not change.
- **Assumptions in force.** One list (horizon, spreading, discount rate, NPV timing, how IRR, ROI
  and payback are defined, currency) shown on Results and included in the printed report, the CSV
  and the Markdown export. It comes from a single `assumptionsList()`, so they cannot disagree.
- 57 tests: CSV guard, payback edge cases, `irrDetail`, discount-rate normalisation, `hydrate` on
  untrusted values, the timing toggle (including a check against Excel's `NPV()` formula) and the
  assumptions list. Each fix was checked by removing it and confirming its tests fail.

### Changed

- Removed em dashes from prose, comments and docs (no behavior change).
- `.gitattributes` now enforces LF line endings.
- Stopped tracking `.claude/` and the design handoff folder. Both stay local.
- The static NPV-timing note added with the five fixes is replaced by the toggle and the
  assumptions list.
- Author and copyright holder are now Lawrence Jefferson II in `LICENSE`,
  `NOTICE`, `README.md` and `package.json`. The license terms are unchanged.
- New visual system: Holographic / Iridescent. Dark is a near-black ground with
  a cyan brand and a cyan-pink-lime foil on chrome only (card hairlines, the
  mark, the primary button). Light reads the same foil on pearl grounds. Space
  Grotesk type stack, 10/18/28px radius scale. Figures keep their own hues:
  lime benefit, coral cost, amber risk. The foil drift respects
  `prefers-reduced-motion` and print output stays plain.
- Space Grotesk is now self-hosted via `@fontsource-variable/space-grotesk`
  (OFL-1.1). One variable woff2 per script, served from the app's own origin;
  no font CDN. Credited in `NOTICE`.
- The contrast suite now also checks `--on-brand` against every stop of the
  foil gradient, in both themes.
- `NOTICE` now states the basis on which the source material is used, rather
  than holding a placeholder for permission that was never a precondition. The
  attribution is unchanged and a standing, unconditional offer to change,
  expand or remove it is recorded alongside.
- Code of Conduct reports route through GitHub's private reporting rather than
  a published email address.
- GitHub Pages deploys on push to `main` again, and the live demo link is back
  in the README and `package.json`. Both were briefly removed while the
  repository was private, since Pages is not available on private repositories
  under GitHub Free.

## [1.0.0] - 2026-08-16

First public release.

### Added

- **The eight-step flow.** Brief, use case, architecture, costs, benefits,
  risks, results and roadmap, in the order an approval conversation actually
  happens.
- **Five-year projection** with payback year and interpolated payback period,
  ROI, NPV at a configurable discount rate, IRR by bisection, and peak funding
  requirement.
- **The spreading rule**, surfaced rather than buried: one-time amounts land
  entirely in Year 1, annual amounts apply to Years 2–5.
- **Token cost calculator** modelling requests, input and output tokens, cache
  hit rate at the 0.1× cached-input multiplier, and an overhead factor for
  retries, evals and non-production traffic. Optionally drives the AI API cost
  line.
- **Architecture decision matrix** across models, optimisations and
  infrastructure, scored on cost, benefit and seven risk dimensions with named
  owners.
- **Delivery roadmap**, six phase gates by seven swimlanes, 122 deliverables,
  with dates and progress tracking.
- **Readiness check** that names what a reviewer will ask about before the case
  leaves the building.
- **Exports**: print/PDF, Markdown, CSV, and a JSON project file that
  round-trips the whole document. Print renders the entire case, not the open
  step.
- **Optional AI review server** (`server/index.mjs`), off by default. Holds
  `ANTHROPIC_API_KEY` in its own process so the browser never sees it.
- Light, dark and system themes, with the choice remembered.
- Regression test suite for the calculation engine, guarding the figures
  verified against the source workbook.
- `LICENSE` (Apache-2.0), `NOTICE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`.

### Changed

- **Palette.** The warm cream ground and teal brand are replaced by a cool grey
  ground and a blue brand. `--brand` and `--benefit` were previously the same
  teal, so interface chrome and positive figures shared a hue; benefit is now a
  deep green and cost a carmine, and the two never collide.
- **`--on-brand` token added.** Five rules hard-coded white on a brand fill,
  which dropped to roughly 1.6:1 against the light blue brand in dark mode.
- **`--ink-3` darkened in light and lightened in dark** so secondary text clears
  WCAG AA 4.5:1 on every ground it can land on. It previously cleared 3.85:1 on
  `--surface` and 3.43:1 on `--paper`.
- **Results step rebuilt for mobile.** Below 760 px the seven-column five-year
  table is replaced by one expandable card per year, showing the year's net,
  running total and every non-zero line, with the break-even year marked in
  place. The full table stays one tap away.
- **Cash chart gained a second geometry** below 600 px rather than being scaled
  down. Axis labels previously rendered at roughly 4.8 px on a phone. Gridlines
  drop from five to two, and the cumulative figure under each bar is signed and
  coloured.
- **Stat values no longer break mid-number.** Secondary figures compact below
  600 px; `$1,230,000` was wrapping to `$1,23` / `0,000`.
- **Industry use cases rewritten** in ProForma's own voice, framed around the
  cost and benefit shape a business case would claim. Unsourced performance
  figures in the source material were removed rather than repeated.

[Unreleased]: https://github.com/MenokoOG/proforma/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/MenokoOG/proforma/releases/tag/v1.0.0
