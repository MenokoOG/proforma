import { useCallback, useEffect, useMemo, useState } from 'react'
import { Architecture } from './steps/Architecture'
import { Benefits } from './steps/Benefits'
import { Brief } from './steps/Brief'
import { Costs } from './steps/Costs'
import { Export } from './steps/Export'
import { ResultsStep } from './steps/ResultsStep'
import { Risks } from './steps/Risks'
import { Roadmap } from './steps/Roadmap'
import { UseCaseStep } from './steps/UseCaseStep'
import { PrintReport } from './components/PrintReport'
import { Icon, LiveRegion, useScrollTop } from './components/ui'
import { compactMoney } from './lib/format'
import { loadTheme, saveTheme, type Theme } from './lib/storage'
import { useStore } from './state/store'

const STEPS = [
  { id: 'brief', label: 'Brief', short: 'Brief' },
  { id: 'usecase', label: 'Use case', short: 'Use case' },
  { id: 'architecture', label: 'Architecture', short: 'Arch.' },
  { id: 'costs', label: 'Costs', short: 'Costs' },
  { id: 'benefits', label: 'Benefits', short: 'Benefits' },
  { id: 'risks', label: 'Risks', short: 'Risks' },
  { id: 'results', label: 'Results', short: 'Results' },
  { id: 'roadmap', label: 'Roadmap', short: 'Roadmap' },
  { id: 'export', label: 'Export', short: 'Export' },
] as const

export function App() {
  const { doc, results, gaps, currency, saved } = useStore()
  const [step, setStep] = useState(0)
  const [theme, setTheme] = useState<Theme>(() => loadTheme())

  useScrollTop(step)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  const goTo = useCallback((n: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, n)))
  }, [])

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
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
            onClick={() =>
              setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')
            }
          >
            {theme === 'dark' ? Icon.moon(18) : Icon.sun(18)}
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
            {step === 0 ? <Brief /> : null}
            {step === 1 ? <UseCaseStep /> : null}
            {step === 2 ? <Architecture /> : null}
            {step === 3 ? <Costs /> : null}
            {step === 4 ? <Benefits /> : null}
            {step === 5 ? <Risks /> : null}
            {step === 6 ? <ResultsStep goTo={goTo} /> : null}
            {step === 7 ? <Roadmap /> : null}
            {step === 8 ? <Export /> : null}
          </div>

          {/* Printing gives the whole case, not the open step. */}
          <PrintReport />
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
