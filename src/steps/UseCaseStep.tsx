import { AI_TYPE_META, INDUSTRIES } from '../data/industries'
import type { AiType } from '../lib/types'
import { useStore } from '../state/store'
import { Card, Icon, Note, SelectField, TextArea } from '../components/ui'

const TYPES: AiType[] = ['predictive', 'generative', 'agentic']

export function UseCaseStep() {
  const { doc, dispatch } = useStore()
  const uc = doc.useCase
  const industry = INDUSTRIES.find((i) => i.id === uc.industry)

  const choose = (type: AiType) => {
    const seed = industry ? industry[type] : ''
    dispatch({ type: 'useCase', patch: { aiType: type, seed } })
  }

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 2 of 8</p>
        <h1>Anchor it to a real use case</h1>
        <p>
          Twenty industries, three flavours of AI each. Pick the closest match to sanity-check
          your framing and to give reviewers a reference point they already believe.
        </p>
      </header>

      <Card title="Industry">
        <SelectField
          label="Closest industry"
          hint="Pick the one whose economics look most like yours, not necessarily your job title."
          value={uc.industry}
          onChange={(v) =>
            dispatch({ type: 'useCase', patch: { industry: v, aiType: '', seed: '' } })
          }
          options={[
            { value: '', label: 'Select an industry…' },
            ...INDUSTRIES.map((i) => ({ value: i.id, label: i.name })),
          ]}
        />
      </Card>

      {industry ? (
        <Card
          title="Which kind of AI is this?"
          sub="The three categories behave very differently on cost. This choice should change what you budget."
        >
          <div className="choice-grid">
            {TYPES.map((t) => {
              const meta = AI_TYPE_META[t]
              const on = uc.aiType === t
              return (
                <button
                  key={t}
                  type="button"
                  className="choice"
                  aria-pressed={on}
                  onClick={() => choose(t)}
                >
                  <span className="t">
                    {meta.label}
                    {on ? <span className="tick">{Icon.check(16)}</span> : null}
                  </span>
                  <span className="b">{meta.blurb}</span>
                  <span className="d">{industry[t]}</span>
                </button>
              )
            })}
          </div>

          {uc.aiType ? (
            <Note warn>
              <strong>Cost shape:</strong> {AI_TYPE_META[uc.aiType].tone}
            </Note>
          ) : null}
        </Card>
      ) : (
        <Card>
          <p className="prose">
            <span className="badge">Optional</span> You can skip this step entirely and go
            straight to the numbers. It exists because most weak business cases fail on
            &ldquo;what is this actually for&rdquo;, not on arithmetic.
          </p>
        </Card>
      )}

      {uc.aiType ? (
        <Card
          title="Your version of it"
          sub="Adapt the reference example into a sentence about your business. This carries through to the export."
        >
          <TextArea
            label="Use case statement"
            value={uc.seed}
            onChange={(v) => dispatch({ type: 'useCase', patch: { seed: v } })}
            rows={4}
          />
        </Card>
      ) : null}

      {industry ? (
        <Card
          title="The other two, for contrast"
          sub="Worth a glance — the cheaper option is sometimes the right one."
        >
          <dl className="kv">
            {TYPES.filter((t) => t !== uc.aiType).map((t) => (
              <div key={t} style={{ display: 'contents' }}>
                <dt>{AI_TYPE_META[t].label}</dt>
                <dd>{industry[t]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}
    </>
  )
}
