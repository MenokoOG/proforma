import { describe, expect, it } from 'vitest'
import { createDoc, createSampleDoc, DOC_VERSION } from '../defaults'
import { hydrate } from '../storage'

/**
 * `hydrate` is the forward-compatibility seam: a document saved by an older
 * build has to open in a newer one. It must never throw, and it must never
 * silently drop a value the user typed.
 */
describe('hydrate', () => {
  it('round-trips a full document through JSON without losing anything', () => {
    const original = createSampleDoc()
    const restored = hydrate(JSON.parse(JSON.stringify(original)))

    expect(restored.project).toEqual(original.project)
    expect(restored.stakeholders).toEqual(original.stakeholders)
    expect(restored.useCase).toEqual(original.useCase)
    expect(restored.tokenPlan).toEqual(original.tokenPlan)
    expect(restored.costs).toEqual(original.costs)
    expect(restored.benefits).toEqual(original.benefits)
    expect(restored.mitigations).toEqual(original.mitigations)
    expect(restored.phases).toEqual(original.phases)
  })

  it('preserves the figures that drive the projection', () => {
    const original = createSampleDoc()
    const restored = hydrate(JSON.parse(JSON.stringify(original)))
    const totals = (d: typeof original) => d.costs.map((c) => [c.id, c.oneTime, c.annual, c.note])
    expect(totals(restored)).toEqual(totals(original))
  })

  it('stamps the current document version regardless of what came in', () => {
    expect(hydrate({ version: 0 }).version).toBe(DOC_VERSION)
  })

  /* ---- tolerance for missing keys ---- */

  it('returns a fresh document for null, undefined and non-objects', () => {
    for (const junk of [null, undefined, 42, 'nope', true]) {
      expect(() => hydrate(junk)).not.toThrow()
      expect(hydrate(junk).costs).toEqual(createDoc().costs)
    }
  })

  it('accepts an empty object and fills every key from defaults', () => {
    const base = createDoc()
    const d = hydrate({})
    expect(d.costs).toEqual(base.costs)
    expect(d.benefits).toEqual(base.benefits)
    expect(d.mitigations).toEqual(base.mitigations)
    expect(d.decisions).toHaveLength(base.decisions.length)
    expect(d.phases).toHaveLength(base.phases.length)
  })

  it('keeps supplied keys and defaults the absent ones', () => {
    const d = hydrate({ project: { title: 'Partial doc' } })
    expect(d.project.title).toBe('Partial doc')
    expect(d.project.discountRate).toBe(createDoc().project.discountRate)
    expect(d.project.currency).toBe('USD')
  })

  it('restores a line item that the saved document omitted entirely', () => {
    const saved = JSON.parse(JSON.stringify(createSampleDoc()))
    const dropped = saved.costs.pop()
    const d = hydrate(saved)
    expect(d.costs.some((c) => c.id === dropped.id)).toBe(true)
    // Restored at its default of zero, not carrying a stale figure.
    expect(d.costs.find((c) => c.id === dropped.id)?.oneTime).toBe(0)
  })

  it('coerces a non-numeric saved amount to zero rather than NaN', () => {
    const saved = JSON.parse(JSON.stringify(createDoc()))
    saved.costs[0].oneTime = 'not a number'
    saved.costs[0].annual = null
    const d = hydrate(saved)
    expect(d.costs[0].oneTime).toBe(0)
    expect(d.costs[0].annual).toBe(0)
  })

  it('preserves a line the user added themselves', () => {
    const saved = JSON.parse(JSON.stringify(createDoc()))
    saved.costs.push({
      id: 'custom-contingency',
      label: 'Contingency',
      hint: '',
      oneTime: 25_000,
      annual: 5_000,
      note: 'Board asked for it',
      custom: true,
    })
    const restored = hydrate(saved).costs.find((c) => c.id === 'custom-contingency')
    expect(restored).toBeDefined()
    expect(restored?.oneTime).toBe(25_000)
    expect(restored?.annual).toBe(5_000)
    expect(restored?.note).toBe('Board asked for it')
  })

  it('drops an unknown non-custom line rather than resurrecting a removed one', () => {
    const saved = JSON.parse(JSON.stringify(createDoc()))
    saved.costs.push({ id: 'retired-line', label: 'Retired', oneTime: 1, annual: 1 })
    expect(hydrate(saved).costs.some((c) => c.id === 'retired-line')).toBe(false)
  })

  it('merges saved decision risk scores over the current defaults', () => {
    const saved = JSON.parse(JSON.stringify(createDoc()))
    saved.decisions[0].selected = true
    saved.decisions[0].risks = { operational: 4 }
    const row = hydrate(saved).decisions[0]
    expect(row.selected).toBe(true)
    expect(row.risks.operational).toBe(4)
    // Dimensions the saved doc did not carry still exist, at zero.
    expect(row.risks.legal).toBe(0)
  })

  it('rebuilds phases when the saved array is the wrong length', () => {
    const saved = JSON.parse(JSON.stringify(createDoc()))
    saved.phases = [{ date: '2026-01-31', done: [], notes: '' }]
    expect(hydrate(saved).phases).toHaveLength(createDoc().phases.length)
  })

  it('never throws on a deeply malformed document', () => {
    expect(() =>
      hydrate({
        project: null,
        costs: 'not an array',
        benefits: 42,
        decisions: [null, undefined],
        phases: {},
        stakeholders: undefined,
      }),
    ).not.toThrow()
  })
})
