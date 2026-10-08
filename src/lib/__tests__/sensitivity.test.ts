import { describe, expect, it } from 'vitest'
import { computeResults } from '../calc'
import { createDoc, createSampleDoc } from '../defaults'
import {
  SENSITIVITY_STEPS,
  benefitCushion,
  changeLabel,
  computeSensitivity,
  cushionSentence,
  scaleDoc,
} from '../sensitivity'

const rowAt = <T extends { changePct: number }>(rows: T[], pct: number): T =>
  rows.find((r) => r.changePct === pct)!

describe('computeSensitivity', () => {
  const doc = createSampleDoc()
  const base = computeResults(doc)
  const [benefits, outlay] = computeSensitivity(doc)

  it('offers a benefits table and a costs-and-mitigation table', () => {
    expect(benefits.driver).toBe('benefits')
    expect(outlay.driver).toBe('outlay')
    expect(benefits.rows.map((r) => r.changePct)).toEqual([...SENSITIVITY_STEPS])
  })

  it('reproduces the headline figures at zero change', () => {
    for (const table of [benefits, outlay]) {
      const r = rowAt(table.rows, 0)
      expect(r.totalNet).toBe(base.totalNet)
      expect(r.npv).toBeCloseTo(base.npv, 6)
      expect(r.paybackYear).toBe(base.paybackYear)
    }
  })

  it('moves net by exactly the share of benefit that changed', () => {
    expect(rowAt(benefits.rows, 10).totalNet).toBeCloseTo(
      base.totalNet + 0.1 * base.totalBenefit,
      4,
    )
    expect(rowAt(benefits.rows, -20).totalNet).toBeCloseTo(
      base.totalNet - 0.2 * base.totalBenefit,
      4,
    )
  })

  it('moves net by the share of outlay that changed', () => {
    const outlayTotal = base.totalCost + base.totalMitigation
    expect(rowAt(outlay.rows, 10).totalNet).toBeCloseTo(base.totalNet - 0.1 * outlayTotal, 4)
  })

  it('pushes the worked example past break-even when benefits fall 20%', () => {
    // Net 1,230,000 on benefit 6,850,000: a 20% shortfall (1,370,000) loses money.
    expect(rowAt(benefits.rows, -20).totalNet).toBeLessThan(0)
    expect(rowAt(benefits.rows, -20).paybackYear).toBeNull()
    expect(rowAt(benefits.rows, -10).totalNet).toBeGreaterThan(0)
  })

  it('does not change the document it was given', () => {
    const before = JSON.stringify(doc)
    computeSensitivity(doc)
    scaleDoc(doc, 'benefits', -50)
    expect(JSON.stringify(doc)).toBe(before)
  })
})

describe('benefitCushion', () => {
  it('is net over benefit for the worked example', () => {
    const r = computeResults(createSampleDoc())
    expect(benefitCushion(r)).toBeCloseTo(1_230_000 / 6_850_000, 10)
  })

  it('brings net to zero when benefits move by that fraction', () => {
    const doc = createSampleDoc()
    const cushion = benefitCushion(computeResults(doc))!
    const moved = computeResults(scaleDoc(doc, 'benefits', cushion * -100))
    expect(moved.totalNet).toBeCloseTo(0, 4)
  })

  it('is negative when the case already loses money', () => {
    const doc = createSampleDoc()
    const losing = computeResults(scaleDoc(doc, 'benefits', -50))
    expect(benefitCushion(losing)!).toBeLessThan(0)
  })

  it('is null when there is no benefit', () => {
    expect(benefitCushion(computeResults(createDoc()))).toBeNull()
  })
})

describe('changeLabel', () => {
  it('signs the change and names the base case', () => {
    expect(changeLabel(0)).toBe('Base case')
    expect(changeLabel(10)).toBe('+10%')
    expect(changeLabel(-20)).toBe('−20%')
  })
})

describe('cushionSentence', () => {
  it('says how far benefits can fall for the worked example', () => {
    const r = computeResults(createSampleDoc())
    expect(cushionSentence(r)).toBe(
      'Benefits can fall 18.0% before the five-year net position reaches zero.',
    )
  })

  it('says how far benefits must rise when the case loses money', () => {
    const r = computeResults(scaleDoc(createSampleDoc(), 'benefits', -50))
    expect(cushionSentence(r)).toMatch(/^Benefits would need to rise \d+\.\d% for the five-year/)
  })

  it('is null when there is no benefit', () => {
    expect(cushionSentence(computeResults(createDoc()))).toBeNull()
  })
})
