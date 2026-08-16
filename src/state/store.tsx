import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { computeResults, computeTokenCost, findGaps } from '../lib/calc'
import { createDoc, createSampleDoc } from '../lib/defaults'
import * as storage from '../lib/storage'
import type { Doc, LineItem, Results } from '../lib/types'
import { TOKEN_MODELS } from '../data/models'

type LineBucket = 'costs' | 'benefits' | 'mitigations'

type Action =
  | { type: 'replace'; doc: Doc }
  | { type: 'reset' }
  | { type: 'sample' }
  | { type: 'project'; patch: Partial<Doc['project']> }
  | { type: 'stakeholder'; id: string; value: string }
  | { type: 'useCase'; patch: Partial<Doc['useCase']> }
  | { type: 'decision'; id: string; patch: Partial<Doc['decisions'][number]> }
  | { type: 'risk'; id: string; dimension: string; value: number }
  | { type: 'tokenPlan'; patch: Partial<Doc['tokenPlan']> }
  | { type: 'line'; bucket: LineBucket; id: string; patch: Partial<LineItem> }
  | { type: 'addLine'; bucket: LineBucket; label: string }
  | { type: 'removeLine'; bucket: LineBucket; id: string }
  | { type: 'phase'; index: number; patch: Partial<Doc['phases'][number]> }
  | { type: 'toggleDeliverable'; index: number; key: string }

function reducer(state: Doc, action: Action): Doc {
  switch (action.type) {
    case 'replace':
      return action.doc
    case 'reset':
      return createDoc()
    case 'sample':
      return createSampleDoc()
    case 'project':
      return { ...state, project: { ...state.project, ...action.patch } }
    case 'stakeholder':
      return { ...state, stakeholders: { ...state.stakeholders, [action.id]: action.value } }
    case 'useCase':
      return { ...state, useCase: { ...state.useCase, ...action.patch } }
    case 'decision':
      return {
        ...state,
        decisions: state.decisions.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d,
        ),
      }
    case 'risk':
      return {
        ...state,
        decisions: state.decisions.map((d) =>
          d.id === action.id
            ? { ...d, risks: { ...d.risks, [action.dimension]: action.value } }
            : d,
        ),
      }
    case 'tokenPlan':
      return { ...state, tokenPlan: { ...state.tokenPlan, ...action.patch } }
    case 'line':
      return {
        ...state,
        [action.bucket]: state[action.bucket].map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
      }
    case 'addLine': {
      const id = `custom-${action.bucket}-${Date.now().toString(36)}`
      const item: LineItem = {
        id,
        label: action.label || 'Custom line',
        hint: '',
        oneTime: 0,
        annual: 0,
        note: '',
        custom: true,
      }
      return { ...state, [action.bucket]: [...state[action.bucket], item] }
    }
    case 'removeLine':
      return {
        ...state,
        [action.bucket]: state[action.bucket].filter((l) => l.id !== action.id),
      }
    case 'phase':
      return {
        ...state,
        phases: state.phases.map((p, i) => (i === action.index ? { ...p, ...action.patch } : p)),
      }
    case 'toggleDeliverable':
      return {
        ...state,
        phases: state.phases.map((p, i) => {
          if (i !== action.index) return p
          const has = p.done.includes(action.key)
          return {
            ...p,
            done: has ? p.done.filter((k) => k !== action.key) : [...p.done, action.key],
          }
        }),
      }
    default:
      return state
  }
}

interface StoreValue {
  doc: Doc
  dispatch: React.Dispatch<Action>
  results: Results
  tokenCost: ReturnType<typeof computeTokenCost>
  gaps: ReturnType<typeof findGaps>
  currency: string
  saved: 'idle' | 'saving' | 'saved'
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(reducer, undefined, () => storage.load() ?? createDoc())
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle')
  const first = useRef(true)

  // Debounced persistence. Keeps typing snappy and localStorage writes cheap.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaved('saving')
    const t = window.setTimeout(() => {
      storage.save({ ...doc, updatedAt: new Date().toISOString() })
      setSaved('saved')
    }, 400)
    return () => window.clearTimeout(t)
  }, [doc])

  useEffect(() => {
    if (saved !== 'saved') return
    const t = window.setTimeout(() => setSaved('idle'), 1600)
    return () => window.clearTimeout(t)
  }, [saved])

  const results = useMemo(() => computeResults(doc), [doc])
  const tokenCost = useMemo(() => computeTokenCost(doc.tokenPlan, TOKEN_MODELS), [doc.tokenPlan])
  const gaps = useMemo(() => findGaps(doc, results), [doc, results])

  // The token model feeds the AI API cost line when the user has linked them.
  const linked = doc.tokenPlan.linkToCosts
  const annualApi = Math.round(tokenCost.annual)
  const currentApi = doc.costs.find((c) => c.id === 'ai-api')?.annual ?? 0
  useEffect(() => {
    if (!linked) return
    if (currentApi === annualApi) return
    dispatch({ type: 'line', bucket: 'costs', id: 'ai-api', patch: { annual: annualApi } })
  }, [linked, annualApi, currentApi])

  const value = useMemo<StoreValue>(
    () => ({
      doc,
      dispatch,
      results,
      tokenCost,
      gaps,
      currency: doc.project.currency || 'USD',
      saved,
    }),
    [doc, results, tokenCost, gaps, saved],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/** Convenience hook for the very common "patch one line item" case. */
export function useLinePatch(bucket: LineBucket) {
  const { dispatch } = useStore()
  return useCallback(
    (id: string, patch: Partial<LineItem>) => dispatch({ type: 'line', bucket, id, patch }),
    [dispatch, bucket],
  )
}
