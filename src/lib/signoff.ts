import { sha256 } from './sha256'
import type { Doc, Results, Signoff, SignoffDecision } from './types'

/**
 * The part of a case a sign-off covers. Delivery tracking (`phases`) is left
 * out on purpose: roadmap ticks keep changing after approval, and ticking a
 * deliverable should not void it. `updatedAt` and `version` are bookkeeping.
 */
const COVERED = [
  'project',
  'stakeholders',
  'useCase',
  'decisions',
  'tokenPlan',
  'costs',
  'benefits',
  'mitigations',
] as const

export const DECISION_LABEL: Record<SignoffDecision, string> = {
  approved: 'Approved',
  'approved-with-conditions': 'Approved with conditions',
  declined: 'Declined',
}

const DECISIONS = Object.keys(DECISION_LABEL) as SignoffDecision[]

/** Absent, empty and whitespace-only text all mean "nothing here". */
const isBlank = (v: unknown) => v === undefined || (typeof v === 'string' && v.trim() === '')

/** JSON with sorted keys and blank values dropped, so equal content gives equal text. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (v && typeof v === 'object') {
    const entries = Object.entries(v)
      .filter(([, x]) => !isBlank(x))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`).join(',')}}`
  }
  return JSON.stringify(v) ?? 'null'
}

/** SHA-256 of the covered part of the case. Full 64 hex characters. */
export function fingerprint(doc: Doc): string {
  const covered: Record<string, unknown> = {}
  for (const key of COVERED) covered[key] = doc[key]
  return sha256(canonical(covered))
}

/** The short form shown on screen. */
export const shortId = (fp: string) => fp.slice(0, 8)

export type SignoffState = 'none' | 'current' | 'outdated'

export interface SignoffStatus {
  state: SignoffState
  /** The most recent entry, if any. */
  latest?: Signoff
  /** Fingerprint of the case as it stands now. */
  fingerprint: string
}

export function signoffStatus(doc: Doc): SignoffStatus {
  const fp = fingerprint(doc)
  const latest = doc.signoffs?.[doc.signoffs.length - 1]
  if (!latest) return { state: 'none', fingerprint: fp }
  return { state: latest.fingerprint === fp ? 'current' : 'outdated', latest, fingerprint: fp }
}

export interface SignoffInput {
  name: string
  role: string
  decision: SignoffDecision
  conditions: string
}

/** A message for the form, or null when the input can be recorded. */
export function signoffProblem(input: SignoffInput): string | null {
  if (!input.name.trim()) return 'Enter the name of the person recording this.'
  if (!input.role.trim()) return 'Enter their role.'
  if (input.decision === 'approved-with-conditions' && !input.conditions.trim())
    return 'State the conditions.'
  return null
}

export function buildSignoff(
  doc: Doc,
  results: Results,
  input: SignoffInput,
  now: Date = new Date(),
): Signoff {
  return {
    id: `so-${now.getTime().toString(36)}`,
    name: input.name.trim(),
    role: input.role.trim(),
    decision: input.decision,
    conditions: input.decision === 'approved' ? '' : input.conditions.trim(),
    at: now.toISOString(),
    fingerprint: fingerprint(doc),
    figures: {
      totalNet: results.totalNet,
      npv: results.npv,
      paybackYear: results.paybackYear,
    },
  }
}

/* ---- loading an untrusted file ---- */

const MAX_ENTRIES = 200

function cleanEntry(raw: unknown): Signoff | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  const name = text(s.name).trim()
  const role = text(s.role).trim()
  const decision = DECISIONS.find((d) => d === s.decision)
  const at = text(s.at)
  const fp = text(s.fingerprint)
  if (!name || !role || !decision) return null
  if (Number.isNaN(new Date(at).getTime())) return null
  if (!/^[0-9a-f]{64}$/.test(fp)) return null

  const f = (s.figures ?? {}) as Record<string, unknown>
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
  const payback =
    typeof f.paybackYear === 'number' && Number.isInteger(f.paybackYear) ? f.paybackYear : null

  return {
    id: text(s.id) || `so-${at}`,
    name,
    role,
    decision,
    conditions: text(s.conditions),
    at: new Date(at).toISOString(),
    fingerprint: fp,
    figures: { totalNet: num(f.totalNet), npv: num(f.npv), paybackYear: payback },
  }
}

/** Valid entries only, in file order. Anything malformed is dropped. */
export function cleanSignoffs(raw: unknown): Signoff[] {
  if (!Array.isArray(raw)) return []
  const out: Signoff[] = []
  for (const r of raw.slice(0, MAX_ENTRIES)) {
    const e = cleanEntry(r)
    if (e) out.push(e)
  }
  return out
}

/* ---- text for the exports ---- */

const stamp = (iso: string) => `${iso.slice(0, 16).replace('T', ' ')} UTC`

export const SIGNOFF_DISCLAIMER =
  'Sign-offs are records typed into this tool by the person named. They are not authenticated signatures, and the project file can be edited.'

/** One line per entry: who, what, when, which version of the case. */
export function signoffLine(s: Signoff, currentFingerprint: string): string {
  const parts = [
    `${s.name} (${s.role})`,
    DECISION_LABEL[s.decision],
    stamp(s.at),
    `case ${shortId(s.fingerprint)}`,
  ]
  let line = `${parts.join(', ')}.`
  if (s.conditions.trim()) line += ` Conditions: ${s.conditions.trim()}`
  if (s.fingerprint !== currentFingerprint) line += ' Out of date: the case has changed since.'
  return line
}
