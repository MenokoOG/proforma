<h1 align="center">ProForma</h1>

<p align="center">
  <strong>Build the AI business case.</strong><br>
  Turn a Gen AI idea into a five-year cost, benefit and risk projection —
  with the payback year, peak funding need and NPV a sponsor will actually ask for.
</p>

<p align="center">
  <a href="https://menokoog.github.io/proforma/"><strong>Live demo</strong></a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <a href="https://github.com/MenokoOG/proforma/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/MenokoOG/proforma/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="License Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue">
  <img alt="Node 22+" src="https://img.shields.io/badge/node-%3E%3D22-brightgreen">
  <img alt="Bundle under 120 kB gzipped" src="https://img.shields.io/badge/bundle-%3C120%20kB%20gzipped-brightgreen">
  <img alt="Zero runtime dependencies beyond React" src="https://img.shields.io/badge/runtime%20deps-react%20only-brightgreen">
</p>

<!--
  SCREENSHOT PENDING — replace this comment with:
  <p align="center"><img src="docs/screenshot.png" alt="The Results step showing the five-year table, cash chart and headline figures" width="900"></p>
  Capture the Results step at ~1180px in Event Horizon dark, with the sample
  case loaded, then a 375px shot of the year cards beside it.
-->

---

## Try it in thirty seconds

```bash
git clone https://github.com/MenokoOG/proforma.git
cd proforma
npm ci
npm run dev      # http://localhost:5173
```

Node 22 or newer. There is an `.nvmrc`.

Load the worked example from the Brief step to see a finished business case
before building your own.

## Why it exists

Most AI business cases fall over in the same place: the benefit side is
estimated more generously than the cost side, the annual figures start in the
wrong year, and nobody can say what the peak funding requirement is. ProForma
is opinionated about all three.

- **Everything runs in your browser.** No account, no backend, no telemetry.
  Your figures never leave the device.
- **Every number is derived from something you entered.** Nothing is assumed on
  your behalf, and the readiness check names what a reviewer will pull on first.
- **The arithmetic is verified** against the source workbook and guarded by a
  regression suite, so a refactor cannot quietly move a figure.

---

## What it does

Eight steps, in the order a real approval conversation happens.

| #   | Step             | What it produces                                                                                                                                                                                  |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Brief**        | Title, business area, proposal, and the 18 stakeholder roles. Empty roles are the finding.                                                                                                        |
| 2   | **Use case**     | 20 industries × predictive / generative / agentic, as a reference point reviewers already believe.                                                                                                |
| 3   | **Architecture** | Cross-functional decision matrix (models, optimisations, infrastructure) scored on cost, benefit and 7 risk dimensions — plus a token calculator that turns the "AI API" line into a calculation. |
| 4   | **Costs**        | Seven cost categories, one-time and annual.                                                                                                                                                       |
| 5   | **Benefits**     | Automation, augmentation, differentiation — each demanding a justification.                                                                                                                       |
| 6   | **Risks**        | Mitigation budget, pre-loaded with the risks you scored on step 3.                                                                                                                                |
| 7   | **Results**      | Five-year table, cash chart, payback, ROI, NPV, IRR, peak funding need, and a readiness check.                                                                                                    |
| 8   | **Roadmap**      | Six phase gates × seven swimlanes, 122 deliverables, with dates and progress tracking.                                                                                                            |

Then **Export**: print/PDF, Markdown, CSV, or a JSON project file that round-trips everything.

---

## The one rule that governs every number

Taken directly from the source framework:

> Annual costs and benefits are assumed to start from the second year.

So **one-time amounts land entirely in Year 1**, and **annual amounts apply to Years 2–5**.
A line with 30,000 one-time and 10,000 annual totals 70,000 over five years.

This is surfaced in the UI rather than buried, because it is the single most common source of
disagreement when two people compare their versions of the same model.

Verified against the source workbook: seeding the framework's own example figures reproduces its
totals exactly — Year 1 net −1,930,000, Years 2–5 net +790,000, running total
−1,930,000 / −1,140,000 / −350,000 / +440,000 / +1,230,000.

---

## The token calculator

The "AI API" cost line is usually the one people guess at. This models it:

```
requests/day × days/year × [ input tokens × rate × (1 − cache hit)
                           + input tokens × rate × cache hit × 0.1
                           + output tokens × rate ]
× (1 + overhead)
```

Prompt-cached input bills at roughly a tenth of the standard rate, which makes the cache hit
rate the biggest single lever — the calculator shows the saving explicitly. The overhead
multiplier covers retries, evals and non-production traffic, which is where most estimates
under-shoot.

Claude rates ship built in. **For any other provider, use "Custom rate" and enter the numbers
from that provider's own pricing page** — ProForma deliberately does not ship guessed
third-party prices, because a case built on a guessed rate is worse than one built on a rate you
looked up.

Tick the link box and the calculation drives the cost line; untick it to enter the figure by hand.

---

## Optional AI review

The Export step can have a reviewer agent read the finished case and tell you where a sceptical
CFO would push back. It is **off by default** and the app is fully functional without it.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."     # bash
$env:ANTHROPIC_API_KEY = "sk-ant-..."     # PowerShell

