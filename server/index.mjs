/**
 * ProForma AI Assist — optional local review server.
 *
 * ProForma works completely without this. Run it only when you want the
 * "Review this business case" button on the Export step to do something.
 *
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."     # PowerShell
 *   export ANTHROPIC_API_KEY="sk-ant-..."     # bash
 *   npm run assist
 *
 * The key stays in this process. It is never sent to the browser, which is the
 * whole reason this file exists rather than calling the API from the frontend.
 */

import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 8787)
const MODEL = process.env.PROFORMA_MODEL ?? 'claude-opus-5'
const MAX_BODY = 1_000_000 // 1 MB — a business case is text, not a payload

const SYSTEM = `You are reviewing a five-year AI business case on behalf of a sceptical CFO.

The case was built from a strategic decision framework where one-time amounts land in Year 1 and annual amounts apply to Years 2-5.

Give a focused review, in this order:

1. The single weakest number in the case, and why a reviewer would pull on it first.
2. Costs that look absent or understated. Be specific about what is missing.
3. Benefit claims that lack a derivation, or whose derivation does not support the figure.
4. Whether the risk mitigation budget is proportionate to the risk scores recorded.
5. The one question you would ask in the approval meeting.

Rules: be direct and brief. Use plain prose, not headers or bullet walls. Do not restate the numbers back — the reader has them. If the case is genuinely sound, say so plainly rather than manufacturing concerns. Around 300 words.`

let client = null

async function getClient() {
  if (client) return client
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  client = new Anthropic()
  return client
}

function send(res, status, body, type = 'application/json') {
  const payload = type === 'application/json' ? JSON.stringify(body) : String(body)
  res.writeHead(status, {
    'content-type': `${type}; charset=utf-8`,
    'cache-control': 'no-store',
  })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  // Local dev only — the Vite proxy fronts this, so same-origin in practice.
  res.setHeader('access-control-allow-origin', 'http://localhost:5173')
  res.setHeader('access-control-allow-headers', 'content-type')
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return send(res, 204, '')

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (url.pathname === '/api/assist/health') {
    let sdkPresent = true
    try {
      await import('@anthropic-ai/sdk')
    } catch {
      sdkPresent = false
    }
    return send(res, 200, {
      ready: Boolean(process.env.ANTHROPIC_API_KEY) && sdkPresent,
      model: MODEL,
      reason: !process.env.ANTHROPIC_API_KEY
        ? 'ANTHROPIC_API_KEY is not set'
        : !sdkPresent
          ? '@anthropic-ai/sdk is not installed'
          : null,
    })
  }

  if (url.pathname === '/api/assist/review' && req.method === 'POST') {
    if (!process.env.ANTHROPIC_API_KEY) {
      return send(res, 503, 'ANTHROPIC_API_KEY is not set on the assist server.', 'text/plain')
    }
    try {
      const raw = await readBody(req)
      const { document } = JSON.parse(raw || '{}')
      if (typeof document !== 'string' || !document.trim()) {
        return send(res, 400, 'No document supplied.', 'text/plain')
      }

      const anthropic = await getClient()
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        messages: [{ role: 'user', content: document.slice(0, 200_000) }],
      })

      if (message.stop_reason === 'refusal') {
        return send(res, 200, {
          review:
            'The model declined to review this document. Check whether it contains content that trips a safety classifier.',
        })
      }

      const review = message.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()

      return send(res, 200, { review })
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Unknown error'
      console.error('[assist] review failed:', detail)
      return send(res, 500, `Review failed: ${detail}`, 'text/plain')
    }
  }

  return send(res, 404, 'Not found', 'text/plain')
})

server.listen(PORT, '127.0.0.1', () => {
  const keyed = Boolean(process.env.ANTHROPIC_API_KEY)
  console.log(`ProForma assist listening on http://127.0.0.1:${PORT}`)
  console.log(`  model: ${MODEL}`)
  console.log(
    keyed
      ? '  ANTHROPIC_API_KEY: set'
      : '  ANTHROPIC_API_KEY: NOT SET — the review endpoint will return 503',
  )
})
