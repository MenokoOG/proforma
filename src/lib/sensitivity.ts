import { computeResults, num } from './calc'
import type { Doc, LineItem, Results } from './types'

/**
 * One-way sensitivity: move one side of the case and hold everything else.
 *
 * This reuses `computeResults` on a scaled copy of the document, so it can
 * never disagree with the headline figures about how a number is derived.
 */

/** Percentage changes applied to one side of the case at a time. */
export const SENSITIVITY_STEPS: readonly number[] = [-20, -10, 0, 10, 20]

export type SensitivityDriver = 'benefits' | 'outlay'

export interface SensitivityRow {
  /** Percentage change applied to the driver, e.g. -10. */
  changePct: number
  totalNet: number
  npv: number
  /** 1-indexed break-even year, or null when the case never breaks even. */
  paybackYear: number | null
}

export interface SensitivityTable {
  driver: SensitivityDriver
  label: string
  rows: SensitivityRow[]
}

function scaleLines(items: LineItem[], factor: number): LineItem[] {
  return items.map((i) => ({
    ...i,
    oneTime: num(i.oneTime) * factor,
    annual: num(i.annual) * factor,
  }))
}

/**
 * A copy of the document with one side scaled by `changePct` percent.
 * 'outlay' is costs and risk mitigation together, the same split ROI uses.
 */
export function scaleDoc(doc: Doc, driver: SensitivityDriver, changePct: number): Doc {
  const factor = 1 + changePct / 100
  return driver === 'benefits'
    ? { ...doc, benefits: scaleLines(doc.benefits, factor) }
    : {
        ...doc,
        costs: scaleLines(doc.costs, factor),
        mitigations: scaleLines(doc.mitigations, factor),
      }
}

const DRIVER_LABELS: Record<SensitivityDriver, string> = {
  benefits: 'Benefits',
  outlay: 'Costs and mitigation',
}

export function computeSensitivity(doc: Doc): SensitivityTable[] {
  return (['benefits', 'outlay'] as const).map((driver) => ({
    driver,
    label: DRIVER_LABELS[driver],
    rows: SENSITIVITY_STEPS.map((changePct) => {
      const r = computeResults(scaleDoc(doc, driver, changePct))
      return { changePct, totalNet: r.totalNet, npv: r.npv, paybackYear: r.paybackYear }
    }),
  }))
}

/**
 * How far benefits can move before the five-year net position is zero, as a
 * fraction of total benefit. Positive: benefits can fall by this much and the
 * case still breaks even. Negative: benefits must rise by this much to do so.
 * Null when there is no benefit to move.
 *
 * Net is linear in benefits, so this is exact: net / benefit.
 */
export function benefitCushion(
  results: Pick<Results, 'totalNet' | 'totalBenefit'>,
): number | null {
  return results.totalBenefit > 0 ? results.totalNet / results.totalBenefit : null
}

/** "+10%" / "−10%" / "Base case". */
export function changeLabel(changePct: number): string {
  if (changePct === 0) return 'Base case'
  return `${changePct > 0 ? '+' : '−'}${Math.abs(changePct)}%`
}

/** One sentence on the benefit cushion, or null when there is no benefit. */
export function cushionSentence(
  results: Pick<Results, 'totalNet' | 'totalBenefit'>,
): string | null {
  const c = benefitCushion(results)
  if (c === null) return null
  const pct = `${(Math.abs(c) * 100).toFixed(1)}%`
  return c >= 0
    ? `Benefits can fall ${pct} before the five-year net position reaches zero.`
    : `Benefits would need to rise ${pct} for the five-year net position to reach zero.`
}
