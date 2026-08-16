import { describe, expect, it } from 'vitest'
import { groupDigits, parseAmount, parseSigned, percent, years } from '../format'

/* ------------------------------------------------------------------ */
/* parseAmount — the lenient input parser                              */
/*                                                                     */
/* These tests describe what the parser DOES, not what it arguably     */
/* ought to do. See the note on accounting parentheses below.          */
/* ------------------------------------------------------------------ */

describe('parseAmount', () => {
  it('reads a plain number', () => {
    expect(parseAmount('1200')).toBe(1_200)
  })

  it('ignores thousands separators', () => {
    expect(parseAmount('1,200')).toBe(1_200)
    expect(parseAmount('1,200,000')).toBe(1_200_000)
  })

  it('expands a k suffix', () => {
    expect(parseAmount('450k')).toBe(450_000)
  })

  it('expands an m suffix, including a decimal mantissa', () => {
    expect(parseAmount('1.2m')).toBe(1_200_000)
    expect(parseAmount('2m')).toBe(2_000_000)
  })

  it('expands a b suffix', () => {
    expect(parseAmount('1.5b')).toBe(1_500_000_000)
  })

  it('ignores a currency symbol', () => {
    expect(parseAmount('$450k')).toBe(450_000)
    expect(parseAmount('£1,200')).toBe(1_200)
  })

  it('is case-insensitive and tolerates surrounding space', () => {
    expect(parseAmount('  1.2M  ')).toBe(1_200_000)
    expect(parseAmount('450K')).toBe(450_000)
  })

  it('returns zero for empty or unparseable input', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('   ')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
  })

  /**
   * Accounting parentheses are recognised and then deliberately discarded:
   * `parseAmount` returns a magnitude, because cost, benefit and mitigation
   * lines are all entered as positive amounts and the sign is applied by the
   * model, not by the typist.
   *
   * This test exists to pin that behaviour down. If it ever needs to change,
   * it is a product decision about what a negative cost line would mean —
   * not a parser bug to quietly fix.
   */
  it('treats (500) as a magnitude, not a negative', () => {
    expect(parseAmount('(500)')).toBe(500)
  })

  it('returns a magnitude for a leading minus, for the same reason', () => {
    expect(parseAmount('-500')).toBe(500)
  })
})

describe('parseSigned', () => {
  it('keeps the sign, unlike parseAmount', () => {
    expect(parseSigned('-2.5')).toBe(-2.5)
    expect(parseSigned('10')).toBe(10)
  })

  it('strips symbols around the number', () => {
    expect(parseSigned('10%')).toBe(10)
  })

  it('returns zero rather than NaN on junk', () => {
    expect(parseSigned('')).toBe(0)
    expect(parseSigned('abc')).toBe(0)
  })

  it('does not expand suffixes — it is for rates, not amounts', () => {
    expect(parseSigned('5k')).toBe(5)
  })
})

describe('groupDigits', () => {
  it('renders an empty string for zero so the field starts blank', () => {
    expect(groupDigits(0)).toBe('')
  })

  it('renders a non-finite value as empty rather than NaN', () => {
    expect(groupDigits(Number.NaN)).toBe('')
    expect(groupDigits(Number.POSITIVE_INFINITY)).toBe('')
  })

  it('round-trips through parseAmount', () => {
    for (const n of [1_200, 450_000, 1_930_000, 6_850_000]) {
      expect(parseAmount(groupDigits(n))).toBe(n)
    }
  })
})

describe('percent and years', () => {
  it('renders an undefined percentage as an em dash rather than throwing', () => {
    expect(percent(null)).toBe('—')
    expect(percent(Number.NaN)).toBe('—')
  })

  it('renders a fraction as a percentage at the requested precision', () => {
    expect(percent(0.25, 0)).toBe('25%')
    expect(percent(0.2188, 1)).toBe('21.9%')
  })

  it('says "Never" for a payback that does not arrive', () => {
    expect(years(null)).toBe('Never')
  })

  it('renders a payback period to one decimal place', () => {
    expect(years(3.443)).toBe('3.4 yr')
  })
})
