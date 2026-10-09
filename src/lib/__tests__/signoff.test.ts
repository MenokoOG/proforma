import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { computeResults, findGaps } from '../calc'
import { createDoc, createSampleDoc } from '../defaults'
import { buildCsv, buildMarkdown } from '../export'
import { sha256 } from '../sha256'
import {
  buildSignoff,
  cleanSignoffs,
  fingerprint,
  signoffLine,
  signoffProblem,
  signoffStatus,
} from '../signoff'
import { hydrate } from '../storage'
import type { Doc, SignoffDecision } from '../types'

const record = (doc: Doc, decision: SignoffDecision = 'approved', name = 'J. Ruiz'): Doc => ({
  ...doc,
  signoffs: [
    ...(doc.signoffs ?? []),
    buildSignoff(doc, computeResults(doc), { name, role: 'Finance', decision, conditions: 'x' }),
  ],
})

const gapIds = (doc: Doc) => findGaps(doc, computeResults(doc)).map((g) => g.id)

describe('sha256', () => {
  it.each([
    '',
    'abc',
    'a'.repeat(55),
    'a'.repeat(56),
    'a'.repeat(63),
    'a'.repeat(64),
    'a'.repeat(1000),
    'Zoë, 日本語, 🙂',
  ])('matches Node for %#', (text) => {
    expect(sha256(text)).toBe(createHash('sha256').update(text, 'utf8').digest('hex'))
  })
})

describe('fingerprint', () => {
  it('is 64 hex characters and does not change between calls', () => {
    const doc = createSampleDoc()
    expect(fingerprint(doc)).toMatch(/^[0-9a-f]{64}$/)
    expect(fingerprint(doc)).toBe(fingerprint(doc))
  })

  it('ignores the roadmap, the save time and the version', () => {
    const doc = createSampleDoc()
    const before = fingerprint(doc)
    const changed: Doc = {
      ...doc,
      version: 99,
      updatedAt: '2030-01-01T00:00:00.000Z',
      phases: doc.phases.map((p) => ({ ...p, done: ['0:0:0'], notes: 'ticked later' })),
    }
    expect(fingerprint(changed)).toBe(before)
  })

  it.each([
    ['a cost amount', (d: Doc) => void (d.costs[0].oneTime += 1)],
    ['a benefit note', (d: Doc) => void (d.benefits[0].note += ' more')],
    ['the title', (d: Doc) => void (d.project.title += '!')],
    ['the discount rate', (d: Doc) => void (d.project.discountRate += 1)],
    ['a stakeholder', (d: Doc) => void (d.stakeholders.cfo = 'Someone')],
    ['a benefit owner', (d: Doc) => void (d.benefits[0].owner = 'A. Person')],
    ['a decision', (d: Doc) => void (d.decisions[0].selected = !d.decisions[0].selected)],
    ['the token plan', (d: Doc) => void (d.tokenPlan.requestsPerDay += 1)],
  ])('changes when %s changes', (_what, edit) => {
    const doc = createSampleDoc()
    const before = fingerprint(doc)
    edit(doc)
    expect(fingerprint(doc)).not.toBe(before)
  })

  it('treats empty and absent text as the same', () => {
    const a = createSampleDoc()
    const b = createSampleDoc()
    b.benefits[0].owner = ''
    b.benefits[0].source = '   '
    expect(fingerprint(b)).toBe(fingerprint(a))
  })

  it('does not depend on key order', () => {
    const doc = createSampleDoc()
    const reordered = JSON.parse(JSON.stringify(doc)) as Doc
    reordered.project = Object.fromEntries(Object.entries(reordered.project).reverse()) as never
    expect(fingerprint(reordered)).toBe(fingerprint(doc))
  })

  it('survives a save and load, including cleared provenance fields', () => {
    const doc = createSampleDoc()
    Object.assign(doc.benefits[0], { owner: 'A', source: 'B', asOf: '2026-09-01' })
    doc.benefits[1].owner = ''
    doc.costs[0].note = '  '
    const restored = hydrate(JSON.parse(JSON.stringify(doc)))
    expect(fingerprint(restored)).toBe(fingerprint(doc))
  })
})

describe('sign-off status', () => {
  it('is none until someone records one', () => {
    expect(signoffStatus(createSampleDoc()).state).toBe('none')
  })

  it('is current right after recording', () => {
    expect(signoffStatus(record(createSampleDoc())).state).toBe('current')
  })

  it('goes out of date when a figure is edited, and says so on the entry', () => {
    const doc = record(createSampleDoc())
    doc.costs[0].oneTime += 1000
    const status = signoffStatus(doc)
    expect(status.state).toBe('outdated')
    expect(signoffLine(status.latest!, status.fingerprint)).toContain('Out of date')
  })

  it('stays current when a roadmap deliverable is ticked afterwards', () => {
    const doc = record(createSampleDoc())
    doc.phases = doc.phases.map((p, i) => (i === 0 ? { ...p, done: [...p.done, '0:0:0'] } : p))
    expect(signoffStatus(doc).state).toBe('current')
  })

  it('is made current again by a later entry on the changed case', () => {
    const doc = record(createSampleDoc())
    doc.costs[0].oneTime += 1000
    const again = record(doc, 'approved', 'M. Okafor')
    expect(signoffStatus(again).state).toBe('current')
    expect(again.signoffs).toHaveLength(2)
  })

  it('records the figures that were on screen', () => {
    const doc = createSampleDoc()
    const entry = buildSignoff(doc, computeResults(doc), {
      name: 'J. Ruiz',
      role: 'Finance',
      decision: 'approved',
      conditions: 'ignored for an unconditional approval',
    })
    expect(entry.figures).toEqual({
      totalNet: 1_230_000,
      npv: expect.any(Number),
      paybackYear: 4,
    })
    expect(entry.conditions).toBe('')
  })
})

