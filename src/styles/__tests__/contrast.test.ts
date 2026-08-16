import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Colour contrast is a claim ProForma makes in its README, so it is tested
 * rather than asserted.
 *
 * This reads the real token block out of app.css and checks every text token
 * against every ground it can actually land on, in both themes. If you add or
 * change a token, add it here too.
 */

const css = readFileSync(fileURLToPath(new URL('../app.css', import.meta.url)), 'utf8')

/**
 * Merges every block opened by `selector` into one token map.
 *
 * More than one block per selector is normal and load-bearing here: the
 * palette is declared in one block and `--on-brand` in a later one. An
 * extractor that stopped at the first block would miss it.
 */
function tokensFor(selector: string): Record<string, string> {
  const out: Record<string, string> = {}
  let from = 0
  for (;;) {
    const start = css.indexOf(selector, from)
    if (start === -1) break
    const end = css.indexOf('\n}', start)
    if (end === -1) break
    for (const [, name, value] of css
      .slice(start, end)
      .matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
      out[name] = value
    }
    from = end
  }
  return out
}

/** The bare `:root {` blocks — the light palette. */
const lightTokens = () => tokensFor(':root {')

/** The explicit `:root[data-theme='dark'] {` blocks. */
const darkTokens = () => tokensFor(":root[data-theme='dark'] {")

function channel(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((x) => x + x).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(fg: string, bg: string): number {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Every ground a piece of text can sit on. */
const GROUNDS = ['--paper', '--surface', '--surface-2', '--surface-sunken', '--brand-soft']

/** Normal-size text: WCAG AA wants 4.5:1. */
const BODY_TEXT = ['--ink', '--ink-2', '--ink-3']

/** Figures rendered at >=18.66px bold, which AA scores at 3:1. */
const LARGE_TEXT = ['--benefit', '--cost']

describe.each([
  ['light', lightTokens()],
  ['dark', darkTokens()],
])('%s theme contrast', (themeName, t) => {
  it('parsed a full token block out of app.css', () => {
    // Guards against the regex silently matching nothing and the suite
    // passing vacuously. Every token the checks below rely on must be
    // present — a missing one is a parse bug, not a contrast result.
    expect(Object.keys(t).length).toBeGreaterThan(15)
    for (const token of [...GROUNDS, ...BODY_TEXT, ...LARGE_TEXT, '--on-brand', '--focus']) {
      expect(t[token], `${themeName} is missing ${token}`).toBeDefined()
    }
  })

  it.each(BODY_TEXT)('%s meets 4.5:1 on every ground', (token) => {
    for (const ground of GROUNDS) {
      const ratio = contrast(t[token], t[ground])
      expect(
        ratio,
        `${themeName}: ${token} (${t[token]}) on ${ground} (${t[ground]}) is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(LARGE_TEXT)('%s meets 3:1 as a large figure on every ground', (token) => {
    for (const ground of GROUNDS) {
      const ratio = contrast(t[token], t[ground])
      expect(
        ratio,
        `${themeName}: ${token} (${t[token]}) on ${ground} (${t[ground]}) is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps cost and benefit readable as table cells, not just as headline figures', () => {
    for (const token of LARGE_TEXT) {
      for (const ground of ['--surface', '--surface-2'] as const) {
        const ratio = contrast(t[token], t[ground])
        expect(
          ratio,
          `${themeName}: ${token} on ${ground} is ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('keeps --on-brand readable on a --brand fill', () => {
    // The reason this token exists: in dark mode --brand is a light blue and
    // white on it drops to about 1.6:1.
    const ratio = contrast(t['--on-brand'], t['--brand'])
    expect(
      ratio,
      `${themeName}: on-brand on brand is ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the focus ring distinguishable from the page', () => {
    expect(contrast(t['--focus'], t['--paper'])).toBeGreaterThanOrEqual(3)
  })
})

describe('the contrast helper itself', () => {
  it('scores black on white at 21:1', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('scores a colour against itself at 1:1', () => {
    expect(contrast('#1f4fb0', '#1f4fb0')).toBeCloseTo(1, 9)
  })

  it('is symmetric', () => {
    expect(contrast('#123456', '#abcdef')).toBeCloseTo(contrast('#abcdef', '#123456'), 9)
  })
})
