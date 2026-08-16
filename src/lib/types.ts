/**
 * ProForma domain model.
 *
 * Sign convention: every amount is stored as a POSITIVE magnitude. The
 * calculation engine applies direction based on `LineKind`. Users never type a
 * minus sign — "Data acquisition: 30000" always means a 30,000 cost.
 */

export type LineKind = 'cost' | 'benefit' | 'mitigation'

export interface LineItem {
  id: string
  /** Short label, e.g. "Data acquisition". */
  label: string
  /** Guidance shown under the label, taken from the source framework. */
  hint: string
  /** One-time amount. Lands entirely in Year 1. */
  oneTime: number
  /** Recurring amount. Applies to Years 2–5 (see calc.ts for the rule). */
  annual: number
  /** Free-text justification. This is what a sponsor actually reads. */
  note: string
  /** True for rows the user added themselves (can be deleted). */
  custom?: boolean
}

/* ------------------------------------------------------------------ */
/* Module 1 — project identity & stakeholders                          */
/* ------------------------------------------------------------------ */

export type Facing = 'internal' | 'external' | 'both'

export interface Project {
  title: string
  businessArea: string
  facing: Facing
  proposal: string
  proposers: string
  sponsors: string
  /** ISO date the Year-1 clock starts. Drives the year labels everywhere. */
  startDate: string
  currency: string
  /** Discount rate as a percentage, e.g. 10 means 10%. */
  discountRate: number
}

/** Keyed by stakeholder role id — see data/stakeholders.ts. */
export type Stakeholders = Record<string, string>

/* ------------------------------------------------------------------ */
/* Module 2 — use case                                                 */
/* ------------------------------------------------------------------ */

export type AiType = 'predictive' | 'generative' | 'agentic'

export interface UseCase {
  industry: string
  aiType: AiType | ''
  /** The example text the user pulled in, kept for provenance. */
  seed: string
}

/* ------------------------------------------------------------------ */
/* Module 3 — cross-functional architecture decisions                  */
/* ------------------------------------------------------------------ */

/** 0 = not assessed, 1 = low concern … 5 = severe concern. */
export type RiskScore = 0 | 1 | 2 | 3 | 4 | 5

export interface DecisionRow {
  /** Matches an option id in data/decisions.ts. */
  id: string
  selected: boolean
  description: string
  buildCost: number
  runtimeCostEng: number
  runtimeCostSupport: number
  impactCommercial: string
  impactProduct: string
  impactSales: string
  nonDollarBenefits: string
  risks: {
    scalability: RiskScore
    operational: RiskScore
    ethics: RiskScore
    people: RiskScore
    infosec: RiskScore
    legal: RiskScore
    other: RiskScore
  }
  recommendation: string
}

export interface TokenModel {
  id: string
  name: string
  /** USD per 1M input tokens. */
  inputPerM: number
  /** USD per 1M output tokens. */
  outputPerM: number
  note?: string
  custom?: boolean
}

export interface TokenPlan {
  modelId: string
  /** Used only when modelId === 'custom'. */
  customInputPerM: number
  customOutputPerM: number
  requestsPerDay: number
  inputTokensPerRequest: number
  outputTokensPerRequest: number
  /** 0–100. Cached input bills at 10% of the input rate. */
  cacheHitRate: number
  daysPerYear: number
  /** Multiplier applied to the raw model cost for retries, evals, dev traffic. */
  overheadPct: number
  /** When true, the computed annual figure drives the "AI API" cost line. */
  linkToCosts: boolean
}

/* ------------------------------------------------------------------ */
/* Module 4 — delivery roadmap                                         */
/* ------------------------------------------------------------------ */

export interface PhaseState {
  /** ISO date for the phase gate. */
  date: string
  /** Deliverable keys the team has ticked off, e.g. "2:3:1". */
  done: string[]
  notes: string
}

/* ------------------------------------------------------------------ */
/* Root document                                                       */
/* ------------------------------------------------------------------ */

export interface Doc {
  version: number
  updatedAt: string
  project: Project
  stakeholders: Stakeholders
  useCase: UseCase
  decisions: DecisionRow[]
  tokenPlan: TokenPlan
  costs: LineItem[]
  benefits: LineItem[]
  mitigations: LineItem[]
  phases: PhaseState[]
}

/* ------------------------------------------------------------------ */
/* Derived results                                                     */
/* ------------------------------------------------------------------ */

export interface YearRow {
  /** 0-indexed year offset. */
  index: number
  label: string
  cost: number
  mitigation: number
  benefit: number
  net: number
  cumulative: number
}

export interface Results {
  years: YearRow[]
  totalCost: number
  totalMitigation: number
  totalBenefit: number
  totalNet: number
  /** 1-indexed year the cumulative total first turns non-negative; null if never. */
  paybackYear: number | null
  /** Fractional years to break even, e.g. 3.4; null if never. */
  paybackYears: number | null
  /** (net benefit / total outlay); null when there is no outlay. */
  roi: number | null
  npv: number
  /** Internal rate of return as a fraction, e.g. 0.23; null when undefined. */
  irr: number | null
  /** Worst cumulative position — the cash the initiative must be funded through. */
  peakExposure: number
}
