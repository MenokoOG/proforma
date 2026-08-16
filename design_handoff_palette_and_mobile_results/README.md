# Handoff: ProForma palette + mobile Results

## Overview

Two changes to the existing ProForma app:

1. **A new colour palette**, replacing the cream/tan ground and teal brand with a cool grey ground and a blue brand. Light and dark. This is a token-block swap — no component changes beyond five hard-coded `#fff` values.
2. **A mobile-first rebuild of the Results step (step 7)**, which currently renders a desktop chart and a 560px-wide table into a 375px viewport.

Change 1 affects the whole app. Change 2 affects `src/steps/ResultsStep.tsx`, `src/components/Chart.tsx` and the table/stat rules in `src/styles/app.css`.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behaviour, not production code to copy. ProForma is a React + Vite + TypeScript app with hand-written CSS in a single `src/styles/app.css`, no UI kit and no CSS-in-JS. Recreate these designs in that environment, using its existing patterns: CSS custom properties for all colour, semantic class names in `app.css`, inline `<svg>` for icons and charts, no new dependencies.

The prototypes use inline styles because of the tool they were authored in. **Do not carry inline styles into the app** — every value below belongs in `app.css` against the existing class names.

## Fidelity

**High-fidelity.** Colours, typography, spacing and layout are final. Recreate pixel-perfectly.

---

# Part 1 — Palette

## Why it changed

The old palette had two problems. The ground was warm cream (`#f7f4ee`) with terracotta and mustard semantics, which read as generic. And `--brand` and `--benefit` were the same teal (`#0f6f68`), so interface chrome and positive figures shared a hue — the progress bar, the current step number and a positive net all looked alike.

The new palette separates them: blue is the brand and appears only on chrome, green means benefit, carmine means cost. Amber stays for risk.

## The token block

`proforma-theme.css` in this bundle is a **drop-in replacement for lines 1–113 of `src/styles/app.css`** — the comment header, the bare `:root` block, the `@media (prefers-color-scheme: dark)` block and the `:root[data-theme='dark']` block. Every variable name is unchanged, so nothing downstream needs touching. Light stays defined on bare `:root`, outside any media query, as the existing comment requires.

### Light (bare `:root`)

| Token | Old | New |
|---|---|---|
| `--paper` | `#f7f4ee` | `#eff2f6` |
| `--surface` | `#fffdfa` | `#ffffff` |
| `--surface-2` | `#f1ede4` | `#f2f5f9` |
| `--surface-sunken` | `#ebe6db` | `#e2e7ee` |
| `--line` | `#ddd6c8` | `#d8dee7` |
| `--line-strong` | `#c6bdaa` | `#b4bdca` |
| `--ink` | `#1b1f26` | `#111722` |
| `--ink-2` | `#4a5058` | `#49525f` |
| `--ink-3` | `#767d87` | `#79838f` |
| `--brand` | `#0f6f68` | `#1f4fb0` |
| `--brand-strong` | `#0b524d` | `#16397f` |
| `--brand-soft` | `#d9ebe8` | `#e2eaf8` |
| `--benefit` | `#0f6f68` | `#1c6b4a` |
| `--benefit-soft` | `#d9ebe8` | `#dcefe4` |
| `--cost` | `#a4432a` | `#a32b33` |
| `--cost-soft` | `#f6e2da` | `#f8e3e4` |
| `--risk` | `#8a6110` | `#8a6110` (unchanged) |
| `--risk-soft` | `#f7ead0` | `#f4ead9` |
| `--danger` | `#a02020` | `#a3202a` |
| `--focus` | `#0f6f68` | `#1f4fb0` |

Shadows are retinted from warm to cool: `--shadow: 0 1px 2px rgb(17 23 34 / 0.06), 0 6px 18px -8px rgb(17 23 34 / 0.16)` and `--shadow-lg: 0 2px 6px rgb(17 23 34 / 0.08), 0 24px 48px -20px rgb(17 23 34 / 0.3)`.

### Dark (both dark blocks, identical values)

| Token | Old | New |
|---|---|---|
| `--paper` | `#101318` | `#0e1219` |
| `--surface` | `#171b22` | `#161c26` |
| `--surface-2` | `#1e232b` | `#1e2531` |
| `--surface-sunken` | `#0c0f13` | `#0a0e14` |
| `--line` | `#2b313b` | `#2a323f` |
| `--line-strong` | `#3d4552` | `#3c4657` |
| `--ink` | `#eef1f5` | `#e9edf3` |
| `--ink-2` | `#b3bbc6` | `#aeb8c6` |
| `--ink-3` | `#838d9a` | `#7d8899` |
| `--brand` | `#4fbfb2` | `#7aa5f0` |
| `--brand-strong` | `#7ad4c8` | `#a3c1f7` |
| `--brand-soft` | `#10312e` | `#16233c` |
| `--benefit` | `#4fbfb2` | `#4fb489` |
| `--benefit-soft` | `#10312e` | `#0f2a20` |
| `--cost` | `#e08a68` | `#e8737c` |
| `--cost-soft` | `#341c14` | `#331419` |
| `--risk` | `#d9ae53` | `#d9ae53` (unchanged) |
| `--risk-soft` | `#2e2513` | `#2e2513` (unchanged) |
| `--danger` | `#e57373` | `#e57373` (unchanged) |
| `--focus` | `#4fbfb2` | `#7aa5f0` |

