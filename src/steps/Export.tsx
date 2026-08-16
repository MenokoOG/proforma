import { useRef, useState } from 'react'
import { Card, Icon, Note } from '../components/ui'
import { buildMarkdown, exportCsv, exportJson, exportMarkdown, importJson } from '../lib/export'
import { hydrate } from '../lib/storage'
import { useStore } from '../state/store'
import { AssistPanel } from '../components/AssistPanel'

export function Export() {
  const { doc, results, dispatch } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  const [copied, setCopied] = useState(false)

  const onImport = async (file: File) => {
    try {
      const raw = await importJson(file)
      dispatch({ type: 'replace', doc: hydrate(raw) })
      setStatus(`Loaded ${file.name}.`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not load that file.')
    }
  }

  const copyMarkdown = async () => {
    const md = buildMarkdown(doc, results)
    try {
      await navigator.clipboard.writeText(md)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setStatus('Clipboard blocked by the browser — use "Download Markdown" instead.')
    }
  }

  return (
    <>
      <header className="step-head">
        <p className="eyebrow">Export</p>
        <h1>Take it with you</h1>
        <p>
          Everything lives in your browser and never leaves this device. Export to move it
          somewhere else, or to hand it to someone who needs to review it.
        </p>
      </header>

      <Card title="Share the case" sub="Pick the format that suits who is reading it.">
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => window.print()}>
            {Icon.printer(17)} Print / Save as PDF
          </button>
          <button type="button" className="btn" onClick={copyMarkdown}>
            {copied ? Icon.check(17) : Icon.spark(17)}
            {copied ? 'Copied' : 'Copy as Markdown'}
          </button>
          <button type="button" className="btn" onClick={() => exportMarkdown(doc, results)}>
            {Icon.download(17)} Download Markdown
          </button>
          <button type="button" className="btn" onClick={() => exportCsv(doc, results)}>
            {Icon.download(17)} Download CSV
          </button>
        </div>

        <Note>
          <strong>Print gives you the full document</strong> — every line item expanded, the
          five-year table, the chart and the roadmap. The CSV is laid out to sit alongside the
          original spreadsheets.
        </Note>
      </Card>

      <Card
        title="Save and reopen"
        sub="JSON round-trips everything, including notes and roadmap ticks."
      >
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => exportJson(doc)}>
            {Icon.download(17)} Save project file
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            {Icon.upload(17)} Open project file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {status ? (
          <p className="field-hint" role="status" style={{ marginTop: 10 }}>
            {status}
          </p>
        ) : null}
      </Card>

      <AssistPanel />

      <Card title="Start over" sub="Both actions replace what is currently on screen.">
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (confirm('Load the worked example? This replaces your current project.')) {
                dispatch({ type: 'sample' })
                setStatus('Worked example loaded.')
              }
            }}
          >
            Load worked example
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (confirm('Clear this project and start from blank? This cannot be undone.')) {
                dispatch({ type: 'reset' })
                setStatus('Cleared.')
              }
            }}
          >
            {Icon.trash(16)} Clear everything
          </button>
        </div>
      </Card>

      <Card title="Where the framework comes from">
        <div className="prose">
          <p>
            ProForma implements four source documents: the High-Level Strategic Decision Framework
            (the five-year cost, benefit and risk model), the Cross-Functional AI Project
            Decision-Making Framework (stakeholders and the decision matrix), the End-to-End AI
            Delivery Roadmap (six gates, seven swimlanes), and the industry use-case bank.
          </p>
          <p>
            The frameworks are indicative starting points meant to be tuned to your business. The
            arithmetic here is faithful to them: one-time amounts land in Year 1, annual amounts
            apply to Years 2 through 5.
          </p>
        </div>
      </Card>
    </>
  )
}
