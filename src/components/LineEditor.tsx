import { lineTotal, spread, yearLabels } from '../lib/calc'
import { money, signedMoney } from '../lib/format'
import type { LineItem } from '../lib/types'
import { useStore } from '../state/store'
import { Icon, MoneyField, TextArea } from './ui'

type Bucket = 'costs' | 'benefits' | 'mitigations'
type Tone = 'cost' | 'benefit' | 'risk'

const TONE: Record<Bucket, Tone> = {
  costs: 'cost',
  benefits: 'benefit',
  mitigations: 'risk',
}

/**
 * A single line item: collapsed it shows the five-year total; expanded it
 * shows the one-time / annual split, the year-by-year spread, and the
 * justification box. The justification is the part reviewers actually read,
 * so it gets full width rather than being tucked into a tooltip.
 */
export function LineEditor({
  bucket,
  item,
  defaultOpen,
  locked,
  lockNote,
}: {
  bucket: Bucket
  item: LineItem
  defaultOpen?: boolean
  locked?: boolean
  lockNote?: string
}) {
  const { dispatch, currency, doc } = useStore()
  const tone = TONE[bucket]
  const total = lineTotal(item)
  const cells = spread(item)
  const labels = yearLabels(doc.project.startDate)
  const symbol = money(0, currency).replace(/[\d.,\s]/g, '') || '$'

  const patch = (p: Partial<LineItem>) =>
    dispatch({ type: 'line', bucket, id: item.id, patch: p })

  return (
    <details className="lineitem" open={defaultOpen || total > 0}>
      <summary>
        <span className="chev" aria-hidden="true">
          {Icon.chevronRight(16)}
        </span>
        <span className="line-title">
          <strong>{item.label}</strong>
          <span>{item.note.trim() || item.hint}</span>
        </span>
        <span className={`line-total ${total === 0 ? 'zero' : tone}`}>
          {total === 0 ? '—' : bucket === 'benefits' ? money(total, currency) : `−${money(total, currency)}`}
        </span>
      </summary>

      <div className="body">
        {item.hint ? <p className="field-hint" style={{ marginBottom: 12 }}>{item.hint}</p> : null}

        {locked ? (
          <p className="note" style={{ marginBottom: 12 }}>
            {lockNote}
          </p>
        ) : null}

        <div className="grid-2">
          <MoneyField
            label="One-time"
            hint="Lands in Year 1."
            value={item.oneTime}
            onChange={(v) => patch({ oneTime: v })}
            symbol={symbol}
          />
          <MoneyField
            label="Annual"
            hint="Applies to Years 2–5."
            value={item.annual}
            onChange={(v) => patch({ annual: v })}
            symbol={symbol}
          />
        </div>

        <TextArea
          label={bucket === 'benefits' ? 'Justification' : 'Description of work'}
          hint={
            bucket === 'benefits'
              ? 'What is the business impact, and what number is the saving derived from? A reviewer will ask.'
              : 'What is being bought, and why is this the right amount?'
          }
          value={item.note}
          onChange={(v) => patch({ note: v })}
          rows={3}
          placeholder={
            bucket === 'benefits'
              ? 'e.g. 5.2 FTE equivalent — triage time down from 9 to 3 minutes on 40% of volume.'
              : 'e.g. Four FTE for the build year, two thereafter.'
          }
        />

        <div className="spread" role="group" aria-label={`${item.label} five-year spread`}>
          {cells.map((v, i) => (
            <div className="cell" key={i}>
              <span className="y">{labels[i].replace(/ \(.*\)/, '').replace('Year ', 'Y')}</span>
              <span className="v">
                {v === 0 ? '—' : bucket === 'benefits' ? money(v, currency) : `−${money(v, currency)}`}
              </span>
            </div>
          ))}
        </div>

        {item.custom ? (
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn small danger"
              onClick={() => dispatch({ type: 'removeLine', bucket, id: item.id })}
            >
              {Icon.trash(15)} Remove line
            </button>
          </div>
        ) : null}
      </div>
    </details>
  )
}

/** Bucket footer showing the five-year total for a group of lines. */
export function BucketTotal({
  label,
  total,
  tone,
}: {
  label: string
  total: number
  tone: Tone
}) {
  const { currency } = useStore()
  return (
    <div className={`bucket-total ${tone}`}>
      <span className="k">{label}</span>
      <span className="v" aria-live="polite">
        {tone === 'benefit' ? signedMoney(total, currency) : signedMoney(-total, currency)}
      </span>
    </div>
  )
}
