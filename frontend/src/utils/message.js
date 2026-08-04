/**
 * Frontend message/chat model. The backend contract is unchanged; these are
 * UI-level shapes only.
 */

/** Stable, readable ids for messages (not array indexes). */
export function createId(prefix = 'msg') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createUserMessage(content) {
  return {
    id: createId('user'),
    role: 'user',
    content,
    status: 'completed',
  }
}

export function createAssistantMessage(content = '') {
  return {
    id: createId('assistant'),
    role: 'assistant',
    content,
    status: 'pending',
  }
}

/**
 * Build the request payload sent to /api/chat/stream.
 * Mirrors the prior frontend behaviour: only content + role, no synthetic
 * system header (the backend injects it when missing).
 */
export function toChatRequest(messages) {
  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map(({ role, content }) => ({ role, content }))
  return { messages: history }
}