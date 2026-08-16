const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF', 'SGD', 'ZAR']
export { CURRENCIES }

const cache = new Map<string, Intl.NumberFormat>()

function fmt(key: string, make: () => Intl.NumberFormat): Intl.NumberFormat {
  let f = cache.get(key)
  if (!f) {
    f = make()
    cache.set(key, f)
  }
  return f
}

/** Full currency, no decimals: "$1,930,000". */
export function money(value: number, currency = 'USD'): string {
  const safe = Number.isFinite(value) ? value : 0
  return fmt(`m:${currency}`, () =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }),
  ).format(safe)
}

/** Signed, for deltas: "+$790,000" / "−$1,930,000" (true minus sign). */
export function signedMoney(value: number, currency = 'USD'): string {
  const safe = Number.isFinite(value) ? value : 0
  if (safe === 0) return money(0, currency)
  const body = money(Math.abs(safe), currency)
  return safe > 0 ? `+${body}` : `−${body}`
}

/** Compact for tight spaces: "$1.9M". */
export function compactMoney(value: number, currency = 'USD'): string {
  const safe = Number.isFinite(value) ? value : 0
  if (Math.abs(safe) < 1000) return money(safe, currency)
  return fmt(`c:${currency}`, () =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
  ).format(safe)
}

/** Small currency amounts that need cents, for per-request token costs. */
export function preciseMoney(value: number, currency = 'USD'): string {
  const safe = Number.isFinite(value) ? value : 0
  const abs = Math.abs(safe)
  const digits = abs === 0 ? 2 : abs < 0.01 ? 5 : abs < 1 ? 4 : 2
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe)
}

export function integer(value: number): string {
  return fmt('i', () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })).format(
    Number.isFinite(value) ? value : 0,
  )
}

export function compactNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  if (Math.abs(safe) < 10_000) return integer(safe)
  return fmt('cn', () =>
    new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }),
  ).format(safe)
}

/** 0.234 → "23.4%". */
export function percent(fraction: number | null, digits = 1): string {
  if (fraction === null || !Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(digits)}%`
}

export function years(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Never'
  return `${value.toFixed(1)} yr`
}

export function longDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Parse whatever a person types into a number: "1,200", "1.2k", "$1.2m", "(500)".
 * Returns 0 for anything unparseable, and always a non-negative magnitude —
 * amounts carry direction through their line kind, not a minus sign.
 */
export function parseAmount(raw: string): number {
  const s = raw.trim().toLowerCase()
  if (!s) return 0
  const parenNegative = /^\(.*\)$/.test(s)
  let body = s.replace(/[()]/g, '')
  let multiplier = 1
  const suffix = body.match(/([kmb])\s*$/)
  if (suffix) {
    multiplier = suffix[1] === 'k' ? 1e3 : suffix[1] === 'm' ? 1e6 : 1e9
    body = body.slice(0, suffix.index)
  }
  const cleaned = body.replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return 0
  const value = n * multiplier
  void parenNegative
  return Math.abs(value)
}

/** Same parser, but signed — used for rates and percentages. */
export function parseSigned(raw: string): number {
  const s = raw.trim().replace(/[^0-9.\-]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/** Grouped digits while typing, without forcing a currency symbol into the field. */
export function groupDigits(value: number): string {
  if (!Number.isFinite(value) || value === 0) return ''
  return integer(value)
}