npm run assist                            # second terminal, port 8787
```

The key stays in that local Node process and is **never sent to the browser** — which is the
whole reason `server/index.mjs` exists rather than calling the API from the frontend. When the
server is not running, the panel says so and everything else carries on.

Override the model with `PROFORMA_MODEL` (default `claude-opus-5`).

---

## Design notes

**Mobile-first.** Single column, bottom navigation with safe-area insets, every tap target at
44 px, no horizontal page scroll at 375 px. Wide tables and phase tabs scroll inside their own
containers rather than pushing the page sideways. The step rail appears at ≥900 px.

**Snappy.** React and nothing else — no chart library, no UI kit, no icon font. 93 kB gzipped.
The chart is hand-rolled SVG so it renders instantly, inherits theme colours, and prints
correctly. Writes to `localStorage` are debounced so typing never blocks.

**Accessible.** Semantic landmarks, a skip link, labels on all 135 inputs, `aria-current` on the
step rail, live regions for totals and step changes, visible focus rings, and full
`prefers-reduced-motion` support. Meaning is never carried by colour alone — every figure is
signed and labelled.

**Theme-aware.** Light, dark and system, with the choice remembered. The light palette is
defined on bare `:root` so it is never trapped inside a media query.

**Print is a first-class export.** Printing produces the entire case — headline figures, chart,
five-year table, justifications, architecture decisions, stakeholders and the full roadmap — not
whichever step happens to be open.

---

## Source material and attribution

**ProForma implements four frameworks taught by [Ed Donner](https://edwarddonner.com/proficient/)**,
in the _AI Leadership: Commercial value with AI_ module of his Proficient AI Engineer program.
The method is his. The application is not.

1. **High-Level Strategic Decision Framework** → the five-year cost / benefit / risk model, its
   seven cost lines, three benefit categories and three mitigation lines, and the rule that annual
   amounts begin in the second year.
2. **Cross-Functional AI Project Decision-Making Framework** → the 18 stakeholder roles and the
   decision matrix with its seven risk dimensions and named owners.
3. **End-to-End AI Delivery Roadmap** → six phase gates × seven swimlanes. The grid was
   reconstructed from the deck's actual shape geometry, so every deliverable sits in the phase
   and swimlane the author placed it in — including Phase 0 being governance-only.
4. **AI Industry Use Cases** → 20 industries × predictive / generative / agentic.

Each implementing file carries a header comment naming its source document, and
**[`NOTICE`](NOTICE) sets out exactly what is borrowed and what is ours** — worth reading before
you change anything under `src/data/`.

In short: the structure and method are Ed Donner's — which cost lines exist, which categories a
case is argued in, which risks get scored and by whom, and the arithmetic convention. The
interface, calculation engine, token model, exports, readiness checks and all guidance text are
classHuman AI's. The industry descriptions were rewritten in ProForma's own words, and unsourced
performance figures in the original were removed rather than repeated.

Lawrence Jefferson II completed the Proficient AI Engineer program (certificate issued 3 August
2026); the toolkits were distributed to participants, with the workbooks inviting people to share
improvements back.

The frameworks are indicative starting points meant to be tuned per business. The arithmetic
here is faithful to them; the judgement is still yours.

## Licence

[Apache-2.0](LICENSE). Copyright 2026 classHuman AI LLC.

---

## Project layout

```
src/
  lib/
    types.ts        domain model
    calc.ts         spreading rule, payback, NPV, IRR, token cost, gap analysis
    defaults.ts     framework line items + a worked example
    format.ts       currency / number formatting and lenient input parsing
    storage.ts      localStorage with forward-compatible hydration
    export.ts       JSON, CSV and Markdown exporters
  data/             the four source documents, as typed data
  state/store.tsx   reducer, debounced persistence, derived results
  components/       UI primitives, line editor, SVG chart, print report
  steps/            one file per step
server/index.mjs    optional AI review server (holds the API key)
```

## Scripts

| Command              | Does                                      |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Dev server on 5173                        |
| `npm run build`      | Typecheck and production build to `dist/` |
| `npm run preview`    | Serve the built output                    |
| `npm run typecheck`  | Types only                                |
| `npm test`           | Run the test suite once                   |
| `npm run test:watch` | Tests in watch mode                       |
| `npm run lint`       | ESLint                                    |
| `npm run format`     | Prettier, writing in place                |
| `npm run assist`     | Optional AI review server on 8787         |

## Tests

The calculation engine is the part that has to be right, so it is the part that is tested. The
suite guards the figures verified against the source workbook — Year 1 net −1,930,000, Years 2–5
+790,000 each, total cost 4,220,000, total benefit 6,850,000, payback in year 4 — along with the
spreading rule, payback interpolation, the never-breaks-even case, IRR on a same-sign series, the
token model's cache multiplier, the input parser, and `hydrate()` round-tripping a saved document.

Colour contrast is tested rather than asserted: the suite reads the real token block out of
`app.css` and checks every text token against every ground it can land on, in both themes.

```bash
npm test
```

CI runs lint, format check, typecheck, tests and build on every push and pull request, and fails
the build if the bundle exceeds 120 kB gzipped.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). The short version: no new runtime dependencies, don't
change the arithmetic without a test and a conversation, all colour goes through a token, and
nothing may scroll sideways at 320 px.

Security issues go through [SECURITY.md](SECURITY.md), privately — **note in particular that the
optional assist server holds an API key and must never be exposed to the public internet.**
