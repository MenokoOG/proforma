import { describe, expect, it } from 'vitest'
import { computeResults, NPV_TIMING_NOTE } from '../calc'
import { createSampleDoc } from '../defaults'
import { buildCsv, csvCell } from '../export'

/**
 * Anything a user types ends up in the exported CSV. A spreadsheet runs a cell
 * as a formula when its text starts with = + - or @, so those cells must be
 * written as text.
 */
describe('csvCell', () => {
  it.each(['=1+1', '+1', '-2', '@SUM(A1)', '=HYPERLINK("http://example.com","x")'])(
    'writes %s as text, not a formula',
    (text) => {
      expect(csvCell(text).replace(/^"/, '').startsWith("'")).toBe(true)
    },
  )

  it('also guards a cell that starts with a tab or carriage return', () => {
    expect(csvCell('\t=1+1').replace(/^"/, '').startsWith("'")).toBe(true)
    expect(csvCell('\r=1+1').replace(/^"/, '').startsWith("'")).toBe(true)
  })

  it('still quotes a guarded cell that contains a comma or a quote', () => {
    expect(csvCell('=a,b')).toBe(`"'=a,b"`)
    expect(csvCell('=say "hi"')).toBe(`"'=say ""hi"""`)
  })

  it('leaves real numbers alone, including negatives', () => {
    expect(csvCell(-5)).toBe('-5')
    expect(csvCell(0.23)).toBe('0.23')
    expect(csvCell(1_230_000)).toBe('1230000')
  })

  it('leaves ordinary text alone', () => {
    expect(csvCell('Hello')).toBe('Hello')
    expect(csvCell('n/a')).toBe('n/a')
    expect(csvCell('Year 2 - 5')).toBe('Year 2 - 5')
  })

  it('turns null and undefined into an empty cell', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
})

describe('buildCsv', () => {
  const now = new Date('2026-10-06T12:00:00.000Z')

  it('writes user-typed formulas as text, wherever they appear', () => {
    const doc = createSampleDoc()
    doc.project.sponsors = '=cmd|calc'
    doc.project.proposers = '+SUM(1,2)'
    doc.costs[0] = { ...doc.costs[0], note: '@evil' }
    const csv = buildCsv(doc, computeResults(doc), now)

    expect(csv).not.toMatch(/(^|,|\n)=cmd/)
    expect(csv).not.toMatch(/(^|,|\n)\+SUM/)
    expect(csv).not.toMatch(/(^|,|\n)@evil/)
    expect(csv).toContain("'=cmd|calc")
  })

  it('keeps the headline figures numeric', () => {
    const doc = createSampleDoc()
    const csv = buildCsv(doc, computeResults(doc), now)
    expect(csv).toContain('Net position,1230000')
  })

  it('states how NPV is timed', () => {
    const doc = createSampleDoc()
    const csv = buildCsv(doc, computeResults(doc), now)
    expect(csv).toContain('NPV timing')
    expect(csv).toContain('Year 1 is treated as today')
    expect(NPV_TIMING_NOTE).toContain('Year 1 is treated as today')
  })

  it('does not include the byte-order mark (the download adds it)', () => {
    const doc = createSampleDoc()
    expect(buildCsv(doc, computeResults(doc), now).charCodeAt(0)).not.toBe(0xfeff)
  })

  it('is deterministic for a given clock', () => {
    const doc = createSampleDoc()
    const r = computeResults(doc)
    expect(buildCsv(doc, r, now)).toBe(buildCsv(doc, r, now))
    expect(buildCsv(doc, r, now)).toContain('2026-10-06T12:00:00.000Z')
  })
})
