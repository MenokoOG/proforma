import { describe, expect, it } from 'vitest'
import {
  CACHE_READ_MULTIPLIER,
  computeResults,
  computeTokenCost,
  findGaps,
  HORIZON,
  irr,
  lineTotal,
  rollupDecisions,
  spread,
} from '../calc'
import { createDoc, createSampleDoc } from '../defaults'
import type { LineItem, TokenModel, TokenPlan } from '../types'

const line = (oneTime: number, annual: number): Pick<LineItem, 'oneTime' | 'annual'> => ({
  oneTime,
  annual,
})

/* ------------------------------------------------------------------ */
/* The regression guard                                                */
/*                                                                     */
/* These figures were verified against the source workbook. They are   */
/* the reason this file exists. If a change moves any of them, the     */
/* change is wrong until proven otherwise — see CONTRIBUTING.md.       */
/* ------------------------------------------------------------------ */

describe('the worked example reproduces the source workbook', () => {
  const r = computeResults(createSampleDoc())

  it('lands Year 1 net at −1,930,000', () => {
    expect(r.years[0].net).toBe(-1_930_000)
  })

  it('holds Years 2 to 5 net at +790,000 each', () => {
    expect(r.years.slice(1).map((y) => y.net)).toEqual([790_000, 790_000, 790_000, 790_000])
  })

  it('produces the running total the workbook produces', () => {
    expect(r.years.map((y) => y.cumulative)).toEqual([
      -1_930_000, -1_140_000, -350_000, 440_000, 1_230_000,
    ])
  })

  it('totals cost, benefit and mitigation', () => {
    expect(r.totalCost).toBe(4_220_000)
    expect(r.totalBenefit).toBe(6_850_000)
    expect(r.totalMitigation).toBe(1_400_000)
  })

  it('breaks even in year 4', () => {
    expect(r.paybackYear).toBe(4)
  })

  it('derives the net position from the three totals', () => {
    expect(r.totalNet).toBe(6_850_000 - 4_220_000 - 1_400_000)
    expect(r.totalNet).toBe(1_230_000)
  })

  it('reports peak funding need as the deepest point of the running total', () => {
    expect(r.peakExposure).toBe(-1_930_000)
  })
})

/* ------------------------------------------------------------------ */
/* The spreading rule                                                  */
/* ------------------------------------------------------------------ */

describe('spread — one-time to Year 1, annual to Years 2-5', () => {
  it('puts the one-time amount in Year 1 alone', () => {
    expect(spread(line(30_000, 0))).toEqual([30_000, 0, 0, 0, 0])
  })

  it('starts the annual amount in Year 2, never Year 1', () => {
    expect(spread(line(0, 10_000))).toEqual([0, 10_000, 10_000, 10_000, 10_000])
  })

  it('combines them without overlapping in Year 1', () => {
    expect(spread(line(30_000, 10_000))).toEqual([30_000, 10_000, 10_000, 10_000, 10_000])
  })

  it('totals a combined line to one-time plus four annuals', () => {
    // The README's worked example: 30,000 + 10,000 = 70,000 over five years.
    expect(lineTotal(line(30_000, 10_000))).toBe(70_000)
  })

  it('always returns exactly the horizon length', () => {
    expect(spread(line(1, 1))).toHaveLength(HORIZON)
    expect(HORIZON).toBe(5)
  })

  it('coerces non-numeric input to zero rather than producing NaN', () => {
    const junk = { oneTime: undefined, annual: 'abc' } as unknown as LineItem
    expect(spread(junk)).toEqual([0, 0, 0, 0, 0])
  })
})

/* ------------------------------------------------------------------ */
/* Payback                                                             */
/* ------------------------------------------------------------------ */

describe('payback', () => {
  const docWith = (costOneTime: number, benefitAnnual: number) => {
    const doc = createDoc()
    doc.costs[0].oneTime = costOneTime
    doc.benefits[0].annual = benefitAnnual
    return doc
  }

  it('interpolates within the year it crosses zero', () => {
    // 1,000 out in Year 1, then 400/yr. Cumulative: -1000, -600, -200, +200.
    // It crosses during Year 4, 200/400 = half way through.
    const r = computeResults(docWith(1_000, 400))
    expect(r.paybackYear).toBe(4)
    expect(r.paybackYears).toBeCloseTo(3.5, 6)
  })

  it('matches the worked example to the fraction', () => {
    const r = computeResults(createSampleDoc())
    // Enters Year 4 at -350,000 and earns 790,000 that year.
    expect(r.paybackYears).toBeCloseTo(3 + 350_000 / 790_000, 6)
  })

  it('returns null when the case never breaks even', () => {
    const r = computeResults(docWith(10_000_000, 1_000))
    expect(r.paybackYear).toBeNull()
    expect(r.paybackYears).toBeNull()
    expect(r.totalNet).toBeLessThan(0)
  })

  it('reports year 1 without interpolating when it is already in the black', () => {
    const doc = createDoc()
    doc.benefits[0].oneTime = 5_000
    const r = computeResults(doc)
    expect(r.paybackYear).toBe(1)
    expect(r.paybackYears).toBe(1)
  })
})

