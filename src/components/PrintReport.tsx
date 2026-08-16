import { DECISION_OPTIONS, RISK_DIMENSIONS } from '../data/decisions'
import { INDUSTRIES } from '../data/industries'
import { PHASES, SWIMLANES, deliverableKey } from '../data/roadmap'
import { STAKEHOLDER_ROLES } from '../data/stakeholders'
import { lineTotal, spread, yearLabels } from '../lib/calc'
import { longDate, money, percent, signedMoney } from '../lib/format'
import { useStore } from '../state/store'
import { CashChart } from './Chart'

/**
 * The paper version of the whole case. Hidden on screen, rendered on print,
 * so "Print / Save as PDF" produces the complete document rather than
 * whichever step happened to be open.
 */
export function PrintReport() {
  const { doc, results, currency, tokenCost } = useStore()
  const labels = yearLabels(doc.project.startDate)
  const p = doc.project
  const industry = INDUSTRIES.find((i) => i.id === doc.useCase.industry)
  const namedStakeholders = STAKEHOLDER_ROLES.filter((r) => (doc.stakeholders[r.id] ?? '').trim())
  const selectedDecisions = doc.decisions.filter((d) => d.selected)

  return (
    <div className="print-report">
      <header style={{ marginBottom: 20 }}>
        <p className="eyebrow">Business case · ProForma</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', lineHeight: 1.15 }}>
          {p.title || 'Untitled initiative'}
        </h1>
        <p style={{ color: 'var(--ink-2)', marginTop: 6 }}>
          {[
            p.businessArea,
            p.facing === 'internal'
              ? 'Internal facing'
              : p.facing === 'external'
                ? 'Client facing'
                : 'Internal and client facing',
            p.sponsors ? `Sponsor: ${p.sponsors}` : '',
            p.proposers ? `Proposed by: ${p.proposers}` : '',
          ]
            .filter(Boolean)
            .join('  ·  ')}
        </p>
      </header>

      {p.proposal ? (
        <section className="card">
          <h2>Proposal</h2>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {p.proposal
              .split('\n')
              .filter((l) => l.trim())
              .map((l, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {l.replace(/^[-•]\s*/, '')}
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Headline</h2>
        <div className="stats" style={{ marginTop: 10 }}>
          <Cell k="Five-year net" v={signedMoney(results.totalNet, currency)} />
          <Cell
            k="Break-even"
            v={results.paybackYear ? `Year ${results.paybackYear}` : 'Never'}
          />
          <Cell k="Peak funding need" v={money(Math.abs(results.peakExposure), currency)} />
          <Cell k="ROI" v={percent(results.roi, 0)} />
          <Cell k="Total cost" v={money(results.totalCost, currency)} />
          <Cell k="Total mitigation" v={money(results.totalMitigation, currency)} />
          <Cell k="Total benefit" v={money(results.totalBenefit, currency)} />
          <Cell
            k={`NPV @ ${p.discountRate}%`}
            v={`${money(results.npv, currency)}${results.irr !== null ? ` · IRR ${percent(results.irr, 1)}` : ''}`}
          />
        </div>
      </section>

      <section className="card">
        <h2>Cash picture</h2>
        <div style={{ marginTop: 10 }}>
          <CashChart results={results} currency={currency} />
        </div>
      </section>

      <section className="card">
        <h2>Five-year model</h2>
        <p className="card-sub">
          One-time amounts fall in Year 1; annual amounts apply to Years 2–5.
        </p>
        <div className="tablewrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">Line</th>
                {labels.map((l) => (
                  <th key={l} scope="col">
                    {l}
                  </th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              <Group label="Costs" />
              {doc.costs.map((i) => (
                <Row key={i.id} item={i} sign={-1} currency={currency} />
              ))}
              <Totals
                label="Total cost"
                cells={results.years.map((y) => -y.cost)}
                total={-results.totalCost}
                currency={currency}
              />
              <Group label="Benefits" />
              {doc.benefits.map((i) => (
                <Row key={i.id} item={i} sign={1} currency={currency} />
              ))}
              <Totals
                label="Total benefit"
                cells={results.years.map((y) => y.benefit)}
                total={results.totalBenefit}
                currency={currency}
              />
              <Group label="Risk mitigations" />
              {doc.mitigations.map((i) => (
                <Row key={i.id} item={i} sign={-1} currency={currency} />
              ))}
              <Totals
                label="Total mitigation"
                cells={results.years.map((y) => -y.mitigation)}
                total={-results.totalMitigation}
                currency={currency}
              />
              <Totals
                label="Net for the year"
                cells={results.years.map((y) => y.net)}
                total={results.totalNet}
                currency={currency}
              />
              <Totals
                label="Running total"
                cells={results.years.map((y) => y.cumulative)}
                total={results.totalNet}
                currency={currency}
              />
            </tbody>
          </table>
        </div>
      </section>

      <Justifications />

      {doc.useCase.seed || industry ? (
        <section className="card">
          <h2>Use case</h2>
          <dl className="kv" style={{ marginTop: 8 }}>
            {industry ? (
              <>
                <dt>Industry</dt>
                <dd>{industry.name}</dd>
              </>
            ) : null}
            {doc.useCase.aiType ? (
              <>
                <dt>Type</dt>
                <dd style={{ textTransform: 'capitalize' }}>{doc.useCase.aiType} AI</dd>
              </>
            ) : null}
            {doc.useCase.seed ? (
              <>
                <dt>Statement</dt>
                <dd>{doc.useCase.seed}</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      {selectedDecisions.length ? (
        <section className="card">
          <h2>Architecture decisions</h2>
          <div className="tablewrap" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Option</th>
                  <th scope="col">Build</th>
                  <th scope="col">Runtime / yr</th>
                  <th scope="col">Elevated risk</th>
                </tr>
              </thead>
              <tbody>
                {selectedDecisions.map((row) => {
                  const opt = DECISION_OPTIONS.find((o) => o.id === row.id)
                  const hot = RISK_DIMENSIONS.filter((d) => row.risks[d.id] >= 3)
                  return (
                    <tr key={row.id}>
                      <th scope="row" style={{ fontWeight: 500 }}>
                        {opt?.label ?? row.id}
                        {row.description ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>
                            {row.description}
                          </div>
                        ) : null}
                      </th>
                      <td>{row.buildCost ? money(row.buildCost, currency) : '—'}</td>
                      <td>
                        {row.runtimeCostEng + row.runtimeCostSupport
                          ? money(row.runtimeCostEng + row.runtimeCostSupport, currency)
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'left', whiteSpace: 'normal' }}>
                        {hot.length
                          ? hot.map((d) => `${d.label} ${row.risks[d.id]}/5`).join('; ')
                          : 'None above 2'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {doc.tokenPlan.linkToCosts ? (
        <section className="card">
          <h2>Inference cost basis</h2>
          <dl className="kv" style={{ marginTop: 8 }}>
            <dt>Annual inference</dt>
            <dd>{money(tokenCost.annual, currency)}</dd>
            <dt>Requests / day</dt>
            <dd>{doc.tokenPlan.requestsPerDay.toLocaleString()}</dd>
            <dt>Tokens per request</dt>
            <dd>
              {doc.tokenPlan.inputTokensPerRequest.toLocaleString()} in ·{' '}
              {doc.tokenPlan.outputTokensPerRequest.toLocaleString()} out
            </dd>
            <dt>Cache hit rate</dt>
            <dd>{doc.tokenPlan.cacheHitRate}%</dd>
            <dt>Overhead allowance</dt>
            <dd>{doc.tokenPlan.overheadPct}% for retries, evals and non-production traffic</dd>
          </dl>
        </section>
      ) : null}

      {namedStakeholders.length ? (
        <section className="card">
          <h2>Stakeholders</h2>
          <dl className="kv" style={{ marginTop: 8 }}>
            {namedStakeholders.map((r) => (
              <div key={r.id} style={{ display: 'contents' }}>
                <dt>{r.label}</dt>
                <dd>{doc.stakeholders[r.id]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="card">
        <h2>Delivery roadmap</h2>
        {PHASES.map((phase) => {
          const st = doc.phases[phase.id]
          const lanes = SWIMLANES.map((lane, laneIndex) => ({
            lane,
            laneIndex,
            items: lane.cells[phase.id] ?? [],
          })).filter((l) => l.items.length > 0)
          return (
            <div key={phase.id} style={{ marginTop: 14, breakInside: 'avoid' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 650 }}>
                {phase.name} — {phase.subtitle}{' '}
                <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>
                  · {longDate(st.date)} · {phase.gate}
                </span>
              </h3>
              {lanes.map(({ lane, laneIndex, items }) => (
                <p key={lane.id} style={{ fontSize: '0.82rem', marginTop: 6 }}>
                  <strong>{lane.label}:</strong>{' '}
                  {items
                    .map((text, itemIndex) =>
                      st.done.includes(deliverableKey(phase.id, laneIndex, itemIndex))
                        ? `${text} ✓`
                        : text,
                    )
                    .join(' · ')}
                </p>
              ))}
              {st.notes ? (
                <p style={{ fontSize: '0.82rem', marginTop: 6, color: 'var(--ink-2)' }}>
                  <em>Notes: {st.notes}</em>
                </p>
              ) : null}
            </div>
          )
        })}
      </section>

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: 20 }}>
        Indicative figures for decision-making, not an audited forecast. One-time amounts fall in
        Year 1; annual amounts apply to Years 2–5. Generated with ProForma on{' '}
        {new Date().toLocaleDateString()}.
      </p>
    </div>
  )
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v" style={{ fontSize: '1.05rem' }}>
        {v}
      </div>
    </div>
  )
}

function Group({ label }: { label: string }) {
  return (
    <tr>
      <th
        scope="rowgroup"
        colSpan={7}
        style={{
          textAlign: 'left',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--ink-3)',
        }}
      >
        {label}
      </th>
    </tr>
  )
}

function Row({
  item,
  sign,
  currency,
}: {
  item: { id: string; label: string; oneTime: number; annual: number }
  sign: 1 | -1
  currency: string
}) {
  const total = lineTotal(item)
  if (total === 0) return null
  const f = (v: number) => (v === 0 ? '—' : sign === 1 ? money(v, currency) : `−${money(v, currency)}`)
  return (
    <tr>
      <th scope="row" style={{ fontWeight: 400 }}>
        {item.label}
      </th>
      {spread(item).map((v, i) => (
        <td key={i}>{f(v)}</td>
      ))}
      <td>{f(total)}</td>
    </tr>
  )
}

function Totals({
  label,
  cells,
  total,
  currency,
}: {
  label: string
  cells: number[]
  total: number
  currency: string
}) {
  return (
    <tr className="total">
      <th scope="row">{label}</th>
      {cells.map((v, i) => (
        <td key={i}>{v === 0 ? '—' : signedMoney(v, currency)}</td>
      ))}
      <td>{signedMoney(total, currency)}</td>
    </tr>
  )
}

function Justifications() {
  const { doc, currency } = useStore()
  const items = [...doc.costs, ...doc.benefits, ...doc.mitigations].filter(
    (i) => lineTotal(i) > 0 && i.note.trim(),
  )
  if (!items.length) return null
  return (
    <section className="card">
      <h2>Justifications</h2>
      <dl className="kv" style={{ marginTop: 8 }}>
        {items.map((i) => (
          <div key={i.id} style={{ display: 'contents' }}>
            <dt>
              {i.label}
              <br />
              <span style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                {money(lineTotal(i), currency)}
              </span>
            </dt>
            <dd>{i.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
