/**
 * Industry use-case bank from "AI Industry use cases".
 * Twenty industries, each with a predictive, generative and agentic example.
 * Source citations have been stripped; the substance is unchanged.
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
      'Risk models predict loan defaults and fraud, improving credit decisions and reducing losses.',
    generative:
      'Auto-generate personalised customer outreach — marketing copy, statements and communications.',
    agentic:
      'Autonomous trading algorithms analyse markets and execute trades in real time with minimal human input.',
  },
  {
    id: 'insurance',
    name: 'Insurance',
    predictive:
      'Machine learning forecasts risk and flags fraud, enabling quicker underwriting and fewer claim errors.',
    generative:
      'Draft policies and documents automatically, tailored to each customer.',
    agentic:
      'Bots settle claims end-to-end in seconds with no paperwork.',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    predictive:
      'Predictive analytics forecast patient volumes and disease risk, optimising staffing and care delivery.',
    generative:
      'Assistants summarise medical notes and patient data, saving clinician time on documentation.',
    agentic:
      'Virtual health agents engage patients and monitor treatments autonomously, providing 24/7 follow-up.',
  },
  {
    id: 'pharma',
    name: 'Pharma & Life Sciences',
    predictive:
      'Models predict drug candidate safety and trial outcomes, cutting development time and late-stage failures.',
    generative:
      'Design new molecules, generating novel compounds and predicting their efficacy.',
    agentic:
      'Autonomous lab agents design and run experiments, analyse data and iterate in R&D.',
  },
  {
    id: 'retail',
    name: 'Retail & E-Commerce',
    predictive:
      'Forecast demand and shopper trends, optimising inventory and reducing stockouts.',
    generative:
      'Create personalised product content and ads at scale, lifting engagement.',
    agentic:
      'Smart store systems autonomously reorder stock and adjust shelf layouts in real time from sales data.',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    predictive:
      'Predictive maintenance alerts factories to machine failures before they happen, cutting downtime.',
    generative:
      'Generative design creates optimised product designs from thousands of simulations.',
    agentic:
      '"Lights-out" factories adjust production on the fly, with agents controlling robots and workflow end-to-end.',
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain & Logistics',
    predictive:
      'Forecast supply-chain demand to avoid shortages and delays; double-digit accuracy gains are typical.',
    generative:
      'Generate shipment reports and customer updates automatically, speeding up communications.',
    agentic:
      'Autonomous agents manage routing and inventory, handling warehouse picking and fleet scheduling.',
  },
  {
    id: 'automotive',
    name: 'Automotive & Mobility',
    predictive:
      'Predict vehicle maintenance needs — fleet platforms have cut unplanned stops by around a quarter.',
    generative:
      'Simulate driving scenarios (weather, traffic) to train autonomous vehicle systems more safely.',
    agentic:
      'Self-driving vehicles run 24/7 ride-hailing services with no safety driver on board.',
  },
  {
    id: 'energy',
    name: 'Energy & Utilities',
    predictive:
      'Forecast energy demand and detect grid issues early, such as predicting turbine faults from vibration.',
    generative:
      'Chatbots handle customer service, automating routine enquiries and outage reports 24/7.',
    agentic:
      'Agents balance power supply and demand and isolate faults on the grid in real time.',
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    predictive:
      'Predict crop yields and pest pressure, enabling timely intervention and boosting output.',
    generative:
      'Virtual agronomists analyse weather and soil data and advise farmers in natural language.',
    agentic:
      'Autonomous farm equipment ploughs and harvests with GPS and sensors, no driver needed.',
  },
  {
    id: 'education',
    name: 'Education',
    predictive:
      'Identify at-risk students early, allowing advisors to intervene and improve graduation rates.',
    generative:
      'Tutors personalise learning, providing on-demand explanations and feedback.',
    agentic:
      'Assistants automate grading and admin, freeing teachers to focus on students.',
  },
  {
    id: 'government',
    name: 'Government & Public Sector',
    predictive:
      'Anticipate problems early — from power outages to public health outbreaks — before they spread.',
    generative:
      'Draft documents and reports: emails, summaries and first drafts of policy for review.',
    agentic:
      'Smart city systems act autonomously, e.g. traffic signals retimed in real time to reduce congestion.',
  },
  {
    id: 'legal',
    name: 'Legal Services',
    predictive:
      'Predict case outcomes by analysing past cases to assess win probability and inform strategy.',
    generative:
      'Draft and review contracts faster — summarise large agreements and flag key clauses or risks in minutes.',
    agentic:
      'Autonomous agents run legal research or drafting, self-check their work, then hand off to attorneys.',
  },
  {
    id: 'real-estate',
    name: 'Real Estate & Construction',
    predictive:
      'Predict property values for smarter pricing and investment decisions.',
    generative:
      'Auto-generate property listings and ads from a set of home features in seconds.',
    agentic:
      'Autonomous construction machines dig and operate on site under AI guidance with no human driver.',
  },
  {
    id: 'marketing',
    name: 'Marketing & Advertising',
    predictive:
      'Predict campaign results, forecasting customer response and conversion to improve ad-spend ROI.',
    generative:
      'Create ad content at scale, blending human creative direction with AI-generated imagery and video.',
    agentic:
      'Autonomous platforms run campaigns across channels, optimising creative and budget with minimal oversight.',
  },
  {
    id: 'media',
    name: 'Media & Entertainment',
    predictive:
      'Predict hit content by analysing viewer trends, informing commissioning and recommendation.',
    generative:
      'Produce content — music, video and imagery — at a fraction of traditional production cost.',
    agentic:
      'Game NPCs act autonomously, carrying unscripted dialogue and adapting to players for dynamic storylines.',
  },
  {
    id: 'telecom',
    name: 'Telecommunications',
    predictive:
      'Flag network failures and predict customer churn so providers can pre-empt outages or retain clients.',
    generative:
      'Chatbots handle common service requests and troubleshoot in natural language, improving response speed.',
    agentic:
      'Self-optimising networks execute thousands of tuning actions autonomously with little human input.',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    predictive:
      'Detect threats proactively by scanning enormous signal volumes to spot attacks earlier.',
    generative:
      'Copilots investigate incidents, summarise attack data and suggest remediation, speeding up response.',
    agentic:
      'Agents monitor networks and isolate breaches or block malware in real time without waiting for approval.',
  },
  {
    id: 'defence',
    name: 'Defence & Aerospace',
    predictive:
      'Predictive maintenance analyses airframe sensor data to predict part failures before missions.',
    generative:
      'Training and simulation — smarter war-game adversaries force trainees to face unscripted tactics.',
    agentic:
      'Autonomous drones and robots coordinate surveillance or response on their own.',
  },
  {
    id: 'mining',
    name: 'Mining & Metals',
    predictive:
      'Predict equipment health, monitoring processes in real time to detect hazards and prevent breakdowns.',
    generative:
      'Summarise geoscience research findings, speeding up knowledge sharing across sites.',
    agentic:
      'Autonomous haul trucks run 24/7 under AI control to move material efficiently.',
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
    blurb: 'Autonomous actions & decisions',
    tone: 'Highest token spend and highest risk-mitigation budget. Benefits land as headcount avoided.',
  },
} as const
