/**
 * Source document: "Cross-Functional AI Project Decision-Making Framework",
 * from the AI Leadership — Commercial value with AI module of Ed Donner's
 * Proficient AI Engineer program (https://edwarddonner.com/proficient/).
 * See NOTICE.
 *
 * The decision matrix from the Cross-Functional AI Project Decision-Making
 * Framework: models, optimisations, infrastructure. Each option is scored on
 * cost, benefit and seven risk dimensions, with a "completed by" owner so the
 * scoring is a cross-functional act rather than an engineering one.
 */
export interface DecisionOption {
  id: string
  group: 'Models' | 'Optimisations' | 'Infrastructure'
  label: string
  hint: string
}

export const DECISION_OPTIONS: DecisionOption[] = [
  // Models
  {
    id: 'frontier',
    group: 'Models',
    label: 'Frontier model',
    hint: 'Highest capability, highest per-token cost. Price the ceiling before you assume you need it.',
  },
  {
    id: 'lower-cost',
    group: 'Models',
    label: 'Lower-cost model',
    hint: 'Small/fast tier. Often sufficient; run the eval before ruling it out.',
  },
  {
    id: 'compare-a',
    group: 'Models',
    label: 'Comparison model A',
    hint: 'A second vendor scored on the same axes. Guards against lock-in.',
  },
  {
    id: 'compare-b',
    group: 'Models',
    label: 'Comparison model B',
    hint: 'A third option, for negotiation leverage as much as for capability.',
  },
  {
    id: 'oss-large',
    group: 'Models',
    label: 'Open source — large',
    hint: 'No per-token fee, but infrastructure, ops and talent costs move onto your books.',
  },
  {
    id: 'oss-small',
    group: 'Models',
    label: 'Open source — small / on-device',
    hint: 'Cheapest inference, most engineering. Viable when the task is narrow.',
  },

  // Optimisations
  {
    id: 'multishot',
    group: 'Optimisations',
    label: 'Multi-shot prompting',
    hint: 'Cheapest lever. Raises input tokens per request — check it against the token model.',
  },
  {
    id: 'rag',
    group: 'Optimisations',
    label: 'RAG (retrieval augmented generation)',
    hint: 'Adds a vector store and an ingestion pipeline to run cost. Usually beats fine-tuning.',
  },
  {
    id: 'agents',
    group: 'Optimisations',
    label: 'Agents',
    hint: 'Multiplies tokens per task. Budget for loops, retries and human review.',
  },
  {
    id: 'finetune',
    group: 'Optimisations',
    label: 'Fine-tuning',
    hint: 'Training cost up front, and a re-training cost every time the data shifts.',
  },
  {
    id: 'caching',
    group: 'Optimisations',
    label: 'Prompt caching',
    hint: 'Largest single cost lever on stable prefixes. Model it explicitly.',
  },

  // Infrastructure
  {
    id: 'managed-ml',
    group: 'Infrastructure',
    label: 'Managed ML platform',
    hint: 'Higher licence cost, lower headcount. Trade capex for opex.',
  },
  {
    id: 'abstraction',
    group: 'Infrastructure',
    label: 'Abstraction / gateway layer',
    hint: 'Buys vendor portability and central cost control. Costs engineering time now.',
  },
  {
    id: 'observability',
    group: 'Infrastructure',
    label: 'Evaluation & observability',
    hint: 'Without it you cannot prove the benefits you are about to claim.',
  },
]

export const RISK_DIMENSIONS = [
  { id: 'scalability', label: 'Scalability / resiliency', owner: 'All' },
  { id: 'operational', label: 'Operational / support', owner: 'All' },
  { id: 'ethics', label: 'Bias / explainability / ethics', owner: 'Legal & compliance' },
  { id: 'people', label: 'People / talent', owner: 'HR / People ops' },
  { id: 'infosec', label: 'Information security', owner: 'Infosec' },
  { id: 'legal', label: 'Legal', owner: 'Legal & compliance' },
  { id: 'other', label: 'Other', owner: 'All' },
] as const

export type RiskDimensionId = (typeof RISK_DIMENSIONS)[number]['id']

export const RISK_LABELS = [
  'Not assessed',
  'Low',
  'Modest',
  'Material',
  'High',
  'Severe',
] as const
