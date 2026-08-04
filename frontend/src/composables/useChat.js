import { computed, ref } from 'vue'
import { fetchHealth, streamChat } from '../services/chatApi.js'
import {
  createAssistantMessage,
  createUserMessage,
} from '../utils/message.js'
import { classifyError, errorMessage, isAbortError } from '../utils/errors.js'

/**
 * Central chat state and orchestration.
 * Owns: messages, connection status, generation phase, cancellation, and the
 * streaming loop. UI-only; the backend contract is untouched.
 *
 * @param {object} opts
 * @param {(force?: boolean) => void} opts.scrollToBottom
 */
export function useChat({ scrollToBottom }) {
  const messages = ref([])
  const input = ref('')

  // Connection status for the header / banner.
  const connection = ref('checking') // checking | ok | unavailable
  const connectionDetail = ref('')
  const model = ref('')

  // Generation phase: idle | sending | streaming | cancelling | error
  const phase = ref('idle')

  let controller = null

  const isGenerating = computed(
    () => phase.value === 'sending' || phase.value === 'streaming' || phase.value === 'cancelling',
  )

  async function refreshHealth() {
    connection.value = 'checking'
    try {
      const data = await fetchHealth()
      connectionDetail.value = data.detail || ''
      connection.value = data.status === 'ok' ? 'ok' : 'unavailable'
      model.value = Array.isArray(data.models) && data.models.length ? data.models[0] : model.value
    } catch (err) {
      connectionDetail.value = String(err)
      connection.value = 'unavailable'
    }
  }

  function idleText(text) {
    const t = text == null ? '' : String(text)
    const trimmed = t.trim()
    return { trimmed, isEmpty: trimmed.length === 0 }
  }

  function abortCurrent() {
    if (controller) {
      try {
        controller.abort()
      } catch {
        /* ignore */
      }
      if (phase.value === 'sending' || phase.value === 'streaming') {
        phase.value = 'cancelling'
      }
    }
  }

  function clearMessages() {
    messages.value = []
    phase.value = 'idle'
    controller = null
  }

  async function runStream(target, history) {
    controller = new AbortController()
    const signal = controller.signal
    phase.value = 'sending'
    target.status = 'sending'
    target.error = ''
    scrollToBottom({ force: true })

    try {
      await streamChat({
        messages: history,
        signal,
        onDelta(delta) {
          target.content += delta
          scrollToBottom()
        },
        onError(msg) {
          target.error = msg
          target.status = 'error'
        },
      })
    } catch (err) {
      if (isAbortError(err)) {
        target.status = 'cancelled'
        target.error = ''
      } else {
        const kind = classifyError(err)
        target.status = 'error'
        target.error = errorMessage(kind, err?.message || kind)
      }
    } finally {
      phase.value = 'idle'
      controller = null
      // If the stream ended without an explicit terminal event, finalize it.
      if (target.status === 'sending' || target.status === 'streaming') {
        target.status = 'completed'
      }
      scrollToBottom({ force: true })
    }
  }

  function send(candidate) {
    if (isGenerating.value) return
    const { trimmed, isEmpty } = idleText(candidate ?? input.value)
    if (isEmpty) return

    const userMsg = createUserMessage(trimmed)
    const assistantMsg = createAssistantMessage()
    messages.value.push(userMsg, assistantMsg)
    input.value = ''

    // Operate on the reactive proxy stored in the array, not the raw object,
    // so that streamed deltas (target.content/status) trigger re-renders.
    const reactiveAssistant = messages.value[messages.value.length - 1]
    const history = buildHistory(messages.value)
    runStream(reactiveAssistant, history)
  }

  function retry(assistant) {
    if (isGenerating.value) return
    const idx = messages.value.findIndex((m) => m.id === assistant.id)
    if (idx === -1) return
    // Re-run with the history that existed before this (failed) turn.
    const history = buildHistory(messages.value.slice(0, idx))
    const target = messages.value[idx]
    target.content = ''
    target.error = ''
    runStream(target, history)
  }

  function newChat() {
    const hadActive = isGenerating.value
    if (hadActive) abortCurrent()
    clearMessages()
    return hadActive
  }

  return {
    messages,
    input,
    connection,
    connectionDetail,
    model,
    phase,
    isGenerating,
    send,
    retry,
    newChat,
    refreshHealth,
    abortCurrent,
  }
}

/** History for the backend: completed user/assistant turns only. */
function buildHistory(list) {
  return list
    .filter((m) => m.status === 'completed')
    .map(({ role, content }) => ({ role, content }))
}