/**
 * Source document: "High-Level Strategic Decision Framework", from the AI
 * Leadership — Commercial value with AI module of Ed Donner's Proficient AI
 * Engineer program (https://edwarddonner.com/proficient/). See NOTICE.
 *
 * The seven cost lines, three benefit categories and three mitigation lines
 * below come from that framework, as does the worked example. The hint text
 * on each line is ProForma's own.
 */
import { DECISION_OPTIONS } from '../data/decisions'
import { PHASES } from '../data/roadmap'
import type { DecisionRow, Doc, LineItem, PhaseState } from './types'

export const DOC_VERSION = 1

function line(id: string, label: string, hint: string): LineItem {
  return { id, label, hint, oneTime: 0, annual: 0, note: '' }
}

/** The seven cost lines from the High-Level Strategic Decision Framework. */
export function defaultCosts(): LineItem[] {
  return [
    line(
      'data-acquisition',
      'Data acquisition',
      'Curating data with the quality, quantity and completeness the model needs.',
    ),
    line(
      'data-science',
      'Data science & training',
      'Data science R&D, experimentation and model training.',
    ),
    line('engineering', 'Engineering', 'Technology expense to build the product.'),
    line('infrastructure', 'Infrastructure', 'Compute, storage and platform to run it.'),
    line(
      'ai-api',
      'AI API / inference',
      'Ongoing per-token or per-call spend. The token calculator can drive this line.',
    ),
    line('operations', 'Operations / business', 'Business operations and process change.'),
    line('support', 'Technical support', 'Running support for the deployed system.'),
  ]
}

/** The three benefit categories. Automation, augmentation, differentiation. */
export function defaultBenefits(): LineItem[] {
  return [
    line(
      'automation',
      'Automation',
      'Work the system does instead of a person. Justify the saving with a headcount or hours figure.',
    ),
    line(
      'augmentation',
      'Augmentation',
      'Work a person does faster or better. Justify with throughput per person, not vibes.',
    ),
    line(
      'differentiation',
      'Differentiation',
      'Revenue you would not otherwise win. The hardest to defend — show the pipeline.',
    ),
  ]
}

/** The three risk-mitigation lines. These are costs; they reduce the net. */
export function defaultMitigations(): LineItem[] {
  return [
    line(
      'technical-risk',
      'Technical risks',
      'Model quality, latency, drift, integration failure. What will you spend to contain it?',
    ),
    line(
      'operational-risk',
      'Operational risks',
      'Support load, process breakage, change fatigue, key-person dependency.',
    ),
    line(
      'strategic-risk',
      'Strategic risks',
      'Vendor lock-in, regulatory shift, reputational exposure, competitor response.',
    ),
  ]
}

export function defaultDecisions(): DecisionRow[] {
  return DECISION_OPTIONS.map((opt) => ({
    id: opt.id,
    selected: false,
    description: '',
    buildCost: 0,
    runtimeCostEng: 0,
    runtimeCostSupport: 0,
    impactCommercial: '',
    impactProduct: '',
    impactSales: '',
    nonDollarBenefits: '',
    risks: {
      scalability: 0,
      operational: 0,
      ethics: 0,
      people: 0,
      infosec: 0,
      legal: 0,
      other: 0,
    },
    recommendation: '',
  }))
}

/** Month-end gates, one per phase, starting at the end of the current month. */
export function defaultPhases(from = new Date()): PhaseState[] {
  return PHASES.map((_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() + i + 1, 0)
    return { date: toISODate(d), done: [], notes: '' }
  })
}

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function createDoc(): Doc {
  const now = new Date()
  return {
    version: DOC_VERSION,
    updatedAt: now.toISOString(),
    project: {
      title: '',
      businessArea: '',
      facing: 'internal',
      proposal: '',
      proposers: '',
      sponsors: '',
      startDate: toISODate(now),
      currency: 'USD',
      discountRate: 10,
    },
    stakeholders: {},
    useCase: { industry: '', aiType: '', seed: '' },
    decisions: defaultDecisions(),
    tokenPlan: {
      modelId: 'claude-sonnet-5',
      customInputPerM: 0,
      customOutputPerM: 0,
      requestsPerDay: 2000,
      inputTokensPerRequest: 6000,
      outputTokensPerRequest: 600,
      cacheHitRate: 55,
      daysPerYear: 365,
      overheadPct: 25,
      linkToCosts: true,
    },
    costs: defaultCosts(),
    benefits: defaultBenefits(),
    mitigations: defaultMitigations(),
    phases: defaultPhases(now),
  }
}

