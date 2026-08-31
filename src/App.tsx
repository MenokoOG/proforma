import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react'
import { Icon, LiveRegion, useScrollTop } from './components/ui'
import { compactMoney } from './lib/format'
import { onIdle } from './lib/idle'
import { loadTheme, saveTheme, type Theme } from './lib/storage'
import { usePrintReport } from './lib/printmode'
import { useStore } from './state/store'

/**
 * Steps load on demand.
 *
 * Nine steps statically imported meant a first-time visitor on a phone
 * parsed all nine — plus the industry tables, the roadmap grid and the
 * chart — before the Brief could paint. Each step is its own chunk now,
 * and `preload` warms the neighbours once the browser is idle, so stepping
 * through the flow still feels instant.
 */
interface StepDef {
  id: string
  label: string
  short: string
  Component: ComponentType<{ goTo: (n: number) => void }>
  preload: () => Promise<unknown>
}

function step<T extends Record<string, unknown>>(
  id: string,
  label: string,
  short: string,
  loader: () => Promise<T>,
  key: keyof T,
): StepDef {
  return {
    id,
    label,
    short,
    Component: lazy(() =>
      loader().then((m) => ({ default: m[key] as ComponentType<{ goTo: (n: number) => void }> })),
    ),
    preload: loader,
  }
}

const STEPS: StepDef[] = [
  step('brief', 'Brief', 'Brief', () => import('./steps/Brief'), 'Brief'),
  step('usecase', 'Use case', 'Use case', () => import('./steps/UseCaseStep'), 'UseCaseStep'),
  step(
    'architecture',
    'Architecture',
    'Arch.',
    () => import('./steps/Architecture'),
    'Architecture',
  ),
  step('costs', 'Costs', 'Costs', () => import('./steps/Costs'), 'Costs'),
  step('benefits', 'Benefits', 'Benefits', () => import('./steps/Benefits'), 'Benefits'),
  step('risks', 'Risks', 'Risks', () => import('./steps/Risks'), 'Risks'),
  step('results', 'Results', 'Results', () => import('./steps/ResultsStep'), 'ResultsStep'),
  step('roadmap', 'Roadmap', 'Roadmap', () => import('./steps/Roadmap'), 'Roadmap'),
  step('export', 'Export', 'Export', () => import('./steps/Export'), 'Export'),
]

/** Theme cycles system → light → dark. Each state gets its own icon. */
const NEXT_THEME: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const THEME_LABEL: Record<Theme, string> = {
  system: 'Match system',
  light: 'Light',
  dark: 'Dark',
}

/** Keeps the mobile browser chrome in step with an explicit theme choice. */
function applyThemeColor(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  const color = dark ? '#0e1219' : '#eff2f6'
  for (const el of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    el.removeAttribute('media')
    el.content = color
  }
}

