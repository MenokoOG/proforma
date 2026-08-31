import { useEffect, useState, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { onIdle } from './idle'

/**
 * The paper report, and whether a print is currently under way.
 *
 * Two problems, one hook.
 *
 * First, the report is a full second rendering of the document — every stat,
 * the five-year table, the chart, and the industry, decision and roadmap
 * tables behind them. Mounted at all times, it made React reconcile the whole
 * thing on every keystroke for output nobody was looking at. It is built on
 * demand instead.
 *
 * Second, that made it dead weight in the entry chunk, so it moved to its
 * own. But a lazy chunk cannot be fetched during `beforeprint`: the dialog
 * opens the moment the handler returns, long before a network round trip
 * finishes, and the page would print blank. So the fetch is started once the
 * browser goes idle — after the first paint, never competing with it — and
 * the module is then held ready in state. By the time anyone can reach for
 * Ctrl+P it has long since landed.
 *
 * `flushSync` is the other half of that guarantee. A batched update would
 * land after the browser had already taken its snapshot.
 */
type Report = ComponentType<Record<string, never>>

let pending: Promise<Report> | null = null

/** One fetch per session, however many times this is called. */
function fetchReport(): Promise<Report> {
  pending ??= import('../components/PrintReport').then((m) => m.PrintReport as Report)
  return pending
}

export function usePrintReport(): Report | null {
  const [printing, setPrinting] = useState(false)
  const [Report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    let live = true
    const start = () => {
      void fetchReport().then((C) => {
        if (live) setReport(() => C)
      })
    }

    const cancel = onIdle(start, 3000)

    return () => {
      live = false
      cancel()
    }
  }, [])

  useEffect(() => {
    const open = () => {
      // If a print somehow beats the prefetch, this at least gets the report
      // on screen for a second attempt rather than leaving it unavailable.
      void fetchReport().then((C) => setReport(() => C))
      flushSync(() => setPrinting(true))
    }
    const close = () => setPrinting(false)

    window.addEventListener('beforeprint', open)
    window.addEventListener('afterprint', close)

    // Some engines flip the print media query without firing the event, so
    // both signals are wired up; whichever arrives first wins.
    const mql = window.matchMedia?.('print')
    const onMedia = (e: MediaQueryListEvent) => (e.matches ? open() : close())
    mql?.addEventListener('change', onMedia)

    // Covers a print already in flight when the app mounts.
    if (mql?.matches) setPrinting(true)

    return () => {
      window.removeEventListener('beforeprint', open)
      window.removeEventListener('afterprint', close)
      mql?.removeEventListener('change', onMedia)
    }
  }, [])

  return printing ? Report : null
}
