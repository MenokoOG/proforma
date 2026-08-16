# ProForma

**Build the AI business case.**

A mobile-first tool that turns a Gen AI idea into a defensible five-year cost, benefit and risk
projection — with the payback year, peak funding requirement and NPV a sponsor will ask for.

Everything runs in the browser. No account, no backend, no data leaves the device.

```bash
npm install
npm run dev      # http://localhost:5173
```

---

## What it does

Eight steps, in the order a real approval conversation happens.

| # | Step | What it produces |
|---|------|------------------|
| 1 | **Brief** | Title, business area, proposal, and the 18 stakeholder roles. Empty roles are the finding. |
| 2 | **Use case** | 20 industries × predictive / generative / agentic, as a reference point reviewers already believe. |
| 3 | **Architecture** | Cross-functional decision matrix (models, optimisations, infrastructure) scored on cost, benefit and 7 risk dimensions — plus a token calculator that turns the "AI API" line into a calculation. |
| 4 | **Costs** | Seven cost categories, one-time and annual. |
| 5 | **Benefits** | Automation, augmentation, differentiation — each demanding a justification. |
| 6 | **Risks** | Mitigation budget, pre-loaded with the risks you scored on step 3. |
| 7 | **Results** | Five-year table, cash chart, payback, ROI, NPV, IRR, peak funding need, and a readiness check. |
| 8 | **Roadmap** | Six phase gates × seven swimlanes, 122 deliverables, with dates and progress tracking. |

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

## Source material

ProForma implements four documents:

1. **High-Level Strategic Decision Framework** → the five-year cost / benefit / risk model, its
   seven cost lines, three benefit categories and three mitigation lines.
2. **Cross-Functional AI Project Decision-Making Framework** → the 18 stakeholder roles and the
   decision matrix with its seven risk dimensions and named owners.
3. **End-to-End AI Delivery Roadmap** → six phase gates × seven swimlanes. The grid was
   reconstructed from the deck's actual shape geometry, so every deliverable sits in the phase
   and swimlane the author placed it in — including Phase 0 being governance-only.
4. **AI Industry Use Cases** → 20 industries × predictive / generative / agentic.

The frameworks are indicative starting points meant to be tuned per business. The arithmetic
here is faithful to them; the judgement is still yours.

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

| Command | Does |
|---|---|
| `npm run dev` | Dev server on 5173 |
| `npm run build` | Typecheck and production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run typecheck` | Types only |
| `npm run assist` | Optional AI review server on 8787 |
