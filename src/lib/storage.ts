import { createDoc, DOC_VERSION, defaultDecisions, defaultPhases } from './defaults'
import type { Doc } from './types'

const KEY = 'proforma.doc.v1'
const THEME_KEY = 'proforma.theme'

/**
 * Merge a loaded document over a fresh one so that documents saved by an older
 * build still open. Missing keys take the current default rather than throwing.
 */
export function hydrate(raw: unknown): Doc {
  const base = createDoc()
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Partial<Doc>

  const decisionsById = new Map(
    (Array.isArray(input.decisions) ? input.decisions : []).map((d) => [d?.id, d]),
  )

  return {
    version: DOC_VERSION,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : base.updatedAt,
    project: { ...base.project, ...(input.project ?? {}) },
    stakeholders: { ...(input.stakeholders ?? {}) },
    useCase: { ...base.useCase, ...(input.useCase ?? {}) },
    decisions: defaultDecisions().map((d) => {
      const saved = decisionsById.get(d.id)
      return saved ? { ...d, ...saved, risks: { ...d.risks, ...(saved.risks ?? {}) } } : d
    }),
    tokenPlan: { ...base.tokenPlan, ...(input.tokenPlan ?? {}) },
    costs: mergeLines(base.costs, input.costs),
    benefits: mergeLines(base.benefits, input.benefits),
    mitigations: mergeLines(base.mitigations, input.mitigations),
    phases: mergePhases(base.phases, input.phases),
  }
}

function mergeLines(base: Doc['costs'], saved: unknown): Doc['costs'] {
  if (!Array.isArray(saved)) return base
  const savedById = new Map(saved.map((l) => [l?.id, l]))
  const merged = base.map((l) => {
    const s = savedById.get(l.id)
    return s ? { ...l, oneTime: +s.oneTime || 0, annual: +s.annual || 0, note: s.note ?? '' } : l
  })
  // Preserve any rows the user added themselves.
  for (const s of saved) {
    if (s?.custom && !merged.some((m) => m.id === s.id)) {
      merged.push({
        id: String(s.id),
        label: String(s.label ?? 'Custom line'),
        hint: String(s.hint ?? ''),
        oneTime: +s.oneTime || 0,
        annual: +s.annual || 0,
        note: String(s.note ?? ''),
        custom: true,
      })
    }
  }
  return merged
}

function mergePhases(base: Doc['phases'], saved: unknown): Doc['phases'] {
  if (!Array.isArray(saved) || saved.length !== base.length) return defaultPhases()
  return base.map((p, i) => ({
    date: typeof saved[i]?.date === 'string' ? saved[i].date : p.date,
    done: Array.isArray(saved[i]?.done) ? saved[i].done.map(String) : [],
    notes: typeof saved[i]?.notes === 'string' ? saved[i].notes : '',
  }))
}

export function load(): Doc | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return hydrate(JSON.parse(raw))
  } catch {
    return null
  }
}

export function save(doc: Doc): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc))
  } catch {
    // Private browsing or a full quota. The app keeps working in memory.
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/* ---- theme ---- */

export type Theme = 'system' | 'light' | 'dark'

export function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' || t === 'system' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}
