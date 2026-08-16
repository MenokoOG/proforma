import { compactMoney, money } from '../lib/format'
import type { Results } from '../lib/types'

/**
 * Five-year cash picture: grouped bars for outflow vs inflow, and the
 * cumulative running total overlaid as a line. The line is the part that
 * matters — it shows how deep the hole gets and when it closes.
 *
 * Hand-rolled SVG rather than a chart library: it keeps the bundle small,
 * renders instantly, inherits theme tokens, and prints correctly.
 */
export function CashChart({
  results,
  currency,
}: {
  results: Results
  currency: string
}) {
  const W = 720
  const H = 320
  const padL = 56
  const padR = 16
  const padT = 24
  const padB = 46
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const outflows = results.years.map((y) => y.cost + y.mitigation)
  const inflows = results.years.map((y) => y.benefit)
  const cums = results.years.map((y) => y.cumulative)

  const maxBar = Math.max(1, ...outflows, ...inflows)
  const maxCum = Math.max(0, ...cums)
  const minCum = Math.min(0, ...cums)

  // Single shared scale so the cumulative line reads against the bars.
  const top = Math.max(maxBar, maxCum)
  const bottom = Math.min(0, minCum)
  const range = top - bottom || 1

  const y = (v: number) => padT + ((top - v) / range) * plotH
  const zeroY = y(0)

  const n = results.years.length
  const slot = plotW / n
  const barW = Math.min(30, slot * 0.3)
  const gap = 5

  const cx = (i: number) => padL + slot * i + slot / 2

  const linePath = cums
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ')

  // Gridlines at quarters of the range.
  const ticks = 4
  const gridValues = Array.from({ length: ticks + 1 }, (_, i) => bottom + (range / ticks) * i)

  const paybackIdx = results.paybackYear !== null ? results.paybackYear - 1 : -1

  return (
    <>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={describe(results, currency)}
      >
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              className="grid-line"
              x1={padL}
              x2={W - padR}
              y1={y(v)}
              y2={y(v)}
              opacity={Math.abs(v) < 1e-6 ? 0 : 0.6}
            />
            <text className="axis-label" x={padL - 8} y={y(v) + 3.5} textAnchor="end">
              {compactMoney(v, currency)}
            </text>
          </g>
        ))}

        {/* Zero baseline */}
        <line className="zero-line" x1={padL} x2={W - padR} y1={zeroY} y2={zeroY} />

        {/* Payback marker */}
        {paybackIdx >= 0 ? (
          <g>
            <line
              className="payback-line"
              x1={cx(paybackIdx)}
              x2={cx(paybackIdx)}
              y1={padT}
              y2={H - padB}
            />
            <text
              className="payback-text"
              x={cx(paybackIdx)}
              y={padT - 8}
              textAnchor="middle"
            >
              break-even
            </text>
          </g>
        ) : null}

        {/* Bars */}
        {results.years.map((row, i) => {
          const out = outflows[i]
          const inn = inflows[i]
          const xOut = cx(i) - barW - gap / 2
          const xIn = cx(i) + gap / 2
          return (
            <g key={row.index}>
              {/* Both bars rise from the zero line as magnitudes; the
                  cumulative line carries the sign. Keeps every bar on-canvas
                  regardless of whether the running total goes negative. */}
              {out > 0 ? (
                <rect
                  className="bar-cost"
                  x={xOut}
                  y={y(out)}
                  width={barW}
                  height={Math.max(1, zeroY - y(out))}
                  rx="2"
                />
              ) : null}
              {inn > 0 ? (
                <rect
                  className="bar-benefit"
                  x={xIn}
                  y={y(inn)}
                  width={barW}
                  height={Math.max(1, zeroY - y(inn))}
                  rx="2"
                />
              ) : null}
              <text className="axis-label" x={cx(i)} y={H - padB + 16} textAnchor="middle">
                Y{i + 1}
              </text>
              <text
                className="value-label"
                x={cx(i)}
                y={H - padB + 30}
                textAnchor="middle"
              >
                {compactMoney(row.cumulative, currency)}
              </text>
            </g>
          )
        })}

        {/* Cumulative line on top */}
        <path className="cum-line" d={linePath} />
        {cums.map((v, i) => (
          <circle key={i} className="cum-dot" cx={cx(i)} cy={y(v)} r="4" />
        ))}
      </svg>

      <div className="legend">
        <span>
          <i style={{ background: 'var(--cost)' }} /> Outflow (cost + mitigation)
        </span>
        <span>
          <i style={{ background: 'var(--benefit)' }} /> Inflow (benefit)
        </span>
        <span>
          <i style={{ background: 'var(--ink)', height: 3, borderRadius: 2 }} /> Cumulative
          position
        </span>
      </div>
    </>
  )
}

function describe(results: Results, currency: string): string {
  const parts = results.years.map(
    (row) => `Year ${row.index + 1}: net ${money(row.net, currency)}, cumulative ${money(row.cumulative, currency)}`,
  )
  const payback =
    results.paybackYear === null
      ? 'The initiative does not break even within five years.'
      : `Break-even occurs in year ${results.paybackYear}.`
  return `Five-year cash chart. ${parts.join('. ')}. ${payback}`
}

/** The "cost bars grow downward from zero" fix, as a separate small chart. */
export function MiniBars({
  values,
  currency,
  tone = 'cost',
}: {
  values: number[]
  currency: string
  tone?: 'cost' | 'benefit'
}) {
  const max = Math.max(1, ...values.map(Math.abs))
  return (
    <svg
      className="chart"
      viewBox={`0 0 ${values.length * 24} 40`}
      role="img"
      aria-label={values.map((v, i) => `Year ${i + 1}: ${money(v, currency)}`).join(', ')}
    >
      {values.map((v, i) => {
        const h = (Math.abs(v) / max) * 34
        return (
          <rect
            key={i}
            className={tone === 'cost' ? 'bar-cost' : 'bar-benefit'}
            x={i * 24 + 5}
            y={38 - h}
            width={14}
            height={Math.max(1, h)}
            rx="2"
          />
        )
      })}
    </svg>
  )
}