describe('sign-off input', () => {
  const ok = { name: 'A', role: 'B', decision: 'approved' as const, conditions: '' }
  it('needs a name and a role', () => {
    expect(signoffProblem(ok)).toBeNull()
    expect(signoffProblem({ ...ok, name: ' ' })).toMatch(/name/)
    expect(signoffProblem({ ...ok, role: '' })).toMatch(/role/)
  })
  it('needs conditions when approved with conditions, but not for a decline', () => {
    expect(signoffProblem({ ...ok, decision: 'approved-with-conditions' })).toMatch(/conditions/)
    expect(signoffProblem({ ...ok, decision: 'declined' })).toBeNull()
  })
})

describe('sign-offs survive save and load', () => {
  it('round-trips through JSON', () => {
    const doc = record(record(createSampleDoc()), 'declined', 'M. Okafor')
    const restored = hydrate(JSON.parse(JSON.stringify(doc)))
    expect(restored.signoffs).toEqual(doc.signoffs)
    expect(signoffStatus(restored).state).toBe('current')
  })

  it('adds no key to a case without any', () => {
    const restored = hydrate(JSON.parse(JSON.stringify(createSampleDoc())))
    expect(restored).not.toHaveProperty('signoffs')
    expect(hydrate(null)).not.toHaveProperty('signoffs')
  })

  it('drops malformed entries and keeps the good ones', () => {
    const good = record(createSampleDoc()).signoffs![0]
    const raw = [
      good,
      null,
      'text',
      { ...good, name: '' },
      { ...good, decision: 'maybe' },
      { ...good, at: 'not a date' },
      { ...good, fingerprint: 'abc' },
      { ...good, fingerprint: 'G'.repeat(64) },
    ]
    expect(cleanSignoffs(raw)).toEqual([good])
    expect(cleanSignoffs('nope')).toEqual([])
  })

  it('repairs bad figures instead of failing', () => {
    const good = record(createSampleDoc()).signoffs![0]
    const [e] = cleanSignoffs([
      { ...good, figures: { totalNet: 'x', npv: null, paybackYear: 2.5 } },
    ])
    expect(e.figures).toEqual({ totalNet: 0, npv: 0, paybackYear: null })
  })

  it('caps the log at 200 entries', () => {
    const good = record(createSampleDoc()).signoffs![0]
    expect(cleanSignoffs(Array.from({ length: 250 }, () => good))).toHaveLength(200)
  })
})

describe('readiness: sign-off', () => {
  it('warns when nobody has signed off', () => {
    expect(gapIds(createSampleDoc())).toContain('signoff')
  })

  it('is quiet when the latest sign-off applies', () => {
    const ids = gapIds(record(createSampleDoc()))
    expect(ids).not.toContain('signoff')
    expect(ids).not.toContain('signoff-stale')
  })

  it('warns when the case changed after the latest sign-off', () => {
    const doc = record(createSampleDoc())
    doc.benefits[0].annual += 1
    expect(gapIds(doc)).toContain('signoff-stale')
  })

  it('never blocks, and leaves the regression figures alone', () => {
    const doc = createSampleDoc()
    const blockers = findGaps(doc, computeResults(doc)).filter((g) => g.severity === 'blocker')
    expect(blockers).toEqual([])
    const r = computeResults(record(doc))
    expect(r.totalNet).toBe(1_230_000)
    expect(r.paybackYear).toBe(4)
    expect(createDoc().signoffs).toBeUndefined()
  })
})

describe('sign-off in the exports', () => {
  const now = new Date('2026-10-09T12:00:00.000Z')

  it('writes entries, the fingerprint and the disclaimer to Markdown', () => {
    const doc = record(createSampleDoc())
    const md = buildMarkdown(doc, computeResults(doc), now)
    expect(md).toContain('## Sign-off')
    expect(md).toContain('J. Ruiz (Finance), Approved')
    expect(md).toContain(`\`${fingerprint(doc)}\``)
    expect(md).toContain('not authenticated signatures')
  })

  it('says so when there is none', () => {
    const doc = createSampleDoc()
    expect(buildMarkdown(doc, computeResults(doc), now)).toContain('No sign-off recorded.')
    expect(buildCsv(doc, computeResults(doc), now)).toContain('Status,No sign-off recorded')
  })

  it('marks an out-of-date entry in both formats', () => {
    const doc = record(createSampleDoc())
    doc.costs[0].oneTime += 1
    expect(buildMarkdown(doc, computeResults(doc), now)).toContain('Out of date')
    expect(buildCsv(doc, computeResults(doc), now)).toMatch(/,No,/)
  })

  it('writes entries to the CSV with the fingerprint, and keeps formulas as text', () => {
    const doc = record(createSampleDoc(), 'approved', '=cmd|calc')
    const csv = buildCsv(doc, computeResults(doc), now)
    expect(csv).toContain('SIGN-OFF')
    expect(csv).toContain(`Case fingerprint (SHA-256),${fingerprint(doc)}`)
    expect(csv).not.toMatch(/(^|,|\n)=cmd/)
  })
})
