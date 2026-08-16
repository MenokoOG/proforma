import { useState } from 'react'
import { BucketTotal, LineEditor } from '../components/LineEditor'
import { Card, Icon, Note, Stat } from '../components/ui'
import { RISK_DIMENSIONS, DECISION_OPTIONS } from '../data/decisions'
import { rollupDecisions } from '../lib/calc'
import { money } from '../lib/format'
import { useStore } from '../state/store'

export function Risks() {
  const { doc, results, dispatch, currency } = useStore()
  const [newLabel, setNewLabel] = useState('')
  const rollup = rollupDecisions(doc.decisions)

  // Surface the highest-scored risk cells from the architecture step so the
  // mitigation budget has something concrete to answer.
  const hotspots = doc.decisions
    .filter((d) => d.selected)
    .flatMap((d) =>
      RISK_DIMENSIONS.map((dim) => ({
        option: DECISION_OPTIONS.find((o) => o.id === d.id)?.label ?? d.id,
        dimension: dim.label,
        score: d.risks[dim.id],
      })),
    )
    .filter((h) => h.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 6 of 8</p>
        <h1>What could go wrong, and what will you spend on it?</h1>
        <p>
          Mitigations are costs. They reduce the net just like any other line — which is the
          point. A case with no mitigation budget is not a low-risk case, it is an unexamined one.
        </p>
      </header>

      {hotspots.length ? (
        <Card
          title="Carried over from your architecture scoring"
          sub="Every dimension you scored 3 or above. These are what the mitigation budget below should be answering."
        >
          <ul className="gaps">
            {hotspots.map((h, i) => (
              <li key={i} className={`gap ${h.score >= 4 ? 'blocker' : 'warning'}`}>
                <span className="tagword">{h.score}/5</span>
                <span className="msg">
                  <strong>{h.dimension}</strong> — {h.option}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Note warn>
          You have not scored any risk dimensions above 2 on the Architecture step. Either the
          initiative is genuinely low-risk, or the scoring has not had a cross-functional pass
          yet.
        </Note>
      )}

      <Card title="Mitigation lines" id="mitigations">
        <div className="lines">
          {doc.mitigations.map((item) => (
            <LineEditor key={item.id} bucket="mitigations" item={item} />
          ))}
        </div>

        <BucketTotal
          label="Total mitigation over five years"
          total={results.totalMitigation}
          tone="risk"
        />

        <hr className="divider" />

        <div className="btn-row" style={{ alignItems: 'stretch' }}>
          <input
            className="input"
            type="text"
            value={newLabel}
            placeholder="Add another mitigation line…"
            aria-label="New mitigation line name"
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newLabel.trim()) {
                dispatch({ type: 'addLine', bucket: 'mitigations', label: newLabel.trim() })
                setNewLabel('')
              }
            }}
            style={{ flex: '1 1 220px' }}
          />
          <button
            type="button"
            className="btn"
            disabled={!newLabel.trim()}
            onClick={() => {
              dispatch({ type: 'addLine', bucket: 'mitigations', label: newLabel.trim() })
              setNewLabel('')
            }}
          >
            {Icon.plus(16)} Add
          </button>
        </div>
      </Card>

      <Card title="Where you stand">
        <div className="stats">
          <Stat
            label="Mitigation as % of cost"
            value={
              results.totalCost > 0
                ? `${((results.totalMitigation / results.totalCost) * 100).toFixed(0)}%`
                : '—'
            }
            sub="10–20% is a common range"
          />
          <Stat
            label="Mean risk score"
            value={rollup.scoredCells ? `${rollup.averageRisk.toFixed(1)} / 5` : '—'}
            sub={`${rollup.scoredCells} dimension${rollup.scoredCells === 1 ? '' : 's'} scored`}
            tone={rollup.averageRisk >= 3.5 ? 'neg' : undefined}
          />
          <Stat
            label="Total mitigation"
            value={money(results.totalMitigation, currency)}
            sub="Five-year"
          />
          <Stat
            label="Total outlay"
            value={money(results.totalCost + results.totalMitigation, currency)}
            sub="Cost plus mitigation"
            tone="neg"
          />
        </div>
      </Card>
    </>
  )
}