/**
 * A worked example matching the figures in the source framework, so a new user
 * can see a finished business case before building their own.
 */
export function createSampleDoc(): Doc {
  const doc = createDoc()
  doc.project = {
    ...doc.project,
    title: 'Claims triage assistant',
    businessArea: 'Retail Claims Operations',
    facing: 'internal',
    proposal: [
      'Route inbound claims to the right handler and draft the first response.',
      'Targets the 40% of claims that are straightforward but still queue behind complex ones.',
      'Human handler reviews and sends; the assistant never settles a claim on its own.',
    ].join('\n'),
    proposers: 'Claims Ops, Data Science',
    sponsors: 'COO',
  }
  doc.stakeholders = {
    exec: 'COO',
    ds: 'Head of Data Science',
    eng: 'Platform Engineering Lead',
    ops: 'Claims Operations Manager',
    finance: 'Finance Business Partner',
    legal: 'Regulatory Counsel',
    infosec: 'CISO delegate',
  }
  doc.useCase = {
    industry: 'insurance',
    aiType: 'generative',
    seed: 'Draft policies and documents automatically, tailored to each customer.',
  }

  const set = (items: LineItem[], id: string, oneTime: number, annual: number, note = '') => {
    const item = items.find((i) => i.id === id)
    if (item) Object.assign(item, { oneTime, annual, note })
  }

  set(
    doc.costs,
    'data-acquisition',
    30_000,
    10_000,
    'Labelling 12k historical claims, then quarterly refresh.',
  )
  set(
    doc.costs,
    'data-science',
    1_100_000,
    200_000,
    'Four FTE for the build year, two thereafter.',
  )
  set(doc.costs, 'engineering', 800_000, 0, 'Integration with the claims platform. One-off.')
  set(doc.costs, 'infrastructure', 0, 200_000, 'Vector store, eval harness, observability.')
  set(doc.costs, 'ai-api', 0, 50_000, 'Inference. See the token model on the Architecture step.')
  set(doc.costs, 'operations', 50_000, 50_000, 'Process redesign, then ongoing QA sampling.')
  set(doc.costs, 'support', 0, 50_000, 'Tier-2 support for handler escalations.')

  set(
    doc.benefits,
    'automation',
    50_000,
    400_000,
    'Triage time down from 9 to 3 minutes on 40% of volume — 5.2 FTE equivalent.',
  )
  set(
    doc.benefits,
    'augmentation',
    0,
    500_000,
    'Handlers clear 22% more claims per shift on the complex remainder.',
  )
  set(
    doc.benefits,
    'differentiation',
    0,
    800_000,
    'Same-day acknowledgement as a retention lever; assumes 1.4pt churn reduction.',
  )

  set(
    doc.mitigations,
    'technical-risk',
    0,
    100_000,
    'Eval suite, drift monitoring, rollback path.',
  )
  set(
    doc.mitigations,
    'operational-risk',
    0,
    50_000,
    'Handler training and a manual fallback queue.',
  )
  set(
    doc.mitigations,
    'strategic-risk',
    0,
    200_000,
    'Second-vendor readiness and regulatory review budget.',
  )

  doc.decisions = doc.decisions.map((d) =>
    d.id === 'lower-cost' || d.id === 'rag' || d.id === 'caching' || d.id === 'observability'
      ? {
          ...d,
          selected: true,
          risks: { ...d.risks, operational: 2, ethics: 3, legal: 3, infosec: 2 },
        }
      : d,
  )

  doc.tokenPlan = {
    ...doc.tokenPlan,
    modelId: 'claude-sonnet-5',
    requestsPerDay: 1800,
    inputTokensPerRequest: 6000,
    outputTokensPerRequest: 600,
    cacheHitRate: 60,
    overheadPct: 25,
  }

  return doc
}
