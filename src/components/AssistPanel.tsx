import { useEffect, useState } from 'react'
import { buildMarkdown } from '../lib/export'
import { useStore } from '../state/store'
import { Card, Icon, Note } from './ui'

type Availability = 'checking' | 'ready' | 'absent'

/**
 * Optional AI review of the finished case.
 *
 * The API key stays on a small local server (`npm run assist`) and is never
 * shipped to the browser — putting an Anthropic key in front-end code exposes
 * it to anyone who opens devtools. If that server is not running, this panel
 * says so and the rest of the app is unaffected.
 */
export function AssistPanel() {
  const { doc, results } = useStore()
  const [available, setAvailable] = useState<Availability>('checking')
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    fetch('/api/assist/health', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unavailable'))))
      .then((body: { ready?: boolean }) => {
        if (!cancelled) setAvailable(body.ready ? 'ready' : 'absent')
      })
      .catch(() => {
        if (!cancelled) setAvailable('absent')
      })
      .finally(() => clearTimeout(timer))
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  const run = async () => {
    setBusy(true)
    setError('')
    setReview('')
    try {
      const res = await fetch('/api/assist/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document: buildMarkdown(doc, results) }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Request failed with ${res.status}`)
      }
      const body = (await res.json()) as { review?: string }
      setReview(body.review ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The review request failed.')
    } finally {
      setBusy(false)
    }
  }

  if (available === 'checking') return null

  if (available === 'absent') {
    return (
      <Card title="AI review" sub="Optional — off by default.">
        <div className="assist-panel">
          <p style={{ marginBottom: 10 }}>
            A reviewer agent can read the finished case and tell you where a sceptical CFO would
            push back. It is not running.
          </p>
          <p style={{ marginBottom: 10 }}>
            To switch it on, set <code>ANTHROPIC_API_KEY</code> in your environment and run{' '}
            <code>npm run assist</code> in a second terminal. The key stays on that local server —
            it is never sent to the browser.
          </p>
          <p style={{ margin: 0 }}>
            Everything else in ProForma works without it.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="AI review"
      sub="A second opinion on the case you just built. Sent to the local assist server, which holds the key."
    >
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={run} disabled={busy}>
          {Icon.spark(17)} {busy ? 'Reviewing…' : 'Review this business case'}
        </button>
      </div>

      {error ? <Note warn>{error}</Note> : null}

      {review ? (
        <div className="prose" style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
          {review}
        </div>
      ) : null}

      {!review && !busy && !error ? (
        <Note>
          The whole document is sent — figures, justifications, risk scores and roadmap. Do not
          use this on a case containing information you would not put in a chat window.
        </Note>
      ) : null}
    </Card>
  )
}
