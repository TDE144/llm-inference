/**
 * Mapping of low-level failures to user-facing, non-technical messages.
 * Raw exceptions/stacks are never surfaced to the UI.
 */

export const ErrorKind = Object.freeze({
  ABORTED: 'aborted',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  HTTP: 'http',
  PARSING: 'parsing',
  SERVER: 'server',
  UNKNOWN: 'unknown',
})

export function isAbortError(err) {
  return (
    err &&
    (err.name === 'AbortError' ||
      err.code === 20 /* DOMException ABORT_ERR */ ||
      err instanceof DOMException && err.name === 'AbortError')
  )
}

export function classifyError(err) {
  if (isAbortError(err)) return ErrorKind.ABORTED
  if (err && (err.kind === 'server' || err.kind === 'http')) return err.kind
  if (err && (err.name === 'TimeoutError' || err.name === 'timeout')) return ErrorKind.TIMEOUT
  if (err && (err instanceof TypeError || err.name === 'TypeError')) return ErrorKind.NETWORK
  return ErrorKind.UNKNOWN
}

/** Human-readable copy for the message error row / banner. */
export function errorMessage(kind, detail = '') {
  switch (kind) {
    case ErrorKind.ABORTED:
      return 'Generation stopped.'
    case ErrorKind.TIMEOUT:
      return 'The model took too long to respond.'
    case ErrorKind.NETWORK:
      return 'Connection to the model server was interrupted.'
    case ErrorKind.HTTP:
      return `The server returned an error.${detail ? ` ${detail}` : ''}`
    case ErrorKind.SERVER:
      return detail || 'The model server reported an error.'
    case ErrorKind.PARSING:
      return 'The response from the server could not be read.'
    default:
      return 'Something went wrong while generating a response.'
  }
}