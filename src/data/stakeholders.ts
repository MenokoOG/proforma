/**
 * The eighteen stakeholder roles from the Cross-Functional AI Project
 * Decision-Making Framework. The point of the list is to force the question
 * "who owns this dimension?" before money is committed.
 */
export interface StakeholderRole {
  id: string
  label: string
  /** What this role is on the hook for in an AI initiative. */
  owns: string
}

export const STAKEHOLDER_ROLES: StakeholderRole[] = [
  { id: 'exec', label: 'Executive Leadership', owns: 'Funding, mandate, go/no-go' },
  { id: 'ds', label: 'Data Science', owns: 'Model choice, metrics, build cost' },
  { id: 'eng', label: 'Engineering', owns: 'Architecture, integration, runtime cost' },
  { id: 'product', label: 'Product', owns: 'User journeys, product impact' },
  { id: 'ops', label: 'Operations', owns: 'Run cost, process change' },
  { id: 'sales', label: 'Sales & Marketing', owns: 'Revenue impact, go-to-market' },
  { id: 'finance', label: 'Finance', owns: 'Business case, ROI validation' },
  { id: 'legal', label: 'Legal & Compliance', owns: 'Legal risk, regulatory exposure' },
  { id: 'support', label: 'Support', owns: 'Support load, runtime support cost' },
  { id: 'infosec', label: 'Information Security', owns: 'Data handling, model security' },
  { id: 'hr', label: 'HR / People Operations', owns: 'Talent, role change, reskilling' },
  { id: 'ethics', label: 'Ethics & Responsible AI', owns: 'Bias, explainability, fairness' },
  { id: 'risk', label: 'Risk Management', owns: 'Risk register, mitigation budget' },
  { id: 'cx', label: 'Customer Experience / UX', owns: 'Customer-facing quality bar' },
  { id: 'gov', label: 'Governance & Audit', owns: 'Controls, auditability' },
  { id: 'champions', label: 'Champions', owns: 'Early advocacy, user testing' },
  { id: 'adopters', label: 'Early Adopters', owns: 'Beta testing, testimonials' },
  { id: 'other', label: 'Additional Stakeholders', owns: 'Anything the list above misses' },
]
