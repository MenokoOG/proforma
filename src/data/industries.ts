/**
 * Industry use-case bank.
 *
 * Source document: "AI Industry Use Cases", from the AI Leadership —
 * Commercial value with AI module of Ed Donner's Proficient AI Engineer
 * program (https://edwarddonner.com/proficient/). See NOTICE.
 *
 * The industry list and the predictive / generative / agentic structure come
 * from that document. The descriptions are ProForma's own: rewritten to say
 * what a business case would actually claim — which benefit category the
 * value lands in, and which cost line moves — rather than to describe the
 * technology. Unsourced performance figures in the original have been
 * removed; a number without a citation is not evidence.
 *
 * These are reference points, not benchmarks. They exist so a reviewer can
 * see the shape of a comparable case, not so a figure can be borrowed.
 */
export interface Industry {
  id: string
  name: string
  predictive: string
  generative: string
  agentic: string
}

export const INDUSTRIES: Industry[] = [
  {
    id: 'banking',
    name: 'Banking & Financial Services',
    predictive:
      'Default and fraud scoring against transaction history. Benefit lands as automation — losses avoided plus manual review hours removed. Cost concentrates in data acquisition and data science, not inference.',
    generative:
      'Drafting customer communications from account data: statements, outreach, adverse-action notices. Benefit is augmentation — the same relationship managers cover more accounts. Token spend is the line that actually moves.',
    agentic:
      'Multi-step workflows that gather evidence, apply policy and prepare a decision for a named approver: disputes, KYC refresh, limit reviews. Carries the largest mitigation budget in the model, because model-risk and regulatory controls are the cost, not the compute.',
  },
  {
    id: 'insurance',
    name: 'Insurance',
    predictive:
      'Risk pricing and fraud flagging at quote and claim. Benefit is automation — underwriting hours removed and leakage avoided. The cost that gets underestimated is data acquisition, because pricing data has to be defensible, not merely available.',
    generative:
      'Drafting policy documents, endorsements and claim correspondence from structured case data. Benefit is augmentation, measured in documents per handler per day.',
    agentic:
      'Straight-through claim handling that assembles the file, applies policy terms and routes anything outside tolerance to an adjuster. Benefit is automation of the simple majority; mitigation covers the regulatory exposure of the exceptions.',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    predictive:
      'Admission, no-show and deterioration forecasting from historical encounters. Benefit is automation — staffing to actual demand instead of to the worst case. Data acquisition costs more than teams expect, because the records need cleaning before anything can be predicted.',
    generative:
      'Ambient note drafting and discharge summaries, clinician-reviewed before anything enters the record. Benefit is augmentation, measured in documentation minutes per clinician per shift.',
    agentic:
      'Follow-up workflows that chase results, escalate out-of-range values and prepare the callback list for a nurse to action. Benefit is automation of coordination work; mitigation is dominated by clinical-safety review and audit.',
  },
  {
    id: 'pharma',
    name: 'Pharma & Life Sciences',
    predictive:
      'Candidate triage and trial-outcome modelling. Benefit is differentiation more than automation — the claim is fewer late-stage failures, which is high value and hard to defend. Show the historical base rate you are improving on.',
    generative:
      'Drafting regulatory submissions, study reports and protocol sections from trial data. Benefit is augmentation of a scarce, expensive writing function.',
    agentic:
      'Experiment planning and analysis loops that propose the next assay, with a named scientist approving each run. Benefit is throughput per bench; infrastructure and compute dominate the cost.',
  },
  {
    id: 'retail',
    name: 'Retail & E-Commerce',
    predictive:
      'Demand forecasting per SKU per location. Benefit is automation, sized on markdown and stockout avoided — the two figures a merchandising director already tracks, which makes this the easiest case in the list to defend.',
    generative:
      'Product copy, category pages and campaign variants generated from the attribute feed. Benefit is augmentation; the cost line is inference, and it scales with catalogue size rather than headcount.',
    agentic:
      'Replenishment and pricing agents that propose orders and markdowns against live sell-through, with a buyer approving the batch. Benefit is automation of routine buying decisions.',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    predictive:
      'Failure prediction from sensor telemetry, sized on unplanned downtime hours avoided. Benefit is automation. Infrastructure is a real cost line here: telemetry has to be collected and retained before it can be predicted from.',
    generative:
      'Work instructions, root-cause write-ups and maintenance procedures drafted from historical tickets. Benefit is augmentation of a shrinking pool of experienced engineers.',
    agentic:
      'Scheduling and replenishment agents that propose line changes and parts orders against live constraints, with the plant supervisor signing off. Benefit is automation; the cost that surprises people is integration engineering against the MES.',
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain & Logistics',
    predictive:
      'Demand and lead-time forecasting across suppliers and lanes. Benefit is automation — expedite freight avoided and safety stock reduced. Both are already line items in a budget somewhere, so the saving is checkable.',
    generative:
      'Shipment exception notices, customer updates and carrier correspondence drafted from tracking events. Benefit is augmentation of the exception desk.',
    agentic:
      'Routing and allocation agents that re-plan against disruption and put the revised plan in front of a planner. Benefit is automation of replanning; mitigation covers what happens when the agent is confidently wrong about a lane.',
  },
  {
    id: 'automotive',
    name: 'Automotive & Mobility',
    predictive:
      'Component failure prediction across a fleet. Benefit is automation — roadside events and warranty claims avoided. The cost of getting telemetry off the vehicle and into a usable store is the line most cases omit.',
    generative:
      'Scenario generation for testing: weather, traffic and edge cases synthesised to widen validation coverage. Benefit is augmentation of a test programme, measured in scenarios covered per engineer-week.',
    agentic:
      'Fleet operations agents that schedule charging, maintenance and repositioning, with an operations lead approving the day plan. Benefit is automation of dispatch work.',
  },
  {
    id: 'energy',
    name: 'Energy & Utilities',
    predictive:
      'Load forecasting and asset-condition monitoring. Benefit is automation, sized on outage minutes and unplanned maintenance avoided — both regulated, reported figures, which makes the claim unusually easy to evidence.',
    generative:
      'Customer service drafting for billing queries and outage communications. Benefit is augmentation of the contact centre; token spend tracks call volume.',
    agentic:
      'Grid-balancing and fault-isolation agents that propose switching actions for a control-room operator to authorise. Benefit is automation of routine dispatch; mitigation is the largest line in the case and should be.',
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    predictive:
      'Yield and pest-pressure forecasting from field, weather and satellite data. Benefit is differentiation as often as automation — the claim is usually higher output per hectare, which needs a season of evidence, not a model score.',
    generative:
      'Agronomy advice drafted in plain language from soil, weather and history. Benefit is augmentation — fewer agronomist visits per grower for the same coverage.',
    agentic:
      'Field equipment that plans and executes passes under a set operating envelope, with an operator retaining override. Benefit is automation of labour that is genuinely hard to hire.',
  },
  {
    id: 'education',
    name: 'Education',
    predictive:
      'Early identification of students at risk of withdrawal. Benefit is differentiation — retained enrolment is revenue — and it is the number the institution already reports, so the case stands or falls on the intervention, not the model.',
    generative:
      'Explanations, practice material and feedback generated per student. Benefit is augmentation, measured in feedback turnaround rather than staff removed.',
    agentic:
      'Marking and administrative workflows that prepare grades and records for an instructor to confirm. Benefit is automation of hours, and the mitigation line has to cover academic-integrity review.',
  },
  {
    id: 'government',
    name: 'Government & Public Sector',
    predictive:
      'Early warning across service demand, infrastructure condition and public health. Benefit is usually cost avoided rather than cost removed, which is harder to book — say so in the justification rather than claiming a saving.',
    generative:
      'First drafts of correspondence, summaries and briefing material. Benefit is augmentation. Procurement and accreditation are real one-time costs and belong in Year 1.',
    agentic:
      'Casework agents that assemble a file, apply eligibility rules and put a recommendation to a caseworker. Benefit is automation of processing time; mitigation covers appeal exposure and the audit trail a decision must carry.',
  },
  {
    id: 'legal',
    name: 'Legal Services',
    predictive:
      'Matter-outcome and cost modelling from historical matters. Benefit is differentiation — better-priced work won — and the honest version of this case admits the sample size is small.',
    generative:
      'Contract drafting, summarisation and clause review against a playbook. Benefit is augmentation, measured in documents per fee-earner. This is the strongest benefit line in the sector and the easiest to evidence.',
    agentic:
      'Research and drafting agents that assemble authority, check their own citations and hand a reviewed draft to an attorney. Benefit is automation of first-pass work; mitigation covers privilege and the cost of a hallucinated citation reaching a filing.',
  },
  {
    id: 'real-estate',
    name: 'Real Estate & Construction',
    predictive:
      'Valuation and project cost-overrun modelling. Benefit is differentiation through better bidding. Overrun avoided is the more defensible of the two, because the baseline is documented.',
    generative:
      'Listings, marketing material and project documentation generated from structured attributes. Benefit is augmentation; the cost is inference and it is small.',
    agentic:
      'Site equipment and scheduling agents that plan and execute work within a bounded envelope under supervision. Benefit is automation; the mitigation line is safety, and a case that understates it will not survive review.',
  },
  {
    id: 'marketing',
    name: 'Marketing & Advertising',
    predictive:
      'Response and conversion modelling to reallocate spend. Benefit is differentiation — incremental revenue — and it is the hardest claim in this list to defend, because attribution is contested. Show the holdout.',
    generative:
      'Creative variants produced at volume under human art direction. Benefit is augmentation, measured in concepts tested per campaign rather than designers removed.',
    agentic:
      'Campaign agents that propose budget and creative reallocation across channels for a marketer to approve. Benefit is automation of daily optimisation work.',
  },
  {
    id: 'media',
    name: 'Media & Entertainment',
    predictive:
      'Audience and performance modelling to inform commissioning. Benefit is differentiation, and it is a portfolio claim — it holds across a slate, not for any single title.',
    generative:
      'Production of audio, video and image assets, and localisation at volume. Benefit is automation of production cost, which is the clearest saving in the sector; rights and provenance sit in the mitigation line.',
    agentic:
      'In-product agents that drive interactive experiences within designed constraints. Benefit is differentiation through engagement, and inference cost scales with concurrent users, not with headcount.',
  },
  {
    id: 'telecom',
    name: 'Telecommunications',
    predictive:
      'Fault prediction and churn modelling. Benefit is automation on the network side and differentiation on the retention side. Keep them as separate benefit lines — they have different confidence and reviewers will treat them differently.',
    generative:
      'Service and troubleshooting conversations handled in natural language. Benefit is augmentation of the contact centre; inference cost tracks contact volume directly.',
    agentic:
      'Network-tuning agents that propose configuration changes within an approved envelope. Benefit is automation at a volume no team could staff; mitigation covers the blast radius of a bad change.',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    predictive:
      'Detection across signal volumes no analyst team can read. Benefit is automation — triage hours removed — and the harder claim, breach avoided, needs a stated base rate before anyone will accept it.',
    generative:
      'Incident summarisation, investigation narrative and remediation drafting. Benefit is augmentation, measured in time to a written, actionable finding.',
    agentic:
      'Containment agents that isolate a host or revoke access under a pre-agreed policy, with the action logged and reviewable. Benefit is automation of response time; mitigation covers the cost of a wrong containment on a production system.',
  },
  {
    id: 'defence',
    name: 'Defence & Aerospace',
    predictive:
      'Airframe and platform condition monitoring. Benefit is automation — mission availability held with less unscheduled maintenance. Data acquisition and accreditation are both large one-time costs.',
    generative:
      'Training scenario generation, producing varied and unscripted conditions for exercises. Benefit is augmentation of a training programme.',
    agentic:
      'Planning and coordination agents operating inside a defined authority envelope, with a human retaining the decision. Mitigation and accreditation dominate the case; treat any figure here as provisional until the accreditation path is known.',
  },
  {
    id: 'mining',
    name: 'Mining & Metals',
    predictive:
      'Equipment condition and process monitoring across remote sites. Benefit is automation, sized on downtime and unplanned maintenance avoided, and connectivity to remote assets is a real infrastructure line.',
    generative:
      'Geoscience and operational reporting summarised for faster cross-site decisions. Benefit is augmentation, and it is modest — do not oversell it.',
    agentic:
      'Haulage and materials-handling agents running defined routes under supervision. Benefit is automation of shifts that are hard to staff; safety mitigation is the counterweight and belongs in the case.',
  },
]

export const AI_TYPE_META = {
  predictive: {
    label: 'Predictive AI',
    blurb: 'Forecasting & decision optimisation',
    tone: 'Usually the cheapest to run and the easiest to measure. Benefits land as avoided cost.',
  },
  generative: {
    label: 'Generative AI',
    blurb: 'Content creation & personalisation',
    tone: 'Token costs dominate. Benefits land as throughput per person.',
  },
  agentic: {
    label: 'Agentic AI',
    blurb: 'Governed actions & decisions',
    tone: 'Highest token spend and highest risk-mitigation budget. Benefits land as headcount avoided.',
  },
} as const