/* ------------------------------------------------------------------ */
/* NPV, ROI, IRR                                                       */
/* ------------------------------------------------------------------ */

describe('npv, roi and irr', () => {
  it('discounts Year 1 at t=0, so a zero rate leaves NPV equal to net', () => {
    const doc = createSampleDoc()
    doc.project.discountRate = 0
    expect(computeResults(doc).npv).toBeCloseTo(1_230_000, 6)
  })

  it('reduces NPV as the discount rate rises', () => {
    const at = (rate: number) => {
      const doc = createSampleDoc()
      doc.project.discountRate = rate
      return computeResults(doc).npv
    }
    expect(at(10)).toBeLessThan(at(0))
    expect(at(20)).toBeLessThan(at(10))
  })

  it('expresses ROI against total outlay including mitigation', () => {
    const r = computeResults(createSampleDoc())
    expect(r.roi).toBeCloseTo(1_230_000 / (4_220_000 + 1_400_000), 9)
  })

  it('returns null ROI when nothing has been spent', () => {
    expect(computeResults(createDoc()).roi).toBeNull()
  })

  it('returns null IRR on an all-positive series', () => {
    expect(irr([100, 100, 100, 100, 100])).toBeNull()
  })

  it('returns null IRR on an all-negative series', () => {
    expect(irr([-100, -100, -100, -100, -100])).toBeNull()
  })

  it('returns null IRR on an all-zero series', () => {
    expect(irr([0, 0, 0, 0, 0])).toBeNull()
  })

  it('finds a rate that zeroes the NPV when the flows do cross', () => {
    const flows = [-1_930_000, 790_000, 790_000, 790_000, 790_000]
    const rate = irr(flows)
    expect(rate).not.toBeNull()
    const npvAtRate = flows.reduce((a, f, i) => a + f / Math.pow(1 + rate!, i), 0)
    expect(npvAtRate).toBeCloseTo(0, 4)
  })
})

/* ------------------------------------------------------------------ */
/* Token cost                                                          */
/* ------------------------------------------------------------------ */

