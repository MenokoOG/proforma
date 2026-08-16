import { useState } from 'react'
import { BucketTotal, LineEditor } from '../components/LineEditor'
import { Card, Icon, Note } from '../components/ui'
import { lineTotal } from '../lib/calc'
import { useStore } from '../state/store'

export function Benefits() {
  const { doc, results, dispatch } = useStore()
  const [newLabel, setNewLabel] = useState('')

  const unjustified = doc.benefits.filter((b) => lineTotal(b) > 0 && !b.note.trim())

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 5 of 8</p>
        <h1>What will it be worth?</h1>
        <p>
          Three categories, from easiest to hardest to defend. The number matters less than the
          sentence underneath it — a reviewer will accept a smaller figure with a derivation over
          a larger one without.
        </p>
      </header>

      <Card title="Benefit lines" id="benefits">
        <div className="lines">
          {doc.benefits.map((item) => (
            <LineEditor key={item.id} bucket="benefits" item={item} />
          ))}
        </div>

        <BucketTotal
          label="Total benefit over five years"
          total={results.totalBenefit}
          tone="benefit"
        />

        {unjustified.length ? (
          <Note warn>
            <strong>
              {unjustified.length} line{unjustified.length === 1 ? '' : 's'} carry money but no
              justification
            </strong>{' '}
            ({unjustified.map((u) => u.label).join(', ')}). This is the first thing a sceptical
            reviewer will pull on.
          </Note>
        ) : null}

        <hr className="divider" />

        <div className="btn-row" style={{ alignItems: 'stretch' }}>
          <input
            className="input"
            type="text"
            value={newLabel}
            placeholder="Add another benefit line…"
            aria-label="New benefit line name"
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newLabel.trim()) {
                dispatch({ type: 'addLine', bucket: 'benefits', label: newLabel.trim() })
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
              dispatch({ type: 'addLine', bucket: 'benefits', label: newLabel.trim() })
              setNewLabel('')
            }}
          >
            {Icon.plus(16)} Add
          </button>
        </div>
      </Card>

      <Card title="How to make each one land" sub="What a good justification looks like per category.">
        <dl className="kv">
          <dt>Automation</dt>
          <dd>
            Hours or headcount. &ldquo;Triage time down from 9 to 3 minutes on 40% of volume —
            5.2 FTE equivalent.&rdquo; Name the baseline you measured against.
          </dd>
          <dt>Augmentation</dt>
          <dd>
            Throughput per person. &ldquo;Handlers clear 22% more claims per shift.&rdquo; Say
            whether the extra capacity gets used or just exists.
          </dd>
          <dt>Differentiation</dt>
          <dd>
            Revenue you would not otherwise win. The hardest to defend — show the pipeline, the
            retention model, or the deal you lost last quarter without it.
          </dd>
        </dl>

        <Note warn>
          <strong>Be careful with the second year.</strong> This model assumes annual benefits
          start in Year 2 and hold flat. If yours ramp, put the ramped average in the annual box
          and say so in the justification.
        </Note>
      </Card>
    </>
  )
}
