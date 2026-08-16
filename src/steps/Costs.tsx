import { useState } from 'react'
import { BucketTotal, LineEditor } from '../components/LineEditor'
import { Card, Icon, Note } from '../components/ui'
import { money } from '../lib/format'
import { useStore } from '../state/store'

export function Costs() {
  const { doc, results, dispatch, currency, tokenCost } = useStore()
  const [newLabel, setNewLabel] = useState('')

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 4 of 8</p>
        <h1>What will it cost?</h1>
        <p>
          Seven categories, each with a one-time and an annual figure. Leave a line at zero if it
          genuinely does not apply — but a business case with four empty cost lines invites the
          question of what you have missed.
        </p>
      </header>

      <Note>
        <strong>How amounts spread:</strong> the one-time figure lands entirely in Year 1; the
        annual figure applies to Years 2 through 5. So 30,000 one-time plus 10,000 annual totals
        70,000 across five years.
      </Note>

      <Card title="Cost lines" id="costs">
        <div className="lines">
          {doc.costs.map((item) => (
            <LineEditor
              key={item.id}
              bucket="costs"
              item={item}
              locked={item.id === 'ai-api' && doc.tokenPlan.linkToCosts}
              lockNote={`This line is driven by the inference cost model on the Architecture step (${money(
                Math.round(tokenCost.annual),
                currency,
              )} per year). Untick the link there to edit it directly.`}
            />
          ))}
        </div>

        <BucketTotal label="Total cost over five years" total={results.totalCost} tone="cost" />

        <hr className="divider" />

        <div className="btn-row" style={{ alignItems: 'stretch' }}>
          <input
            className="input"
            type="text"
            value={newLabel}
            placeholder="Add another cost line…"
            aria-label="New cost line name"
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newLabel.trim()) {
                dispatch({ type: 'addLine', bucket: 'costs', label: newLabel.trim() })
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
              dispatch({ type: 'addLine', bucket: 'costs', label: newLabel.trim() })
              setNewLabel('')
            }}
          >
            {Icon.plus(16)} Add
          </button>
        </div>
      </Card>

      <Card title="A sense check" sub="Common omissions, in the order people forget them.">
        <ul className="prose" style={{ paddingLeft: 20 }}>
          <li>Evaluation harness and the people to keep it current.</li>
          <li>Human review of model output during the first year of operation.</li>
          <li>Re-training or re-indexing when the underlying data shifts.</li>
          <li>Legal and compliance review time, not just the mitigation budget.</li>
          <li>Change management: training, comms, and the productivity dip while people adjust.</li>
          <li>The cost of the version you build and then throw away.</li>
        </ul>
      </Card>
    </>
  )
}
