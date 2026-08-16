/**
 * The End-to-End AI Delivery Roadmap: six phase gates by seven swimlanes.
 *
 * Reconstructed from the source deck's actual grid geometry, so each
 * deliverable sits in the phase and swimlane the author placed it in. Phase 0
 * is deliberately governance-only — nothing else starts until the business
 * case is approved.
 */

export interface Phase {
  id: number
  name: string
  subtitle: string
  /** What this gate exists to decide. */
  gate: string
}

export const PHASES: Phase[] = [
  {
    id: 0,
    name: 'Phase 0',
    subtitle: 'Business case',
    gate: 'Is this worth funding at all?',
  },
  { id: 1, name: 'Phase 1', subtitle: 'Plan', gate: 'Who does what, by when, for how much?' },
  { id: 2, name: 'Phase 2', subtitle: 'Research', gate: 'Does the model actually work on our data?' },
  { id: 3, name: 'Phase 3', subtitle: 'Build', gate: 'Are we building the thing we designed?' },
  { id: 4, name: 'Phase 4', subtitle: 'Deploy', gate: 'Go or no-go?' },
  { id: 5, name: 'Phase 5', subtitle: 'Measure', gate: 'Did we get the benefits we projected?' },
]

export interface Swimlane {
  id: string
  label: string
  /** Deliverables indexed by phase id. Empty array means nothing in that phase. */
  cells: string[][]
}

export const SWIMLANES: Swimlane[] = [
  {
    id: 'governance',
    label: 'Governance & Sponsors',
    cells: [
      ['Complete strategic decision-making template & approve', 'Approve budget, assign stakeholders'],
      [
        'Approve budget',
        'Governance meetings booked',
        'Ratify resourcing',
        'Ratify vendor selection',
        'Agree KPIs / metrics / ROI',
      ],
      ['Review baseline KPIs', 'Confirm final plan post-R&D', 'Ratify user journeys', 'User communications'],
      ['Make decisions as escalated by technical and business teams', 'Feedback on demos', 'Review metrics'],
      ['Sign-off on user testing', 'Review go-live metrics', 'Go / No-go decision', 'Communicate broadly'],
      [
        'Review metrics / KPIs / ROI',
        'Review feedback',
        'Strategic decision-making template for next iteration',
      ],
    ],
  },
  {
    id: 'data-science',
    label: 'Data Science',
    cells: [
      [],
      ['Budget', 'Resource plan, R&R', 'Milestones, risks, issues', 'KPIs / metrics'],
      ['R&D', 'Confirm plan post-R&D', 'Prototype model', 'Baseline model', 'Baseline metrics'],
      ['Select & train models', 'Calculate metrics', 'Escalate decision points'],
      ['Internal test then user test', 'Productionise models', 'Measure metrics'],
      ['Monitor model performance', 'Measure metrics', 'Review feedback'],
    ],
  },
  {
    id: 'data-eng',
    label: 'Data & Data Engineering',
    cells: [
      [],
      ['Budget', 'Resource plan, R&R', 'Milestones, risks, issues', 'Data evaluation'],
      ['Data curation', 'Data metrics', 'Sample test set'],
      [
        'Data ingestion ETL',
        'Data quantity, quality, completeness measures',
        'Escalate decision points',
      ],
      [
        'Implement test and production data ingestion',
        'Support the test and production process',
        'Measure data metrics',
      ],
      ['Monitor data ingest', 'Measure data metrics', 'Review data feedback'],
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering & Technology',
    cells: [
      [],
      ['Budget', 'Resource plan, R&R', 'Milestones, risks, issues', 'Vendor selection'],
      ['Architecture & design', 'Integration architecture', 'User journeys', 'Prototype'],
      [
        'Run engineering sprints',
        'Demo every sprint',
        'Escalate decision points',
        'Test plan',
        'Support plan',
      ],
      ['Run system testing and user testing process', 'Present Go / No-go', 'Deploy to production'],
      ['Provide support', 'Monitor system performance', 'Fix defects', 'Report usage'],
    ],
  },
  {
    id: 'business',
    label: 'Business, Product & Operations',
    cells: [
      [],
      ['Budget', 'Resource plan, R&R', 'Milestones, risks, issues', 'Change management plan'],
      ['Agree metrics', 'Detailed use cases', 'Test planning', 'User communications'],
      [
        'Participate in demos',
        'Collaborate on decision points',
        'User communications',
        'User test plan',
        'Training plan',
      ],
      ['Sign-off internal test', 'Run user test phase', 'Achieve sign-off and go live'],
      ['Provide business support', 'Review metrics', 'Provide model feedback'],
    ],
  },
  {
    id: 'champions',
    label: 'Champions',
    cells: [
      [],
      ['Preliminary communications on vision, with Q&A', 'Identify champions'],
      ['Understand and buy in to the metrics', 'Review user journeys and prototypes'],
      ['See demos', 'See metrics', 'Frequent broader comms', 'Champions test plan'],
      ['User test and sign-off', 'Participate in training others', 'Rolled out'],
      ['Train others', 'Adoption is tracked and reported', 'Provide feedback'],
    ],
  },
  {
    id: 'adopters',
    label: 'Early Adopters',
    cells: [
      [],
      ['Preliminary communications on vision, with Q&A', 'Identify early adopters'],
      ['Review user journeys and prototypes', 'Ongoing communications'],
      ['See demos', 'See metrics', 'Beta test plan', 'Frequent broader comms'],
      ['Beta test', 'Give testimonials', 'Rolled out'],
      ['Train others', 'Usage is tracked and reported', 'Provide feedback'],
    ],
  },
]

/** Stable key for a single deliverable checkbox. */
export function deliverableKey(phase: number, laneIndex: number, itemIndex: number): string {
  return `${phase}:${laneIndex}:${itemIndex}`
}

export function totalDeliverables(phase: number): number {
  return SWIMLANES.reduce((acc, lane) => acc + (lane.cells[phase]?.length ?? 0), 0)
}
