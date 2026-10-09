import type { LineItem } from './types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** A date field is kept only if it is a real calendar date in YYYY-MM-DD form. */
export function cleanDate(v: unknown): string {
  if (typeof v !== 'string' || !ISO_DATE.test(v)) return ''
  const d = new Date(`${v}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? '' : v
}

/**
 * The provenance fields of a line, cleaned for an untrusted file. Empty fields
 * are left out so that a document with no provenance stays byte-for-byte the same.
 */
export function cleanProvenance(raw: unknown): Pick<LineItem, 'owner' | 'source' | 'asOf'> {
  const s = (raw ?? {}) as Record<string, unknown>
  const out: Pick<LineItem, 'owner' | 'source' | 'asOf'> = {}
  if (typeof s.owner === 'string' && s.owner.trim()) out.owner = s.owner
  if (typeof s.source === 'string' && s.source.trim()) out.source = s.source
  const asOf = cleanDate(s.asOf)
  if (asOf) out.asOf = asOf
  return out
}

/** True when all three provenance fields are filled in. */
export function hasFullProvenance(item: LineItem): boolean {
  return Boolean(item.owner?.trim() && item.source?.trim() && cleanDate(item.asOf))
}

/** "Owner: X. Source: Y. As of: Z." with only the fields that are present. */
export function provenanceText(item: LineItem): string {
  const parts: string[] = []
  if (item.owner?.trim()) parts.push(`Owner: ${item.owner.trim()}`)
  if (item.source?.trim()) parts.push(`Source: ${item.source.trim()}`)
  if (cleanDate(item.asOf)) parts.push(`As of: ${item.asOf}`)
  return parts.map((p) => `${p}.`).join(' ')
}

/** True when the confirmation date is more than 12 months before the start date. */
export function isStale(item: LineItem, startDate: string): boolean {
  const asOf = cleanDate(item.asOf)
  const start = cleanDate(startDate)
  if (!asOf || !start) return false
  const cutoff = new Date(`${start}T00:00:00Z`)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1)
  return new Date(`${asOf}T00:00:00Z`).getTime() < cutoff.getTime()
}
