import { PHASES, SWIMLANES, deliverableKey } from '../data/roadmap'
import { DECISION_OPTIONS, RISK_DIMENSIONS } from '../data/decisions'
import { STAKEHOLDER_ROLES } from '../data/stakeholders'
import { lineTotal, spread, yearLabels } from './calc'
import type { Doc, Results } from './types'

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'proforma'
  )
}

/* ------------------------------------------------------------------ */
/* JSON — the round-trippable format                                   */
/* ------------------------------------------------------------------ */

export function exportJson(doc: Doc) {
  download(
    `${slug(doc.project.title)}-proforma.json`,
    'application/json',
    JSON.stringify(doc, null, 2),
  )
}

export function importJson(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Could not parse that file as JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsText(file)
  })
}

/* ------------------------------------------------------------------ */
/* CSV — opens in Excel / Sheets alongside the source workbooks        */
/* ------------------------------------------------------------------ */

function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRows(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

export function exportCsv(doc: Doc, results: Results) {
  const labels = yearLabels(doc.project.startDate)
  const rows: unknown[][] = []

  rows.push([`ProForma — ${doc.project.title || 'Untitled initiative'}`])
  rows.push(['Business area', doc.project.businessArea])
  rows.push(['Facing', doc.project.facing])
  rows.push(['Sponsor', doc.project.sponsors])
  rows.push(['Proposers', doc.project.proposers])
  rows.push(['Currency', doc.project.currency])
  rows.push(['Discount rate (%)', doc.project.discountRate])
  rows.push(['Generated', new Date().toISOString()])
  rows.push([])
  rows.push(['Note', 'One-time amounts fall in Year 1. Annual amounts apply to Years 2-5.'])
  rows.push([])

  const header = ['Item', 'Description', 'One-time', 'Annual', ...labels, '5-year total']
  rows.push(header)

  const section = (
    title: string,
    items: Doc['costs'],
    sign: 1 | -1,
  ) => {
    rows.push([title])
    for (const item of items) {
      const cells = spread(item).map((v) => v * sign)
      rows.push([
        item.label,
        item.note,
        item.oneTime * sign,
        item.annual * sign,
        ...cells,
        lineTotal(item) * sign,
      ])
    }
  }

  section('COSTS', doc.costs, -1)
  rows.push([
    'TOTAL COST',
    '',
    '',
    '',
    ...results.years.map((y) => -y.cost),
    -results.totalCost,
  ])
  rows.push([])

  section('BENEFITS', doc.benefits, 1)
  rows.push([
    'TOTAL BENEFITS',
    '',
    '',
    '',
    ...results.years.map((y) => y.benefit),
    results.totalBenefit,
  ])
  rows.push([])

  section('RISK MITIGATIONS', doc.mitigations, -1)
  rows.push([
    'TOTAL MITIGATION',
    '',
    '',
    '',
    ...results.years.map((y) => -y.mitigation),
    -results.totalMitigation,
  ])
  rows.push([])

  rows.push([
    'TOTAL COST / BENEFIT',
    '',
    '',
    '',
    ...results.years.map((y) => y.net),
    results.totalNet,
  ])
  rows.push([
    'RUNNING TOTAL',
    '',
    '',
    '',
    ...results.years.map((y) => y.cumulative),
    '',
  ])
  rows.push([])

  rows.push(['SUMMARY'])
  rows.push(['Total cost', results.totalCost])
  rows.push(['Total mitigation', results.totalMitigation])
  rows.push(['Total benefit', results.totalBenefit])
  rows.push(['Net position', results.totalNet])
  rows.push(['ROI', results.roi === null ? 'n/a' : results.roi])
  rows.push(['Break-even year', results.paybackYear ?? 'never'])
  rows.push(['Peak funding need', Math.abs(results.peakExposure)])
  rows.push([`NPV at ${doc.project.discountRate}%`, results.npv])
  rows.push(['IRR', results.irr === null ? 'n/a' : results.irr])
  rows.push([])

  rows.push(['STAKEHOLDERS'])
  for (const role of STAKEHOLDER_ROLES) {
    rows.push([role.label, doc.stakeholders[role.id] ?? ''])
  }
  rows.push([])

  rows.push(['ARCHITECTURE DECISIONS'])
  rows.push([
    'Option',
    'Selected',
    'Description',
    'Build cost',
    'Runtime (eng)',
    'Runtime (support)',
    ...RISK_DIMENSIONS.map((d) => `Risk: ${d.label}`),
    'Recommendation',
  ])
  for (const opt of DECISION_OPTIONS) {
    const row = doc.decisions.find((d) => d.id === opt.id)
    if (!row) continue
    rows.push([
      `${opt.group} — ${opt.label}`,
      row.selected ? 'Yes' : 'No',
      row.description,
      row.buildCost,
      row.runtimeCostEng,
      row.runtimeCostSupport,
      ...RISK_DIMENSIONS.map((d) => row.risks[d.id] || ''),
      row.recommendation,
    ])
  }
  rows.push([])

  rows.push(['DELIVERY ROADMAP'])
  rows.push(['Phase', 'Gate date', 'Swimlane', 'Deliverable', 'Done'])
  for (const phase of PHASES) {
    const st = doc.phases[phase.id]
    SWIMLANES.forEach((lane, laneIndex) => {
      const items = lane.cells[phase.id] ?? []
      items.forEach((text, itemIndex) => {
        const key = deliverableKey(phase.id, laneIndex, itemIndex)
        rows.push([
          `${phase.name} — ${phase.subtitle}`,
          st.date,
          lane.label,
          text,
          st.done.includes(key) ? 'Yes' : '',
        ])
      })
    })
  }

  // BOM so Excel opens UTF-8 correctly on Windows.
  download(`${slug(doc.project.title)}-proforma.csv`, 'text/csv', '﻿' + csvRows(rows))
}

/* ------------------------------------------------------------------ */
/* Markdown — for pasting into a doc, a ticket or a chat               */
/* ------------------------------------------------------------------ */

export function buildMarkdown(doc: Doc, results: Results): string {
  const cur = doc.project.currency || 'USD'
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n)
  const labels = yearLabels(doc.project.startDate)
  const L: string[] = []

  L.push(`# ${doc.project.title || 'Untitled initiative'}`)
  L.push('')
  if (doc.project.businessArea) L.push(`**Business area:** ${doc.project.businessArea}  `)
  L.push(`**Facing:** ${doc.project.facing}  `)
  if (doc.project.sponsors) L.push(`**Sponsor:** ${doc.project.sponsors}  `)
  if (doc.project.proposers) L.push(`**Proposers:** ${doc.project.proposers}`)
  L.push('')

  if (doc.project.proposal) {
    L.push('## Proposal')
    L.push('')
    for (const line of doc.project.proposal.split('\n').filter(Boolean)) L.push(`- ${line}`)
    L.push('')
  }

  if (doc.useCase.seed) {
    L.push('## Use case')
    L.push('')
    L.push(doc.useCase.seed)
    L.push('')
  }

  L.push('## The numbers')
  L.push('')
  L.push(`| | ${labels.join(' | ')} | Total |`)
  L.push(`|---|${labels.map(() => '---:').join('|')}|---:|`)
  L.push(
    `| Cost | ${results.years.map((y) => (y.cost ? `−${fmt(y.cost)}` : '—')).join(' | ')} | −${fmt(results.totalCost)} |`,
  )
  L.push(
    `| Mitigation | ${results.years.map((y) => (y.mitigation ? `−${fmt(y.mitigation)}` : '—')).join(' | ')} | −${fmt(results.totalMitigation)} |`,
  )
  L.push(
    `| Benefit | ${results.years.map((y) => (y.benefit ? fmt(y.benefit) : '—')).join(' | ')} | ${fmt(results.totalBenefit)} |`,
  )
  L.push(
    `| **Net** | ${results.years.map((y) => `**${fmt(y.net)}**`).join(' | ')} | **${fmt(results.totalNet)}** |`,
  )
  L.push(
    `| Running total | ${results.years.map((y) => fmt(y.cumulative)).join(' | ')} | |`,
  )
  L.push('')

  L.push('## Headline')
  L.push('')
  L.push(`- **Five-year net position:** ${fmt(results.totalNet)}`)
  L.push(
    `- **Break-even:** ${results.paybackYear ? `Year ${results.paybackYear}` : 'not within five years'}`,
  )
  L.push(`- **Peak funding need:** ${fmt(Math.abs(results.peakExposure))}`)
  L.push(
    `- **ROI:** ${results.roi === null ? 'n/a' : `${(results.roi * 100).toFixed(0)}%`} · **NPV @ ${doc.project.discountRate}%:** ${fmt(results.npv)}${results.irr !== null ? ` · **IRR:** ${(results.irr * 100).toFixed(1)}%` : ''}`,
  )
  L.push('')

  const justified = [...doc.costs, ...doc.benefits, ...doc.mitigations].filter(
    (i) => lineTotal(i) > 0 && i.note.trim(),
  )
  if (justified.length) {
    L.push('## Justifications')
    L.push('')
    for (const item of justified) {
      L.push(`- **${item.label}** (${fmt(lineTotal(item))}) — ${item.note.trim()}`)
    }
    L.push('')
  }

  const selected = doc.decisions.filter((d) => d.selected)
  if (selected.length) {
    L.push('## Architecture decisions')
    L.push('')
    for (const row of selected) {
      const opt = DECISION_OPTIONS.find((o) => o.id === row.id)
      const risks = RISK_DIMENSIONS.filter((d) => row.risks[d.id] >= 3)
        .map((d) => `${d.label} ${row.risks[d.id]}/5`)
        .join(', ')
      L.push(
        `- **${opt?.label ?? row.id}**${row.description ? ` — ${row.description}` : ''}${risks ? `  \n  Elevated risk: ${risks}` : ''}${row.recommendation ? `  \n  ${row.recommendation}` : ''}`,
      )
    }
    L.push('')
  }

  L.push('## Delivery gates')
  L.push('')
  for (const phase of PHASES) {
    const st = doc.phases[phase.id]
    const total = SWIMLANES.reduce((a, l) => a + (l.cells[phase.id]?.length ?? 0), 0)
    L.push(
      `- **${phase.name} — ${phase.subtitle}** · ${st.date}${total ? ` · ${st.done.length}/${total} complete` : ''}`,
    )
  }
  L.push('')

  const named = STAKEHOLDER_ROLES.filter((r) => (doc.stakeholders[r.id] ?? '').trim())
  if (named.length) {
    L.push('## Stakeholders')
    L.push('')
    for (const r of named) L.push(`- **${r.label}:** ${doc.stakeholders[r.id]}`)
    L.push('')
  }

  L.push('---')
  L.push('')
  L.push(
    '_Indicative figures. One-time amounts fall in Year 1; annual amounts apply to Years 2–5. Generated with ProForma._',
  )

  return L.join('\n')
}

export function exportMarkdown(doc: Doc, results: Results) {
  download(
    `${slug(doc.project.title)}-proforma.md`,
    'text/markdown',
    buildMarkdown(doc, results),
  )
}
