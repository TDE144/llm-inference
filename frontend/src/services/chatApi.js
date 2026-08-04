/**
 * Backend API client. Keeps the exact HTTP contract unchanged:
 *   GET  /api/health           JSON
 *   POST /api/chat/stream      SSE: data: {"delta":"…"} … event: done|error
 */

export class ApiError extends Error {
  constructor(message, kind = 'server') {
    super(message)
    this.kind = kind
    this.name = 'ApiError'
  }
}

export async function fetchHealth() {
  const res = await fetch('/api/health')
  const data = await res.json()
  return data
}

/**
 * Streams chat completions.
 * @param {object} opts
 * @param {{role:string,content:string}[]} opts.messages
 * @param {AbortSignal} [opts.signal]
 * @param {(delta:string)=>void} opts.onDelta
 * @param {()=>void} [opts.onDone]
 * @param {(message:string)=>void} [opts.onError] server-reported error event
 * @returns {Promise<void>} resolves on clean completion; rejects on network/http/parse errors (abort resolves).
 */
export async function streamChat({ messages, signal, onDelta, onDone, onError }) {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new ApiError(
      text ? `Request failed (${res.status}): ${text.slice(0, 500)}` : `Request failed (${res.status})`,
      res.status >= 500 ? 'server' : 'http',
    )
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE blocks (events separated by a blank line).
      let sep
      while ((sep = indexOfBlankLine(buffer)) !== -1) {
        const block = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)

        let eventName = ''
        let dataLine = ''
        for (const rawLine of block.split('\n')) {
          if (rawLine.startsWith('event:')) {
            eventName = rawLine.slice('event:'.length).trim()
          } else if (rawLine.startsWith('data:')) {
            dataLine = rawLine.slice('data:'.length).trim()
          }
        }

        if (!dataLine || dataLine === '[DONE]') continue

        let payload
        try {
          payload = JSON.parse(dataLine)
        } catch {
          // Malformed payload: ignore and keep streaming.
          continue
        }

        if (eventName === 'error') {
          onError?.(payload?.message || 'The model server reported an error.')
          return
        }
        if (eventName === 'done') {
          onDone?.()
          return
        }
        if (typeof payload?.delta === 'string' && payload.delta.length > 0) {
          onDelta(payload.delta)
        }
      }
    }
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* already closed */
    }
  }
}

/** Find the index of a blank line ("\n\n" or "\r\n\r\n") in an SSE buffer. */
function indexOfBlankLine(buffer) {
  if (buffer.startsWith('\n')) return 0
  const lf = buffer.indexOf('\n\n')
  const crlf = buffer.indexOf('\r\n\r\n')
  if (lf === -1) return crlf
  if (crlf === -1) return lf
  return Math.min(lf, crlf)
}