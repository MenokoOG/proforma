import { CashChart } from '../components/Chart'
import { Card, Icon, Stat } from '../components/ui'
import { lineTotal, spread } from '../lib/calc'
import { money, percent, signedMoney, years } from '../lib/format'
import { useStore } from '../state/store'

export function ResultsStep({ goTo }: { goTo: (step: number) => void }) {
  const { doc, results, gaps, currency } = useStore()
  const r = results
  const outlay = r.totalCost + r.totalMitigation
  const blockers = gaps.filter((g) => g.severity === 'blocker')

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Step 7 of 8</p>
        <h1>The case</h1>
        <p>
          {doc.project.title
            ? `Five-year projection for ${doc.project.title}.`
            : 'Five-year projection.'}{' '}
          Every figure below is derived from what you entered — nothing here is an assumption
          ProForma made on your behalf.
        </p>
      </header>

      <div className="stats" style={{ marginBottom: 16 }}>
        <Stat
          hero
          label="Five-year net position"
          value={signedMoney(r.totalNet, currency)}
          sub={
            r.totalNet >= 0
              ? `Returns ${percent(r.roi, 0)} on ${money(outlay, currency)} of outlay`
              : `Does not recover ${money(Math.abs(r.totalNet), currency)} of outlay`
          }
          tone={r.totalNet >= 0 ? 'pos' : 'neg'}
        />
        <Stat
          label="Break-even"
          value={r.paybackYear ? `Year ${r.paybackYear}` : 'Never'}
          sub={r.paybackYears !== null ? years(r.paybackYears) : 'Not within the horizon'}
          tone={r.paybackYear === null ? 'neg' : undefined}
        />
        <Stat
          label="Peak funding need"
          value={money(Math.abs(r.peakExposure), currency)}
          sub="Deepest point of the cash hole"
          tone={r.peakExposure < 0 ? 'neg' : undefined}
        />
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        <Stat label="Total cost" value={money(r.totalCost, currency)} sub="Excluding mitigation" tone="neg" />
        <Stat label="Total mitigation" value={money(r.totalMitigation, currency)} sub="Risk budget" tone="neg" />
        <Stat label="Total benefit" value={money(r.totalBenefit, currency)} sub="Five-year" tone="pos" />
        <Stat
          label={`NPV at ${doc.project.discountRate}%`}
          value={money(r.npv, currency)}
          sub={r.irr !== null ? `IRR ${percent(r.irr, 1)}` : 'IRR not defined'}
          tone={r.npv >= 0 ? 'pos' : 'neg'}
        />
      </div>

      {blockers.length ? (
        <Card title="Before this goes anywhere">
          <ul className="gaps">
            {blockers.map((g) => (
              <li key={g.id} className={`gap ${g.severity}`}>
                <span className="tagword">Fix</span>
                <span className="msg">{g.message}</span>
                <button type="button" onClick={() => goTo(g.step)}>
                  Go
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Cash picture" sub="Bars are the year's flows; the line is the running total.">
        <CashChart results={r} currency={currency} />
      </Card>

      <Card title="Year by year">
        <div className="tablewrap">
          <table>
            <caption className="visually-hidden">
              Five-year cost, benefit and cumulative position
            </caption>
            <thead>
              <tr>
                <th scope="col">Line</th>
                {r.years.map((y) => (
                  <th key={y.index} scope="col">
                    {y.label}
                  </th>
                ))}
                <th scope="col">5-year total</th>
              </tr>
            </thead>
            <tbody>
              <SectionRow label="Costs" />
              {doc.costs.map((item) => (
                <LineRow key={item.id} item={item} sign={-1} currency={currency} />
              ))}
              <tr className="total">
                <th scope="row">Total cost</th>
                {r.years.map((y) => (
                  <td key={y.index} className="cost">
                    {y.cost ? `−${money(y.cost, currency)}` : '—'}
                  </td>
                ))}
                <td className="cost">−{money(r.totalCost, currency)}</td>
              </tr>

              <SectionRow label="Benefits" />
              {doc.benefits.map((item) => (
                <LineRow key={item.id} item={item} sign={1} currency={currency} />
              ))}
              <tr className="total">
                <th scope="row">Total benefit</th>
                {r.years.map((y) => (
                  <td key={y.index} className="benefit">
                    {y.benefit ? money(y.benefit, currency) : '—'}
                  </td>
                ))}
                <td className="benefit">{money(r.totalBenefit, currency)}</td>
              </tr>

              <SectionRow label="Risk mitigations" />
              {doc.mitigations.map((item) => (
                <LineRow key={item.id} item={item} sign={-1} currency={currency} />
              ))}
              <tr className="total">
                <th scope="row">Total mitigation</th>
                {r.years.map((y) => (
                  <td key={y.index} className="cost">
                    {y.mitigation ? `−${money(y.mitigation, currency)}` : '—'}
                  </td>
                ))}
                <td className="cost">−{money(r.totalMitigation, currency)}</td>
              </tr>

              <tr className="total">
                <th scope="row">Net for the year</th>
                {r.years.map((y) => (
                  <td key={y.index} className={y.net >= 0 ? 'pos' : 'neg'}>
                    {signedMoney(y.net, currency)}
                  </td>
                ))}
                <td className={r.totalNet >= 0 ? 'pos' : 'neg'}>
                  {signedMoney(r.totalNet, currency)}
                </td>
              </tr>
              <tr className="total">
                <th scope="row">Running total</th>
                {r.years.map((y) => (
                  <td key={y.index} className={y.cumulative >= 0 ? 'pos' : 'neg'}>
                    {signedMoney(y.cumulative, currency)}
                  </td>
                ))}
                <td className={r.totalNet >= 0 ? 'pos' : 'neg'}>
                  {signedMoney(r.totalNet, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="scroll-hint">Scroll the table sideways to see all five years.</p>
      </Card>

      <Card title="Reading this honestly">
        <div className="prose">
          <p>
            <strong>{verdict(r, currency)}</strong>
          </p>
          <p>
            The model assumes annual costs and benefits begin in Year 2 and hold flat. Real
            benefits ramp and real costs drift; treat this as the shape of the case, not a
            forecast.
          </p>
          {r.paybackYear === null ? (
            <p>
              Nothing here breaks even inside five years. That is not automatically a
              no — strategic and option value sit outside this sheet — but it does mean the case
              cannot be made on payback alone.
            </p>
          ) : null}
          {r.totalBenefit > 0 && r.totalBenefit > outlay * 3 ? (
            <p>
              Benefits exceed outlay by more than three to one. That is achievable, but it is
              also the profile of a case where the benefit side has been estimated more
              generously than the cost side. Check the justifications before presenting it.
            </p>
          ) : null}
        </div>
      </Card>

      {gaps.filter((g) => g.severity === 'warning').length ? (
        <Card title="Worth tightening" sub="Not blocking, but a reviewer will notice.">
          <ul className="gaps">
            {gaps
              .filter((g) => g.severity === 'warning')
              .map((g) => (
                <li key={g.id} className="gap warning">
                  <span className="tagword">Note</span>
                  <span className="msg">{g.message}</span>
                  <button type="button" onClick={() => goTo(g.step)}>
                    Go
                  </button>
                </li>
              ))}
          </ul>
        </Card>
      ) : (
        <div className="allclear">
          {Icon.check(18)} No outstanding gaps. The case is complete enough to circulate.
        </div>
      )}
    </>
  )
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr>
      <th
        scope="rowgroup"
        colSpan={7}
        style={{
          textAlign: 'left',
          background: 'var(--surface-2)',
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

function LineRow({
  item,
  sign,
  currency,
}: {
  item: { id: string; label: string; oneTime: number; annual: number }
  sign: 1 | -1
  currency: string
}) {
  const cells = spread(item)
  const total = lineTotal(item)
  if (total === 0) return null
  const fmt = (v: number) => (v === 0 ? '—' : sign === 1 ? money(v, currency) : `−${money(v, currency)}`)
  return (
    <tr>
      <th scope="row" style={{ fontWeight: 500 }}>
        {item.label}
      </th>
      {cells.map((v, i) => (
        <td key={i} className={sign === 1 ? 'benefit' : 'cost'}>
          {fmt(v)}
        </td>
      ))}
      <td className={sign === 1 ? 'benefit' : 'cost'}>{fmt(total)}</td>
    </tr>
  )
}

function verdict(r: ReturnType<typeof useStore>['results'], currency: string): string {
  if (r.totalBenefit === 0 && r.totalCost === 0) return 'Nothing has been entered yet.'
  if (r.totalNet < 0)
    return `On these numbers the initiative loses ${money(Math.abs(r.totalNet), currency)} over five years.`
  if (r.paybackYear === null)
    return 'The initiative is net positive over five years but does not break even inside the horizon.'
  if (r.paybackYear <= 2)
    return `Break-even in year ${r.paybackYear} is fast enough that the main risk is the estimate, not the initiative.`
  return `Break-even in year ${r.paybackYear}, with a peak funding requirement of ${money(Math.abs(r.peakExposure), currency)}.`
}
