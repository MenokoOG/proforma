import { describe, expect, it } from 'vitest'
import { computeResults, findGaps } from '../calc'
import { createSampleDoc } from '../defaults'
import { buildCsv, buildMarkdown } from '../export'
import { cleanDate, isStale, provenanceText } from '../provenance'
import { hydrate } from '../storage'

const FILLED = { owner: 'J. Ruiz, Finance', source: 'Q3 helpdesk report', asOf: '2026-09-15' }

const gapIds = (doc: ReturnType<typeof createSampleDoc>) =>
  findGaps(doc, computeResults(doc)).map((g) => g.id)

describe('provenance fields survive save and load', () => {
  it('keeps owner, source and date on a built-in line through JSON', () => {
    const doc = createSampleDoc()
    Object.assign(doc.benefits[0], FILLED)
    const restored = hydrate(JSON.parse(JSON.stringify(doc)))
    expect(restored.benefits[0]).toMatchObject(FILLED)
  })

  it('keeps them on a custom line', () => {
    const doc = createSampleDoc()
    doc.benefits.push({
      id: 'custom-benefits-x',
      label: 'Extra',
      hint: '',
      oneTime: 0,
      annual: 1000,
      note: '',
      custom: true,
      ...FILLED,
    })
    const restored = hydrate(JSON.parse(JSON.stringify(doc)))
    expect(restored.benefits.find((b) => b.id === 'custom-benefits-x')).toMatchObject(FILLED)
  })

  it('leaves a document without provenance unchanged', () => {
    const doc = createSampleDoc()
    const restored = hydrate(JSON.parse(JSON.stringify(doc)))
    expect(restored.benefits[0]).not.toHaveProperty('owner')
    expect(restored.benefits[0]).not.toHaveProperty('asOf')
  })

  it('drops a date that is not a real calendar date', () => {
    const doc = createSampleDoc()
    Object.assign(doc.benefits[0], { ...FILLED, asOf: '2026-02-31' })
    const restored = hydrate(JSON.parse(JSON.stringify(doc)))
    expect(restored.benefits[0].asOf).toBeUndefined()
    expect(cleanDate('not a date')).toBe('')
  })

  it('ignores provenance fields of the wrong type', () => {
    const doc = createSampleDoc()
    const raw = JSON.parse(JSON.stringify(doc))
    raw.benefits[0].owner = { x: 1 }
    raw.benefits[0].source = 42
    const restored = hydrate(raw)
    expect(restored.benefits[0].owner).toBeUndefined()
    expect(restored.benefits[0].source).toBeUndefined()
  })
})

describe('readiness: provenance and stale figures', () => {
  it('warns on the bare worked example', () => {
    expect(gapIds(createSampleDoc())).toContain('provenance')
  })

  it('stops warning once every funded benefit line has all three fields', () => {
    const doc = createSampleDoc()
    for (const b of doc.benefits) Object.assign(b, FILLED)
    expect(gapIds(doc)).not.toContain('provenance')
  })

  it('still warns when one field is missing', () => {
    const doc = createSampleDoc()
    for (const b of doc.benefits) Object.assign(b, FILLED)
    const funded = doc.benefits.find((b) => b.oneTime + b.annual > 0)!
    funded.source = ''
    expect(gapIds(doc)).toContain('provenance')
  })

  it('ignores benefit lines with no money, and cost lines', () => {
    const doc = createSampleDoc()
    for (const b of doc.benefits) Object.assign(b, FILLED)
    doc.benefits.push({
      id: 'custom-benefits-empty',
      label: 'Empty',
      hint: '',
      oneTime: 0,
      annual: 0,
      note: '',
      custom: true,
    })
    expect(gapIds(doc)).not.toContain('provenance')
  })

  it('warns when a figure is older than 12 months before the start date', () => {
    const doc = createSampleDoc()
    for (const b of doc.benefits) Object.assign(b, FILLED)
    doc.project.startDate = '2027-01-01'
    doc.benefits[0].asOf = '2025-12-31'
    expect(gapIds(doc)).toContain('stale')
    doc.benefits[0].asOf = '2026-01-01'
    expect(gapIds(doc)).not.toContain('stale')
  })

  it('does not move the regression figures', () => {
    const doc = createSampleDoc()
    Object.assign(doc.benefits[0], FILLED)
    const r = computeResults(doc)
    expect(r.totalNet).toBe(1_230_000)
    expect(r.paybackYear).toBe(4)
  })
})

describe('provenance text and exports', () => {
  it('writes only the fields that are present', () => {
    const doc = createSampleDoc()
    expect(provenanceText({ ...doc.benefits[0], owner: 'A', source: '', asOf: '' })).toBe(
      'Owner: A.',
    )
    expect(provenanceText({ ...doc.benefits[0], ...FILLED })).toBe(
      'Owner: J. Ruiz, Finance. Source: Q3 helpdesk report. As of: 2026-09-15.',
    )
  })

  it('treats an unparseable start date as not stale', () => {
    const doc = createSampleDoc()
    expect(isStale({ ...doc.benefits[0], asOf: '2020-01-01' }, 'soon')).toBe(false)
  })

  it('puts provenance in the Markdown justifications', () => {
    const doc = createSampleDoc()
    Object.assign(doc.benefits[0], FILLED)
    const md = buildMarkdown(doc, computeResults(doc))
    expect(md).toContain(
      'Owner: J. Ruiz, Finance. Source: Q3 helpdesk report. As of: 2026-09-15.',
    )
  })

  it('adds Owner, Source and As of columns to the CSV, aligned with the totals', () => {
    const doc = createSampleDoc()
    Object.assign(doc.benefits[0], FILLED)
    const csv = buildCsv(doc, computeResults(doc), new Date('2026-10-06T12:00:00.000Z'))
    const lines = csv.split('\r\n')
    const header = lines.find((l) => l.startsWith('Item,'))!
    expect(header).toContain('Item,Description,Owner,Source,As of,One-time,Annual')
    expect(csv).toContain('"J. Ruiz, Finance"')
    const cols = (l: string) => l.split(',').length
    const total = lines.find((l) => l.startsWith('TOTAL BENEFITS'))!
    expect(cols(total)).toBe(cols(header))
  })

  it('writes a formula-looking owner as text', () => {
    const doc = createSampleDoc()
    doc.benefits[0].owner = '=cmd|calc'
    const csv = buildCsv(doc, computeResults(doc))
    expect(csv).not.toMatch(/(^|,|\n)=cmd/)
  })
})