Dark shadows are unchanged.

## The one required component change: `--on-brand`

The new token block adds:

```css
:root { --on-brand: #ffffff; }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { --on-brand: #0e1219; } }
:root[data-theme='dark'] { --on-brand: #0e1219; }
```

Five rules in `app.css` currently hard-code `color: #fff` on a brand fill. In dark mode `--brand` is a light blue (`#7aa5f0`), so white text on it drops to roughly 1.6:1. Change all five to `color: var(--on-brand)`:

1. `.skip-link` — `background: var(--brand); color: #fff`
2. `.wordmark .mark` — the 26px `PF` square
3. `.rail-item[aria-current='step'] .rail-num`
4. `.btn.primary`
5. `.chip[aria-pressed='true']`

`.switch::after` uses `background: var(--surface)` and needs no change.

## Verification

After the swap, grep `src/` for hex literals. Everything that renders colour should read a token. Known exceptions to check by eye: the five above, and `Chart.tsx`'s legend swatches, which set `background: 'var(--cost)'` etc. inline and are already correct.

Check contrast in both themes on: `.stat.pos .v` / `.stat.neg .v` against `--surface`; `td.cost` / `td.benefit` against `--surface` and against `tr.total`'s `--surface-2`; `.eyebrow` (brand on paper); and the chart's `.payback-text` (brand on surface).

---

# Part 2 — Mobile Results

Three problems at 375px, each with its fix. The desktop layout at ≥760px is unchanged in all three cases.

## 2a. The chart

**Problem.** `CashChart` renders a fixed `viewBox="0 0 720 320"` scaled to fit. At 375px the SVG is about 343px wide, a scale factor of 0.476 — so the 10px axis labels render at about 4.8px and the 9.5px cumulative labels at about 4.5px. The bars and the cumulative line still read; every number is illegible.

**Fix.** Give the chart a second geometry for narrow viewports rather than restyling the same one. Detect with a `matchMedia('(max-width: 600px)')` hook (there is no resize hook in `src/components/ui.tsx` yet — add one alongside `useScrollTop`), and branch the constants:

| Constant | Desktop | Mobile |
|---|---|---|
| `W` × `H` | 720 × 320 | 360 × 260 |
| `padL` / `padR` / `padT` / `padB` | 56 / 16 / 24 / 46 | 42 / 10 / 26 / 44 |
| `barW` cap | 30 | 16 |
| `gap` | 5 | 4 |
| gridline `ticks` | 4 | 2 |
| axis label size | 10px | 11px |
| value label size | 9.5px | 11px, weight 600 |

At 360 wide the SVG renders near 1:1 in a 375px viewport, so 11px stays 11px.

Two further mobile-only changes inside the chart:

- **Gridlines drop from five to two** plus the zero baseline. The `0` axis label stays; the intermediate ±half-range labels go. Keeping five gridlines in 190px of plot height is noise.
- **The cumulative value under each bar is signed and coloured** — `var(--cost)` when negative, `var(--benefit)` when positive, rather than `--ink-2` throughout. On mobile this row of numbers is doing the work the cumulative line does on desktop, so the sign needs to be visible without tracing the line. Use `signedMoney` compacted, e.g. `-1.9M`, `+440K`.

The `describe()` aria-label is unchanged — the accessible description already carries every figure.

## 2b. Stat values break mid-number

**Problem.** `.stat .v` is `clamp(1.3rem, 5vw, 1.7rem)` with `overflow-wrap: anywhere`, in a 2-column grid. At 375px each non-hero card is about 165px wide, and `$1,230,000` at 1.3rem does not fit — so it wraps to `$1,23` / `0,000`.

**Fix.**

- The **hero** stat (`.stat.hero`) already spans the full width. Keep the full figure there, bump to `2rem` at ≤400px, and set `white-space: nowrap`.
- The **six secondary** stats switch to `compactMoney` below 600px — `$4.49M`, `$6.32M`, `$1.93M`. Figures under a million keep their full form (`compactMoney` already does this: it returns `money()` below 1000, and `$600,000` and `$522,000` are short enough to fit).
- Replace `overflow-wrap: anywhere` with `white-space: nowrap` on `.stat .v`. A number that overflows its box is a layout bug to fix; a number broken across lines is a misread figure.
- Shorten the `sub` copy on mobile: "Excluding mitigation" → "Excl. mitigation", "Deepest point of the cash hole" → "Deepest cash hole".

