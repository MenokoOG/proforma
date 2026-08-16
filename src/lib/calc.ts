import type { Doc, LineItem, Results, TokenModel, TokenPlan, YearRow } from './types'

export const HORIZON = 5

/**
 * The spreading rule, taken directly from the source framework:
 *
 *   "Annual costs and benefits assumed to start from the 2nd year"
 *
 * So Year 1 carries the one-time amount only, and Years 2–5 carry the annual
 * amount. A line with one-time 30,000 and annual 10,000 spreads as
 * 30,000 / 10,000 / 10,000 / 10,000 / 10,000 = 70,000 over five years.
 */
export function spread(item: Pick<LineItem, 'oneTime' | 'annual'>): number[] {
  const out = new Array<number>(HORIZON).fill(0)
  out[0] = num(item.oneTime)
  for (let i = 1; i < HORIZON; i++) out[i] = num(item.annual)
  return out
}

export function lineTotal(item: Pick<LineItem, 'oneTime' | 'annual'>): number {
  return num(item.oneTime) + num(item.annual) * (HORIZON - 1)
}

function sumSpread(items: LineItem[]): number[] {
  const out = new Array<number>(HORIZON).fill(0)
  for (const item of items) {
    const s = spread(item)
    for (let i = 0; i < HORIZON; i++) out[i] += s[i]
  }
  return out
}

export function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Year labels anchored to the project start date: "Year 1 (2026)". */
export function yearLabels(startDate: string): string[] {
  const start = new Date(startDate)
  const base = Number.isNaN(start.getTime()) ? new Date().getFullYear() : start.getFullYear()
  return Array.from({ length: HORIZON }, (_, i) => `Year ${i + 1} (${base + i})`)
}

export function shortYearLabels(startDate: string): string[] {
  const start = new Date(startDate)
  const base = Number.isNaN(start.getTime()) ? new Date().getFullYear() : start.getFullYear()
  return Array.from({ length: HORIZON }, (_, i) => `Y${i + 1}`).map(
    (l, i) => `${l} · ${base + i}`,
  )
}

/* ------------------------------------------------------------------ */
/* Core projection                                                     */
/* ------------------------------------------------------------------ */

export function computeResults(doc: Doc): Results {
  const costs = sumSpread(doc.costs)
  const mitigations = sumSpread(doc.mitigations)
  const benefits = sumSpread(doc.benefits)
  const labels = yearLabels(doc.project.startDate)

  const years: YearRow[] = []
  let cumulative = 0
  for (let i = 0; i < HORIZON; i++) {
    const net = benefits[i] - costs[i] - mitigations[i]
    cumulative += net
    years.push({
      index: i,
      label: labels[i],
      cost: costs[i],
      mitigation: mitigations[i],
      benefit: benefits[i],
      net,
      cumulative,
    })
  }

  const totalCost = sum(costs)
  const totalMitigation = sum(mitigations)
  const totalBenefit = sum(benefits)
  const totalNet = totalBenefit - totalCost - totalMitigation
  const outlay = totalCost + totalMitigation

  // Payback: first year the running total is no longer under water.
  let paybackYear: number | null = null
  let paybackYears: number | null = null
  for (let i = 0; i < HORIZON; i++) {
    if (years[i].cumulative >= 0) {
      paybackYear = i + 1
      if (i === 0) {
        // Already in the black by the end of Year 1.
        paybackYears = 1
      } else {
        const prev = years[i - 1].cumulative // negative
        const gain = years[i].net
        const fraction = gain > 0 ? Math.abs(prev) / gain : 1
        paybackYears = i + clamp(fraction, 0, 1)
      }
      break
    }
  }

  const r = num(doc.project.discountRate) / 100
  let npv = 0
  for (let i = 0; i < HORIZON; i++) npv += years[i].net / Math.pow(1 + r, i)

  const peakExposure = Math.min(0, ...years.map((y) => y.cumulative))

  return {
    years,
    totalCost,
    totalMitigation,
    totalBenefit,
    totalNet,
    paybackYear,
    paybackYears,
    roi: outlay > 0 ? totalNet / outlay : null,
    npv,
    irr: irr(years.map((y) => y.net)),
    peakExposure,
  }
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/**
 * Internal rate of return by bisection. Returns null when the cash flows do
 * not cross zero (all-positive or all-negative series have no meaningful IRR).
 */
export function irr(flows: number[]): number | null {
  const hasNeg = flows.some((f) => f < 0)
  const hasPos = flows.some((f) => f > 0)
  if (!hasNeg || !hasPos) return null

  const npvAt = (rate: number) => flows.reduce((acc, f, i) => acc + f / Math.pow(1 + rate, i), 0)

  let lo = -0.9999
  let hi = 10
  let fLo = npvAt(lo)
  let fHi = npvAt(hi)
  if (fLo * fHi > 0) return null

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const fMid = npvAt(mid)
    if (Math.abs(fMid) < 1e-7) return mid
    if (fLo * fMid < 0) {
      hi = mid
      fHi = fMid
    } else {
      lo = mid
      fLo = fMid
    }
  }
  void fHi
  return (lo + hi) / 2
}

/* ------------------------------------------------------------------ */
/* Token / inference cost model                                        */
/* ------------------------------------------------------------------ */

export interface TokenCost {
  inputPerM: number
  outputPerM: number
  requestsPerYear: number
  inputTokensPerYear: number
  outputTokensPerYear: number
  inputCost: number
  outputCost: number
  /** Money saved by prompt caching, versus paying full rate on every token. */
  cacheSaving: number
  subtotal: number
  overhead: number
  annual: number
  perRequest: number
  perThousandRequests: number
}

