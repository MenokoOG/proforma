import { useMemo } from 'react'
import { signedMoney } from '../lib/format'
import { changeLabel, computeSensitivity, cushionSentence } from '../lib/sensitivity'
import type { Doc, Results } from '../lib/types'

/**
 * One-way sensitivity tables and the benefit cushion. Shared by the Results
 * step and the printed report, so both show the same figures. Every number
 * comes from `computeSensitivity`, which reuses `computeResults`.
 */
export function SensitivityTables({
  doc,
  results,
  currency,
}: {
  doc: Doc
  results: Results
  currency: string
}) {
  const tables = useMemo(() => computeSensitivity(doc), [doc])
  const cushion = cushionSentence(results)

  return (
    <>
      {tables.map((table) => (
        <div key={table.driver}>
          <p className="sens-title">{table.label}</p>
          <div className="sens-wrap">
            <table>
              <caption className="visually-hidden">
                {table.label} moved one step at a time, everything else held
              </caption>
              <thead>
                <tr>
                  <th scope="col">Change</th>
                  <th scope="col">Five-year net</th>
                  <th scope="col">NPV at {doc.project.discountRate}%</th>
                  <th scope="col">Break-even</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.changePct} className={row.changePct === 0 ? 'total' : undefined}>
                    <th scope="row" style={{ fontWeight: row.changePct === 0 ? 700 : 500 }}>
                      {changeLabel(row.changePct)}
                    </th>
                    <td className={row.totalNet >= 0 ? 'pos' : 'neg'}>
                      {signedMoney(row.totalNet, currency)}
                    </td>
                    <td className={row.npv >= 0 ? 'pos' : 'neg'}>
                      {signedMoney(row.npv, currency)}
                    </td>
                    <td>{row.paybackYear ? `Year ${row.paybackYear}` : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {cushion ? (
        <p className="note" style={{ marginTop: 12 }}>
          <strong>Benefit cushion.</strong> {cushion}
        </p>
      ) : null}
    </>
  )
}