describe('computeTokenCost', () => {
  const models: TokenModel[] = [{ id: 'test', name: 'Test', inputPerM: 3, outputPerM: 15 }]

  const plan = (over: Partial<TokenPlan> = {}): TokenPlan => ({
    modelId: 'test',
    customInputPerM: 0,
    customOutputPerM: 0,
    requestsPerDay: 1_000,
    daysPerYear: 100,
    inputTokensPerRequest: 10_000,
    outputTokensPerRequest: 1_000,
    cacheHitRate: 0,
    overheadPct: 0,
    linkToCosts: true,
    ...over,
  })

  it('multiplies requests by days for the yearly volume', () => {
    const t = computeTokenCost(plan(), models)
    expect(t.requestsPerYear).toBe(100_000)
    expect(t.inputTokensPerYear).toBe(1_000_000_000)
    expect(t.outputTokensPerYear).toBe(100_000_000)
  })

  it('prices uncached input and output at list rate', () => {
    const t = computeTokenCost(plan(), models)
    expect(t.inputCost).toBeCloseTo(3_000, 6) // 1000M tokens x $3/M
    expect(t.outputCost).toBeCloseTo(1_500, 6) // 100M tokens x $15/M
    expect(t.subtotal).toBeCloseTo(4_500, 6)
    expect(t.cacheSaving).toBe(0)
  })

  it('bills cached input at the 0.1x multiplier', () => {
    expect(CACHE_READ_MULTIPLIER).toBe(0.1)
    const t = computeTokenCost(plan({ cacheHitRate: 100 }), models)
    // Every input token cached: 3,000 becomes 300.
    expect(t.inputCost).toBeCloseTo(300, 6)
    expect(t.cacheSaving).toBeCloseTo(2_700, 6)
  })

  it('splits the input bill proportionally at a partial hit rate', () => {
    const t = computeTokenCost(plan({ cacheHitRate: 50 }), models)
    // Half at $3/M, half at $0.30/M.
    expect(t.inputCost).toBeCloseTo(1_500 + 150, 6)
    expect(t.cacheSaving).toBeCloseTo(3_000 - 1_650, 6)
  })

  it('applies overhead on top of the subtotal, not inside it', () => {
    const t = computeTokenCost(plan({ overheadPct: 25 }), models)
    expect(t.subtotal).toBeCloseTo(4_500, 6)
    expect(t.overhead).toBeCloseTo(1_125, 6)
    expect(t.annual).toBeCloseTo(5_625, 6)
  })

  it('clamps a cache hit rate outside 0-100', () => {
    const over = computeTokenCost(plan({ cacheHitRate: 500 }), models)
    const at100 = computeTokenCost(plan({ cacheHitRate: 100 }), models)
    expect(over.inputCost).toBeCloseTo(at100.inputCost, 6)

    const under = computeTokenCost(plan({ cacheHitRate: -20 }), models)
    const at0 = computeTokenCost(plan({ cacheHitRate: 0 }), models)
    expect(under.inputCost).toBeCloseTo(at0.inputCost, 6)
  })

  it('uses the custom rate when the model is custom, ignoring the table', () => {
    const t = computeTokenCost(
      plan({ modelId: 'custom', customInputPerM: 1, customOutputPerM: 2 }),
      models,
    )
    expect(t.inputPerM).toBe(1)
    expect(t.outputPerM).toBe(2)
    expect(t.inputCost).toBeCloseTo(1_000, 6)
    expect(t.outputCost).toBeCloseTo(200, 6)
  })

  it('falls back to zero for an unknown model rather than producing NaN', () => {
    const t = computeTokenCost(plan({ modelId: 'nope' }), models)
    expect(t.annual).toBe(0)
    expect(Number.isNaN(t.annual)).toBe(false)
  })

  it('does not divide by zero when there are no requests', () => {
    const t = computeTokenCost(plan({ requestsPerDay: 0 }), models)
    expect(t.perRequest).toBe(0)
    expect(t.perThousandRequests).toBe(0)
  })

  it('derives per-thousand as a thousand times per-request', () => {
    const t = computeTokenCost(plan({ overheadPct: 25 }), models)
    expect(t.perThousandRequests).toBeCloseTo(t.perRequest * 1000, 9)
  })
})

/* ------------------------------------------------------------------ */
/* Decision rollup and readiness                                       */
/* ------------------------------------------------------------------ */

describe('rollupDecisions', () => {
  it('ignores rows that are not selected', () => {
    const doc = createDoc()
    doc.decisions[0].buildCost = 999
    expect(rollupDecisions(doc.decisions).selectedCount).toBe(0)
    expect(rollupDecisions(doc.decisions).buildCost).toBe(0)
  })

  it('averages only scored cells, so unscored dimensions do not drag it down', () => {
    const doc = createDoc()
    const row = doc.decisions[0]
    row.selected = true
    row.risks = { ...row.risks, operational: 4, legal: 2 }
    const roll = rollupDecisions(doc.decisions)
    expect(roll.scoredCells).toBe(2)
    expect(roll.averageRisk).toBe(3)
    expect(roll.peakRisk).toBe(4)
  })
})

describe('findGaps', () => {
  it('blocks an empty document on title, proposal, costs and benefits', () => {
    const doc = createDoc()
    const ids = findGaps(doc, computeResults(doc))
      .filter((g) => g.severity === 'blocker')
      .map((g) => g.id)
    expect(ids).toContain('title')
    expect(ids).toContain('proposal')
    expect(ids).toContain('costs')
    expect(ids).toContain('benefits')
  })

  it('raises no blockers on the worked example', () => {
    const doc = createSampleDoc()
    const blockers = findGaps(doc, computeResults(doc)).filter((g) => g.severity === 'blocker')
    expect(blockers).toEqual([])
  })

  it('warns when a benefit carries money but no justification', () => {
    const doc = createSampleDoc()
    doc.benefits[0].note = ''
    const ids = findGaps(doc, computeResults(doc)).map((g) => g.id)
    expect(ids).toContain('justify')
  })

  it('warns when the case never breaks even', () => {
    const doc = createSampleDoc()
    doc.costs[0].oneTime = 99_000_000
    const ids = findGaps(doc, computeResults(doc)).map((g) => g.id)
    expect(ids).toContain('payback')
  })
})
