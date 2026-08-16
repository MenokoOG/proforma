# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The GitHub Pages workflow is manual-only (`workflow_dispatch`) until this
  repository is public. Pages is not available on private repositories under
  GitHub Free, so a push-triggered deploy failed on every merge to main.
- Removed the live demo link from the README header and the `homepage` field
  from `package.json` — both pointed at a page that does not exist yet.
  Restored together with the push trigger when the repository goes public.

## [1.0.0] — 2026-08-16

First public release.

### Added

- **The eight-step flow.** Brief, use case, architecture, costs, benefits,
  risks, results and roadmap — in the order an approval conversation actually
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
- **Delivery roadmap** — six phase gates by seven swimlanes, 122 deliverables,
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
