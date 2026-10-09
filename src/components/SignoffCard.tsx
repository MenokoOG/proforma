import { useId, useMemo, useState } from 'react'
import { money, signedMoney } from '../lib/format'
import {
  buildSignoff,
  DECISION_LABEL,
  shortId,
  SIGNOFF_DISCLAIMER,
  signoffProblem,
  signoffStatus,
} from '../lib/signoff'
import type { SignoffDecision } from '../lib/types'
import { useStore } from '../state/store'
import { Card, Note, Segmented, TextArea, TextField } from './ui'

const ROLES = ['Sponsor', 'Finance', 'Risk', 'Legal', 'Security', 'Engineering', 'Product']

/**
 * Records who approved the case and when. Each entry carries a fingerprint of
 * the case as it stood, so an edit made afterwards shows the entry as out of
 * date. Entries are only ever added; a later one supersedes an earlier one.
 */
export function SignoffCard() {
  const { doc, results, currency, dispatch } = useStore()
  const status = useMemo(() => signoffStatus(doc), [doc])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [decision, setDecision] = useState<SignoffDecision>('approved')
  const [conditions, setConditions] = useState('')
  const [problem, setProblem] = useState('')
  const roleList = useId()

  const record = () => {
    const input = { name, role, decision, conditions }
    const issue = signoffProblem(input)
    if (issue) {
      setProblem(issue)
      return
    }
    dispatch({ type: 'signoff', entry: buildSignoff(doc, results, input) })
    setProblem('')
    setConditions('')
  }

  const entries = [...(doc.signoffs ?? [])].reverse()

  return (
    <Card
      title="Sign-off"
      sub="Record who approved this case and when. An edit afterwards marks the approval out of date."
    >
      {entries.length ? (
        <ul className="signoffs">
          {entries.map((s) => {
            const current = s.fingerprint === status.fingerprint
            return (
              <li key={s.id}>
                <p>
                  <strong>{s.name}</strong>, {s.role}{' '}
                  <span className={`badge${current ? ' brand' : ''}`}>
                    {current ? 'Applies to this version' : 'Out of date'}
                  </span>
                </p>
                <p className="field-hint">
                  {DECISION_LABEL[s.decision]} · {s.at.slice(0, 16).replace('T', ' ')} UTC · case{' '}
                  {shortId(s.fingerprint)}
                </p>
                {s.conditions ? <p>Conditions: {s.conditions}</p> : null}
                <p className="field-hint">
                  Approved figures: five-year net {signedMoney(s.figures.totalNet, currency)}, NPV{' '}
                  {money(s.figures.npv, currency)}, break-even{' '}
                  {s.figures.paybackYear ? `Year ${s.figures.paybackYear}` : 'never'}.
                </p>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="field-hint">No sign-off recorded.</p>
      )}

      <div className="grid-2" style={{ marginTop: 14 }}>
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. J. Ruiz" />
        <div>
          <TextField
            label="Role"
            value={role}
            onChange={setRole}
            placeholder="e.g. Finance"
            list={roleList}
          />
          <datalist id={roleList}>
            {ROLES.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>
      <Segmented
        label="Decision"
        value={decision}
        onChange={setDecision}
        options={(Object.keys(DECISION_LABEL) as SignoffDecision[]).map((d) => ({
          value: d,
          label: DECISION_LABEL[d],
        }))}
      />
      {decision !== 'approved' ? (
        <TextArea
          label={decision === 'declined' ? 'Reason (optional)' : 'Conditions'}
          value={conditions}
          onChange={setConditions}
          rows={3}
        />
      ) : null}
      {problem ? (
        <p className="field-hint" role="alert" style={{ marginTop: 8 }}>
          {problem}
        </p>
      ) : null}
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn primary" onClick={record}>
          Record sign-off
        </button>
      </div>

      <Note>
        <strong>What this is.</strong> {SIGNOFF_DISCLAIMER} Case fingerprint now:{' '}
        <code>{shortId(status.fingerprint)}</code>. Roadmap ticks are not part of it.
      </Note>
    </Card>
  )
}
