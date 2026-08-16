import { DECISION_OPTIONS, RISK_DIMENSIONS, RISK_LABELS } from '../data/decisions'
import { TOKEN_MODELS, WORKLOAD_PRESETS } from '../data/models'
import { rollupDecisions } from '../lib/calc'
import { compactNumber, integer, money, preciseMoney } from '../lib/format'
import type { DecisionRow, RiskScore } from '../lib/types'
import { useStore } from '../state/store'
import {
  Card,
  Icon,
  MoneyField,
  Note,
  NumberField,
  SelectField,
  Stat,
  TextArea,
  TextField,
} from '../components/ui'

const GROUPS = ['Models', 'Optimisations', 'Infrastructure'] as const

export function Architecture() {
  const { doc, currency } = useStore()
  const rollup = rollupDecisions(doc.decisions)

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 3 of 8</p>
        <h1>Architecture &amp; inference cost</h1>
        <p>
          The cross-functional decision matrix, plus a token model so the &ldquo;AI API&rdquo;
          line is a calculation rather than a guess. This is where most business cases quietly go
          wrong.
        </p>
      </header>

      <TokenCalculator />

      <Card
        title="Decision matrix"
        sub="Score each option you are seriously considering. The risk columns have owners for a reason — they are not an engineering judgement."
      >
        <div className="stats" style={{ marginBottom: 16 }}>
          <Stat label="Options selected" value={String(rollup.selectedCount)} />
          <Stat
            label="Build cost"
            value={rollup.buildCost ? money(rollup.buildCost, currency) : '—'}
            sub="Sum across selected options"
          />
          <Stat
            label="Runtime / yr"
            value={rollup.runtimeCost ? money(rollup.runtimeCost, currency) : '—'}
            sub="Engineering + support"
          />
          <Stat
            label="Mean risk"
            value={rollup.scoredCells ? `${rollup.averageRisk.toFixed(1)} / 5` : '—'}
            sub={rollup.scoredCells ? `Peak ${rollup.peakRisk} of 5` : 'Nothing scored yet'}
            tone={rollup.averageRisk >= 3.5 ? 'neg' : undefined}
          />
        </div>

        <Note>
          These figures are a <strong>cross-check, not a feed</strong>. They deliberately do not
          write into the cost lines — you decide how much of a build estimate belongs in
          Engineering versus Data Science on the next step.
        </Note>

        {GROUPS.map((group) => (
          <div key={group} style={{ marginTop: 20 }}>
            <h3
              style={{
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--ink-3)',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {group}
            </h3>
            {DECISION_OPTIONS.filter((o) => o.group === group).map((opt) => {
              const row = doc.decisions.find((d) => d.id === opt.id)
              if (!row) return null
              return <DecisionCard key={opt.id} option={opt} row={row} />
            })}
          </div>
        ))}
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ */

function DecisionCard({
  option,
  row,
}: {
  option: (typeof DECISION_OPTIONS)[number]
  row: DecisionRow
}) {
  const { dispatch, currency } = useStore()
  const symbol = money(0, currency).replace(/[\d.,\s]/g, '') || '$'
  const patch = (p: Partial<DecisionRow>) => dispatch({ type: 'decision', id: row.id, patch: p })

  return (
    <details className={`decision${row.selected ? ' on' : ''}`} open={row.selected}>
      <summary>
        <span
          role="switch"
          tabIndex={0}
          aria-checked={row.selected}
          aria-label={`Consider ${option.label}`}
          className="switch"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            patch({ selected: !row.selected })
          }}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              patch({ selected: !row.selected })
            }
          }}
        />
        <span className="decision-title">
          <strong>{option.label}</strong>
          <span>{option.hint}</span>
        </span>
        <span className="chev" aria-hidden="true">
          {Icon.chevronRight(16)}
        </span>
      </summary>

      <div className="body">
        <TextField
          label="Description"
          value={row.description}
          onChange={(v) => patch({ description: v })}
          placeholder="Which specific model / library / vendor, and in what configuration?"
        />

        <div className="grid-3">
          <MoneyField
            label="Build cost"
            hint="Engineering & Data Science"
            value={row.buildCost}
            onChange={(v) => patch({ buildCost: v })}
            symbol={symbol}
          />
          <MoneyField
            label="Runtime — engineering"
            hint="Per year"
            value={row.runtimeCostEng}
            onChange={(v) => patch({ runtimeCostEng: v })}
            symbol={symbol}
          />
          <MoneyField
            label="Runtime — support"
            hint="Support & Operations"
            value={row.runtimeCostSupport}
            onChange={(v) => patch({ runtimeCostSupport: v })}
            symbol={symbol}
          />
        </div>

        <div className="grid-2">
          <TextField
            label="Impact on commercial metrics"
            value={row.impactCommercial}
            onChange={(v) => patch({ impactCommercial: v })}
            placeholder="Owner: Data Science"
          />
          <TextField
            label="Impact on product"
            value={row.impactProduct}
            onChange={(v) => patch({ impactProduct: v })}
            placeholder="Owner: Product"
          />
          <TextField
            label="Impact on sales"
            value={row.impactSales}
            onChange={(v) => patch({ impactSales: v })}
            placeholder="Owner: Sales & Marketing"
          />
          <TextField
            label="Non-dollar benefits"
            value={row.nonDollarBenefits}
            onChange={(v) => patch({ nonDollarBenefits: v })}
            placeholder="Morale, retention, optionality, speed to learn"
          />
        </div>

        <hr className="divider" />

        <p className="field-label">Risks</p>
        <p className="field-hint" style={{ marginBottom: 10 }}>
          0 = not assessed, 1 = low, 5 = severe. An unassessed row is not the same as a low one.
        </p>
        <div className="risk-grid">
          {RISK_DIMENSIONS.map((dim) => {
            const value = row.risks[dim.id]
            return (
              <div className="risk-row" key={dim.id}>
                <span className="rl">
                  <b>{dim.label}</b>
                  <em>Owner: {dim.owner}</em>
                </span>
                <span
                  className="scale"
                  role="group"
                  aria-label={`${dim.label} risk score, currently ${RISK_LABELS[value]}`}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      data-v={v}
                      aria-pressed={value === v}
                      title={RISK_LABELS[v]}
                      onClick={() =>
                        dispatch({
                          type: 'risk',
                          id: row.id,
                          dimension: dim.id,
                          value: (value === v ? 0 : v) as RiskScore,
                        })
                      }
                    >
                      {v}
                      <span className="visually-hidden"> — {RISK_LABELS[v]}</span>
                    </button>
                  ))}
                </span>
              </div>
            )
          })}
        </div>

        <hr className="divider" />

        <TextArea
          label="Recommendation"
          hint="One or two sentences a sponsor can repeat back."
          value={row.recommendation}
          onChange={(v) => patch({ recommendation: v })}
          rows={2}
        />
      </div>
    </details>
  )
}

