import { describe, expect, it } from 'vitest'
import { assumptionsList } from '../assumptions'
import { createDoc, createSampleDoc } from '../defaults'

const valueOf = (doc: ReturnType<typeof createDoc>, label: string) =>
  assumptionsList(doc).find((a) => a.label === label)?.value ?? ''

describe('assumptionsList', () => {
  it('lists the conventions the figures rest on, in a stable order', () => {
    expect(assumptionsList(createSampleDoc()).map((a) => a.label)).toEqual([
      'Horizon',
      'Spreading',
      'Discount rate',
      'NPV timing',
      'IRR',
      'ROI',
      'Payback',
      'Currency',
    ])
  })

  it('never produces an empty statement', () => {
    for (const a of assumptionsList(createDoc())) {
      expect(a.value.trim().length).toBeGreaterThan(10)
    }
  })

  it('states the horizon from the project start date', () => {
    const doc = createSampleDoc()
    doc.project.startDate = '2027-03-01'
    expect(valueOf(doc, 'Horizon')).toContain('Year 1 (2027)')
    expect(valueOf(doc, 'Horizon')).toContain('Year 5 (2031)')
  })

  it('reflects the discount rate in force, clamped to the allowed range', () => {
    const doc = createSampleDoc()
    doc.project.discountRate = 12
    expect(valueOf(doc, 'Discount rate')).toContain('12%')
    doc.project.discountRate = 250
    expect(valueOf(doc, 'Discount rate')).toContain('100%')
  })

  it("describes 'today' timing by default and says Excel will differ", () => {
    const v = valueOf(createSampleDoc(), 'NPV timing')
    expect(v).toContain('Year 1 = today')
    expect(v).toContain('not discounted')
    expect(v).toContain('Excel')
  })

  it("describes 'year-end' timing when it is chosen", () => {
    const doc = createSampleDoc()
    doc.project.npvTiming = 'year-end'
    const v = valueOf(doc, 'NPV timing')
    expect(v).toContain('Year-end')
    expect(v).toContain('end of that year')
    expect(v).not.toContain('not discounted')
  })

  it('falls back to today on an unrecognised timing', () => {
    const doc = createSampleDoc()
    doc.project.npvTiming = 'nonsense' as never
    expect(valueOf(doc, 'NPV timing')).toContain('Year 1 = today')
  })

  it('says IRR does not depend on timing', () => {
    expect(valueOf(createSampleDoc(), 'IRR')).toContain('does not depend on NPV timing')
  })

  it('uses the document currency and defaults to USD when it is empty', () => {
    const doc = createSampleDoc()
    doc.project.currency = 'GBP'
    expect(valueOf(doc, 'Currency')).toMatch(/^GBP\./)
    doc.project.currency = ''
    expect(valueOf(doc, 'Currency')).toMatch(/^USD\./)
  })
})