/** Cached input tokens bill at roughly a tenth of the standard input rate. */
export const CACHE_READ_MULTIPLIER = 0.1

export function computeTokenCost(plan: TokenPlan, models: TokenModel[]): TokenCost {
  const model = models.find((m) => m.id === plan.modelId)
  const inputPerM = plan.modelId === 'custom' ? num(plan.customInputPerM) : num(model?.inputPerM)
  const outputPerM =
    plan.modelId === 'custom' ? num(plan.customOutputPerM) : num(model?.outputPerM)

  const requestsPerYear = num(plan.requestsPerDay) * num(plan.daysPerYear)
  const inTok = num(plan.inputTokensPerRequest)
  const outTok = num(plan.outputTokensPerRequest)
  const hit = clamp(num(plan.cacheHitRate) / 100, 0, 1)

  const inputTokensPerYear = requestsPerYear * inTok
  const outputTokensPerYear = requestsPerYear * outTok

  const fullRateInput = (inputTokensPerYear / 1_000_000) * inputPerM
  const inputCost =
    ((inputTokensPerYear * (1 - hit)) / 1_000_000) * inputPerM +
    ((inputTokensPerYear * hit) / 1_000_000) * inputPerM * CACHE_READ_MULTIPLIER
  const outputCost = (outputTokensPerYear / 1_000_000) * outputPerM

  const subtotal = inputCost + outputCost
  const overhead = subtotal * (clamp(num(plan.overheadPct), 0, 1000) / 100)
  const annual = subtotal + overhead

  return {
    inputPerM,
    outputPerM,
    requestsPerYear,
    inputTokensPerYear,
    outputTokensPerYear,
    inputCost,
    outputCost,
    cacheSaving: fullRateInput - inputCost,
    subtotal,
    overhead,
    annual,
    perRequest: requestsPerYear > 0 ? annual / requestsPerYear : 0,
    perThousandRequests: requestsPerYear > 0 ? (annual / requestsPerYear) * 1000 : 0,
  }
}

/* ------------------------------------------------------------------ */
/* Architecture decision rollup                                        */
/* ------------------------------------------------------------------ */

export interface DecisionRollup {
  selectedCount: number
  buildCost: number
  runtimeCost: number
  /** Mean risk score across every scored cell of every selected option, 0–5. */
  averageRisk: number
  /** Highest single risk score across selected options. */
  peakRisk: number
  scoredCells: number
}

export function rollupDecisions(rows: Doc['decisions']): DecisionRollup {
  const selected = rows.filter((r) => r.selected)
  let scoreTotal = 0
  let scored = 0
  let peak = 0
  for (const row of selected) {
    for (const v of Object.values(row.risks)) {
      if (v > 0) {
        scoreTotal += v
        scored += 1
        if (v > peak) peak = v
      }
    }
  }
  return {
    selectedCount: selected.length,
    buildCost: selected.reduce((a, r) => a + num(r.buildCost), 0),
    runtimeCost: selected.reduce(
      (a, r) => a + num(r.runtimeCostEng) + num(r.runtimeCostSupport),
      0,
    ),
    averageRisk: scored > 0 ? scoreTotal / scored : 0,
    peakRisk: peak,
    scoredCells: scored,
  }
}

/* ------------------------------------------------------------------ */
/* Readiness — what still needs attention before this goes to a board  */
/* ------------------------------------------------------------------ */

export interface Gap {
  id: string
  step: number
  severity: 'blocker' | 'warning'
  message: string
}

export function findGaps(doc: Doc, results: Results): Gap[] {
  const gaps: Gap[] = []
  const push = (id: string, step: number, severity: Gap['severity'], message: string) =>
    gaps.push({ id, step, severity, message })

  if (!doc.project.title.trim()) push('title', 0, 'blocker', 'The initiative has no title.')
  if (!doc.project.proposal.trim())
    push('proposal', 0, 'blocker', 'No proposal summary — a sponsor has nothing to read.')
  if (!doc.project.sponsors.trim()) push('sponsor', 0, 'warning', 'No executive sponsor named.')

  const namedStakeholders = Object.values(doc.stakeholders).filter((v) => v.trim()).length
  if (namedStakeholders < 4)
    push(
      'stakeholders',
      0,
      'warning',
      `Only ${namedStakeholders} stakeholder role${namedStakeholders === 1 ? '' : 's'} named — cross-functional review will be thin.`,
    )

  if (!doc.useCase.industry)
    push('usecase', 1, 'warning', 'No industry selected, so no benchmark use cases are attached.')

  if (!doc.decisions.some((d) => d.selected))
    push('decisions', 2, 'warning', 'No model or architecture option selected.')

  const costTotal = results.totalCost + results.totalMitigation
  if (costTotal === 0) push('costs', 3, 'blocker', 'Every cost line is zero.')
  if (results.totalBenefit === 0)
    push('benefits', 4, 'blocker', 'Every benefit line is zero — there is no case to make.')

  const unjustifiedBenefits = doc.benefits.filter((b) => lineTotal(b) > 0 && !b.note.trim())
  if (unjustifiedBenefits.length)
    push(
      'justify',
      4,
      'warning',
      `${unjustifiedBenefits.length} benefit line${unjustifiedBenefits.length === 1 ? '' : 's'} carry money but no justification.`,
    )

  if (results.totalMitigation === 0)
    push('risk', 5, 'warning', 'No risk mitigation budgeted. Reviewers will ask why.')

  if (results.paybackYear === null)
    push(
      'payback',
      6,
      'warning',
      'The initiative never breaks even inside five years on these numbers.',
    )

  return gaps
}