Pass a `compact` boolean from `ResultsStep` through to `Stat` rather than branching inside `Stat` — the same component is used on other steps where compaction is not wanted.

## 2c. The table becomes a year list

**Problem.** The five-year table is `min-width: 560px` with `white-space: nowrap` on every cell, seven columns wide. At 375px that is a 1.5-screen horizontal scroll. The sticky first column helps, but Year 1 and the 5-year total can never be on screen together — which is the one comparison the table exists to support.

**Fix.** Below 760px, render the same data as five stacked cards, one per year, in place of the table. Each card is a `<details>`:

**Summary row** (min-height 44px, `padding: 12px 14px`):
- A 30px circular badge, `background: var(--surface-2)`, `color: var(--ink-2)`, 0.72rem/700, reading `Y1`…`Y5`
- The year's **net**, 0.9rem/600, tabular-nums, `var(--cost)` or `var(--benefit)` by sign, via `signedMoney`
- Beneath it, the **running total**, 0.75rem, `var(--ink-3)`, `Running total −$1,140,000`
- A chevron-right icon, `var(--ink-3)`, rotating 90° when open (the `.lineitem .chev` rule already does this — reuse it)

**Expanded body** (`border-top: 1px solid var(--line)`, `background: var(--surface-2)`, `padding: 12px 14px`): every non-zero line for that year as a label/amount row, `display: flex; justify-content: space-between`, 0.83rem, amounts tabular-nums and coloured by sign. Cost and mitigation lines show as negative. Then a `Net for the year` row above a `2px solid var(--line-strong)` top border, 0.88rem/700.

**The break-even year is marked in place**: `border: 1.5px solid var(--brand)`, `background: var(--brand-soft)`, badge filled `var(--brand)` with `var(--on-brand)` text, and the running-total line reads `Running total +$440,000 — breaks even` in `var(--ink-2)`. This replaces the vertical dashed marker that the chart carries on desktop.

Below the list, a footer row: the text `Need every line at once?` at 0.82rem `var(--ink-2)`, and a `.btn.small` labelled **Full table** that reveals the existing `<table>` in its scrolling wrapper. The table is still the right tool for someone who wants it; it just should not be the default on a phone.

Keep the existing `<table>` mounted and unstyled-away rather than unmounting it — the print report at `PrintReport.tsx` and the `.tablewrap` scroll behaviour both depend on it existing.

## Responsive rules to add

The app is already mobile-first with breakpoints at 620, 700, 720, 760, 860 and 900px. Add nothing new above 900. The three fixes need:

- `@media (max-width: 600px)` — chart geometry (JS-side via `matchMedia`, matching this value), stat compaction
- `@media (max-width: 759px)` — year cards shown, `.tablewrap` hidden until toggled
- `@media (min-width: 760px)` — year cards hidden, table shown, existing behaviour

Verify at 320, 375, 414, 600, 768, 900 and 1180px. No horizontal page scroll at any of them; the only sideways scroll allowed is inside `.tablewrap` when the user has opted into it.

---

## Design tokens

All colour is in `proforma-theme.css`. Nothing else changed:

- **Type** — `--font` (system sans), `--font-display` (Iowan Old Style / Palatino / Georgia serif) for `.stat .v`, `.step-head h1` and `.bucket-total .v`, `--font-mono`. Unchanged.
- **Radii** — `--r-sm` 8px, `--r` 12px, `--r-lg` 18px. Year cards use `--r`; the badge is `999px`.
- **Spacing** — `--gap` 16px, `--tap` 44px (every new tap target meets it), `--maxw` 1180px.

## Assets

None. Every icon is an inline `<svg>` from the `Icon` map in `src/components/ui.tsx`; the year cards reuse `Icon.chevronRight` and the all-clear banner reuses `Icon.check`. No new icons are needed and no image files are involved.

## Files in this bundle

- `proforma-theme.css` — the drop-in token block. Copy over lines 1–113 of `src/styles/app.css`, then add the `--on-brand` block and make the five swaps listed above.
- `ProForma Theme.dc.html` — the palette applied to Results at both breakpoints, with a Light/Dark toggle. The reference for Part 1.
- `ProForma Results Mobile.dc.html` — the mobile Results screen at 375px, annotated. The reference for Part 2.

Open the two HTML files in a browser directly; they need no build step.

## Files to change in the app

| File | Change |
|---|---|
| `src/styles/app.css` | Token block (lines 1–113) replaced; `--on-brand` added; five `#fff` swaps; `.stat .v` wrapping; year-card rules; the two new media queries |
| `src/components/Chart.tsx` | Mobile geometry branch, mobile gridline count, signed/coloured cumulative labels |
| `src/components/ui.tsx` | New `useMediaQuery` hook; `Stat` gains a `compact` prop |
| `src/steps/ResultsStep.tsx` | Year-card list below 760px, Full-table toggle, compact stat values and shortened sub copy |

Nothing else in `src/steps/` needs editing for the palette — every other step reads the tokens.