/* ------------------------------------------------------------------ */

function TokenCalculator() {
  const { doc, dispatch, tokenCost, currency } = useStore()
  const plan = doc.tokenPlan
  const set = (patch: Partial<typeof plan>) => dispatch({ type: 'tokenPlan', patch })
  const model = TOKEN_MODELS.find((m) => m.id === plan.modelId)
  const isCustom = plan.modelId === 'custom'

  return (
    <Card
      title="Inference cost model"
      sub="Work out what the tokens actually cost before you put a number in the cost sheet."
    >
      <div className="grid-2">
        <SelectField
          label="Model"
          hint={model?.note}
          value={plan.modelId}
          onChange={(v) => set({ modelId: v })}
          options={TOKEN_MODELS.map((m) => ({
            value: m.id,
            label: m.custom ? m.name : `${m.name} — $${m.inputPerM} / $${m.outputPerM} per 1M`,
          }))}
        />
        <SelectField
          label="Workload shape"
          hint="Sets typical token volumes. Adjust them afterwards."
          value=""
          onChange={(v) => {
            const preset = WORKLOAD_PRESETS.find((p) => p.id === v)
            if (preset)
              set({
                inputTokensPerRequest: preset.inputTokensPerRequest,
                outputTokensPerRequest: preset.outputTokensPerRequest,
                cacheHitRate: preset.cacheHitRate,
              })
          }}
          options={[
            { value: '', label: 'Apply a preset…' },
            ...WORKLOAD_PRESETS.map((p) => ({ value: p.id, label: p.label })),
          ]}
        />
      </div>

      {isCustom ? (
        <>
          <Note warn>
            Look these rates up on the provider&rsquo;s own pricing page. ProForma does not ship
            estimated third-party prices — a case built on a guessed rate is worse than one built
            on a rate you checked.
          </Note>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <NumberField
              label="Input rate"
              hint="USD per 1M input tokens"
              value={plan.customInputPerM}
              onChange={(v) => set({ customInputPerM: v })}
              suffix="/1M"
              min={0}
            />
            <NumberField
              label="Output rate"
              hint="USD per 1M output tokens"
              value={plan.customOutputPerM}
              onChange={(v) => set({ customOutputPerM: v })}
              suffix="/1M"
              min={0}
            />
          </div>
        </>
      ) : null}

      <div className="grid-3">
        <NumberField
          label="Requests per day"
          hint="For an agent, one task is one request."
          value={plan.requestsPerDay}
          onChange={(v) => set({ requestsPerDay: v })}
          min={0}
        />
        <NumberField
          label="Input tokens / request"
          hint="Prompt, history, retrieved context."
          value={plan.inputTokensPerRequest}
          onChange={(v) => set({ inputTokensPerRequest: v })}
          min={0}
        />
        <NumberField
          label="Output tokens / request"
          hint="What the model writes back."
          value={plan.outputTokensPerRequest}
          onChange={(v) => set({ outputTokensPerRequest: v })}
          min={0}
        />
        <NumberField
          label="Prompt cache hit rate"
          hint="Cached input bills at about a tenth. The single biggest lever here."
          value={plan.cacheHitRate}
          onChange={(v) => set({ cacheHitRate: v })}
          suffix="%"
          min={0}
          max={100}
        />
        <NumberField
          label="Operating days / year"
          hint="365 for always-on, ~250 for business days."
          value={plan.daysPerYear}
          onChange={(v) => set({ daysPerYear: v })}
          min={1}
          max={366}
        />
        <NumberField
          label="Overhead"
          hint="Retries, evals, dev and staging traffic. 20–30% is realistic."
          value={plan.overheadPct}
          onChange={(v) => set({ overheadPct: v })}
          suffix="%"
          min={0}
          max={500}
        />
      </div>

      <div className="calc-out">
        <div className="calc-hero">
          <span className="k">Annual inference cost</span>
          <span className="v" aria-live="polite">
            {money(tokenCost.annual, currency)}
          </span>
        </div>

        <div className="breakdown">
          <div className="row">
            <span>Requests per year</span>
            <span>{compactNumber(tokenCost.requestsPerYear)}</span>
          </div>
          <div className="row">
            <span>Input tokens per year</span>
            <span>{compactNumber(tokenCost.inputTokensPerYear)}</span>
          </div>
          <div className="row">
            <span>Output tokens per year</span>
            <span>{compactNumber(tokenCost.outputTokensPerYear)}</span>
          </div>
          <div className="row">
            <span>Input cost (after caching)</span>
            <span>{money(tokenCost.inputCost, currency)}</span>
          </div>
          <div className="row">
            <span>Output cost</span>
            <span>{money(tokenCost.outputCost, currency)}</span>
          </div>
          {tokenCost.cacheSaving > 0 ? (
            <div className="row saving">
              <span>Saved by prompt caching</span>
              <span>−{money(tokenCost.cacheSaving, currency)}</span>
            </div>
          ) : null}
          <div className="row">
            <span>Overhead ({integer(plan.overheadPct)}%)</span>
            <span>{money(tokenCost.overhead, currency)}</span>
          </div>
          <div className="row sum">
            <span>Cost per 1,000 requests</span>
            <span>{preciseMoney(tokenCost.perThousandRequests, currency)}</span>
          </div>
        </div>
      </div>

      <label className="check" style={{ marginTop: 12 }}>
        <input
          type="checkbox"
          checked={plan.linkToCosts}
          onChange={(e) => set({ linkToCosts: e.target.checked })}
        />
        <span>
          Drive the <strong>&ldquo;AI API / inference&rdquo;</strong> annual cost line from this
          calculation. Untick to enter that figure by hand.
        </span>
      </label>

      {plan.linkToCosts ? (
        <Note>
          The AI API cost line is currently locked to{' '}
          <strong>{money(Math.round(tokenCost.annual), currency)} per year</strong>. Change any
          input above and the five-year model updates with it.
        </Note>
      ) : null}
    </Card>
  )
}