export function App() {
  const { doc, results, gaps, currency, saved } = useStore()
  const [step, setStep] = useState(0)
  const [theme, setTheme] = useState<Theme>(() => loadTheme())
  const PrintReport = usePrintReport()

  useScrollTop(step)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    saveTheme(theme)
    applyThemeColor(theme)

    if (theme !== 'system' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyThemeColor('system')
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [theme])

  const goTo = useCallback((n: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, n)))
  }, [])

  // Warm the steps either side of this one, so Back and Next never wait on
  // a network round trip. Idle time only — never in front of the paint.
  useEffect(() => {
    const warm = () => {
      STEPS[step + 1]?.preload()
      STEPS[step - 1]?.preload()
    }
    return onIdle(warm)
  }, [step])

  // Which steps have something in them, for the rail's completion marks.
  const completion = useMemo(() => {
    const named = Object.values(doc.stakeholders).filter((v) => v.trim()).length
    return [
      Boolean(doc.project.title.trim() && doc.project.proposal.trim() && named >= 1),
      Boolean(doc.useCase.industry && doc.useCase.aiType),
      doc.decisions.some((d) => d.selected),
      results.totalCost > 0,
      results.totalBenefit > 0,
      results.totalMitigation > 0,
      results.totalCost > 0 && results.totalBenefit > 0,
      doc.phases.some((p) => p.done.length > 0),
      false,
    ]
  }, [doc, results])

  const gapsByStep = useMemo(() => {
    const map = new Map<number, number>()
    for (const g of gaps) map.set(g.step, (map.get(g.step) ?? 0) + 1)
    return map
  }, [gaps])

  const net = results.totalNet
  const progress = ((step + 1) / STEPS.length) * 100
  const Step = STEPS[step].Component

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar no-print">
        <div className="topbar-inner">
          <span className="wordmark">
            <span className="mark" aria-hidden="true">
              PF
            </span>
            ProForma
            <span className="tag">Build the AI business case</span>
          </span>

          <span className="topbar-spacer" />

          <span
            className={`headline-pill ${net >= 0 ? 'pos' : 'neg'}`}
            title="Five-year net position"
          >
            <span className="label">5-yr net</span>
            <span className="value">{compactMoney(net, currency)}</span>
          </span>

          <span className="savechip" aria-live="polite">
            {saved === 'saving' ? 'Saving…' : saved === 'saved' ? 'Saved' : ''}
          </span>

          <button
            type="button"
            className="iconbtn"
            aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[NEXT_THEME[theme]]}.`}
            title={`Theme: ${THEME_LABEL[theme]}`}
            onClick={() => setTheme(NEXT_THEME[theme])}
          >
            {theme === 'dark'
              ? Icon.moon(18)
              : theme === 'light'
                ? Icon.sun(18)
                : Icon.monitor(18)}
          </button>
        </div>
        <div className="progressbar" role="presentation">
          <div style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="layout">
        <nav className="rail no-print" aria-label="Business case steps">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`rail-item${completion[i] ? ' complete' : ''}`}
                  aria-current={step === i ? 'step' : undefined}
                  onClick={() => goTo(i)}
                  onPointerEnter={() => s.preload()}
                >
                  <span className="rail-num" aria-hidden="true">
                    {completion[i] && step !== i ? Icon.check(12) : i + 1}
                  </span>
                  {s.label}
                  {gapsByStep.get(i) ? (
                    <>
                      <span className="rail-dot" aria-hidden="true" />
                      <span className="visually-hidden">
                        {gapsByStep.get(i)} item needs attention
                      </span>
                    </>
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="main" id="main" tabIndex={-1}>
          <div className="screen-only">
            <Suspense fallback={<StepSkeleton />}>
              <Step goTo={goTo} />
            </Suspense>
          </div>

          {/* Printing gives the whole case, not the open step. It is only
              built once a print is actually under way — see usePrintReport. */}
          {PrintReport ? <PrintReport /> : null}
        </main>
      </div>

      <nav className="bottomnav no-print" aria-label="Step navigation">
        <div className="bottomnav-inner">
          <button
            type="button"
            className="btn"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
          >
            {Icon.chevronLeft(17)} Back
          </button>
          <span className="stepcount">
            {step + 1} / {STEPS.length}
            <span className="visually-hidden"> — {STEPS[step].label}</span>
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="btn primary"
            onClick={() => goTo(step + 1)}
            disabled={step === STEPS.length - 1}
          >
            {step === STEPS.length - 2 ? 'Export' : `Next: ${STEPS[step + 1]?.short ?? ''}`}{' '}
            {Icon.chevronRight(17)}
          </button>
        </div>
      </nav>

      <LiveRegion message={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].label}`} />
    </div>
  )
}

/** Holds the step's shape while its chunk arrives, so nothing jumps. */
function StepSkeleton() {
  return (
    <div className="step-skeleton" aria-hidden="true">
      <span className="sk sk-eyebrow" />
      <span className="sk sk-title" />
      <span className="sk sk-line" />
      <span className="sk sk-card" />
    </div>
  )
}
