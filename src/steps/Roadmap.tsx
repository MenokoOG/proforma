import { useState } from 'react'
import { PHASES, SWIMLANES, deliverableKey, totalDeliverables } from '../data/roadmap'
import { longDate } from '../lib/format'
import { useStore } from '../state/store'
import { Card, Field, Note, TextArea } from '../components/ui'

export function Roadmap() {
  const { doc, dispatch } = useStore()
  const [active, setActive] = useState(0)
  const phase = PHASES[active]
  const state = doc.phases[active]
  const total = totalDeliverables(active)
  const done = state.done.length
  const overallDone = doc.phases.reduce((a, p) => a + p.done.length, 0)
  const overallTotal = PHASES.reduce((a, p) => a + totalDeliverables(p.id), 0)

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 8 of 8</p>
        <h1>Delivery roadmap</h1>
        <p>
          Six phase gates across seven swimlanes, from the end-to-end delivery roadmap. Phase 0 is
          governance only — deliberately. Nothing else starts until the business case you just
          built is approved.
        </p>
      </header>

      <Card>
        <div className="stats">
          <div className="stat">
            <div className="k">Overall progress</div>
            <div className="v">
              {overallDone}
              <span style={{ fontSize: '0.55em', color: 'var(--ink-3)' }}> / {overallTotal}</span>
            </div>
            <div className="s">deliverables ticked</div>
          </div>
          <div className="stat">
            <div className="k">Current gate</div>
            <div className="v prose">{phase.subtitle}</div>
            <div className="s">{longDate(state.date)}</div>
          </div>
          <div className="stat" style={{ gridColumn: '1 / -1' }}>
            <div className="k">The question this gate answers</div>
            <div className="v prose">{phase.gate}</div>
          </div>
        </div>
      </Card>

      <div
        className="phase-tabs"
        role="tablist"
        aria-label="Delivery phases"
        style={{ marginBottom: 16 }}
      >
        {PHASES.map((p, i) => {
          const t = totalDeliverables(p.id)
          const d = doc.phases[i].done.length
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              id={`phase-tab-${p.id}`}
              aria-selected={active === i}
              aria-controls={`phase-panel-${p.id}`}
              className="phase-tab"
              onClick={() => setActive(i)}
            >
              <span className="p">{p.name}</span>
              <span className="n">{p.subtitle}</span>
              <span className="c">{t === 0 ? '—' : `${d}/${t}`}</span>
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`phase-panel-${phase.id}`}
        aria-labelledby={`phase-tab-${phase.id}`}
      >
        <Card
          title={`${phase.name} — ${phase.subtitle}`}
          sub={`${done} of ${total} deliverables complete.`}
        >
          <div className="grid-2">
            <Field label="Gate date" hint="When this phase must be signed off.">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="date"
                  value={state.date}
                  onChange={(e) =>
                    dispatch({ type: 'phase', index: active, patch: { date: e.target.value } })
                  }
                />
              )}
            </Field>
            <div className="field">
              <span className="field-label">Progress</span>
              <div className="progressbar" style={{ borderRadius: 3, marginTop: 14 }}>
                <div style={{ width: total ? `${(done / total) * 100}%` : '0%' }} />
              </div>
              <p className="field-hint" style={{ marginTop: 8 }}>
                {total
                  ? `${Math.round((done / total) * 100)}% complete`
                  : 'No deliverables in this phase.'}
              </p>
            </div>
          </div>

          <div className="lanes">
            {SWIMLANES.map((lane, laneIndex) => {
              const items = lane.cells[active] ?? []
              if (items.length === 0) return null
              return (
                <section className="lane" key={lane.id}>
                  <h3>{lane.label}</h3>
                  <ul>
                    {items.map((text, itemIndex) => {
                      const key = deliverableKey(active, laneIndex, itemIndex)
                      const checked = state.done.includes(key)
                      return (
                        <li key={key}>
                          <label className={`check${checked ? ' done' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                dispatch({ type: 'toggleDeliverable', index: active, key })
                              }
                            />
                            <span>{text}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>

          {active === 0 ? (
            <Note>
              <strong>Phase 0 has one swimlane on purpose.</strong> Data science, engineering and
              business work do not appear until Phase 1, because none of it should start before
              the budget and stakeholders are approved.
            </Note>
          ) : null}

          <hr className="divider" />

          <TextArea
            label="Phase notes"
            hint="Decisions taken, blockers, anything the next gate review needs."
            value={state.notes}
            onChange={(v) => dispatch({ type: 'phase', index: active, patch: { notes: v } })}
            rows={3}
          />
        </Card>
      </div>

      <Card title="All six gates" sub="The dates you have set, in sequence.">
        <dl className="kv">
          {PHASES.map((p, i) => {
            const t = totalDeliverables(p.id)
            const d = doc.phases[i].done.length
            return (
              <div key={p.id} style={{ display: 'contents' }}>
                <dt>
                  {p.name} · {p.subtitle}
                </dt>
                <dd>
                  {longDate(doc.phases[i].date)}
                  {t > 0 ? (
                    <span className="badge" style={{ marginLeft: 8 }}>
                      {d}/{t}
                    </span>
                  ) : null}
                </dd>
              </div>
            )
          })}
        </dl>
      </Card>
    </>
  )
}
