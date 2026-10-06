import {
  DISCOUNT_RATE_MAX,
  DISCOUNT_RATE_MIN,
  HORIZON,
  NPV_TIMING_OPTIONS,
  normalizeDiscountRate,
  normalizeNpvTiming,
  npvTimingNote,
  yearLabels,
} from './calc'
import type { Doc } from './types'

export interface Assumption {
  label: string
  value: string
}

/**
 * Everything the headline figures rest on, as plain statements. One list feeds
 * the Results step, the printed report, the CSV and the Markdown export, so the
 * four can never disagree about which convention is in force.
 */
export function assumptionsList(doc: Doc): Assumption[] {
  const timing = normalizeNpvTiming(doc.project.npvTiming)
  const timingLabel = NPV_TIMING_OPTIONS.find((o) => o.value === timing)?.label ?? timing
  const rate = normalizeDiscountRate(doc.project.discountRate)
  const labels = yearLabels(doc.project.startDate)

  return [
    {
      label: 'Horizon',
      value: `${HORIZON} years, from ${labels[0]} to ${labels[HORIZON - 1]}.`,
    },
    {
      label: 'Spreading',
      value: `One-time amounts fall in Year 1. Annual amounts apply to Years 2 to ${HORIZON}.`,
    },
    {
      label: 'Discount rate',
      value: `${rate}% (allowed range ${DISCOUNT_RATE_MIN} to ${DISCOUNT_RATE_MAX}%).`,
    },
    { label: 'NPV timing', value: `${timingLabel}. ${npvTimingNote(timing)}` },
    {
      label: 'IRR',
      value:
        'The rate that brings NPV to zero, searched from -99.99% to 1,000%. It does not depend on NPV timing.',
    },
    {
      label: 'ROI',
      value: 'Five-year net benefit divided by total outlay (costs plus risk mitigation).',
    },
    {
      label: 'Payback',
      value:
        'The first year the running total is not negative, interpolated within that year. It needs some benefit to have arrived.',
    },
    {
      label: 'Currency',
      value: `${doc.project.currency || 'USD'}. Display only; no conversion is applied.`,
    },
  ]
}
