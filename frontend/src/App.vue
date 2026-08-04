<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const messages = ref([])
const input = ref('')
const streaming = ref(false)
const detail = ref('')
const status = ref('checking') // checking | ok | unavailable
const scrollRef = ref(null)

async function checkStatus() {
  status.value = 'checking'
  try {
    const res = await fetch('/api/health')
    const data = await res.json()
    detail.value = data.detail || ''
    status.value = data.status === 'ok' ? 'ok' : 'unavailable'
  } catch (err) {
    detail.value = String(err)
    status.value = 'unavailable'
  }
}

function scrollToBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(messages, scrollToBottom, { deep: true })

function newChat() {
  if (streaming.value) return
  messages.value = []
}

async function send() {
  const text = input.value.trim()
  if (!text || streaming.value) return

  messages.value.push({ role: 'user', content: text })
  const assistant = { role: 'assistant', content: '', streaming: true }
  messages.value.push(assistant)
  input.value = ''
  streaming.value = true
  scrollToBottom()

  const history = messages.value
    .filter((m) => !(m.streaming))
    .map(({ role, content }) => ({ role, content }))

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    })

    if (!res.ok || !res.body) {
      const textBody = await res.text()
      throw new Error(`Request failed: ${res.status} ${textBody}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let cut = buffer.indexOf('\n\n')
      while (cut !== -1) {
        const event = buffer.slice(0, cut)
        buffer = buffer.slice(cut + 2)
        cut = buffer.indexOf('\n\n')

        for (const rawLine of event.split('\n')) {
          if (!rawLine.startsWith('data:')) continue
          const data = rawLine.slice(5).trim()
          if (!data) continue
          let payload
          try {
            payload = JSON.parse(data)
          } catch (err) {
            continue
          }
          if (payload.delta != null) {
            assistant.content += payload.delta
            scrollToBottom()
          }
        }
      }
    }
  } catch (err) {
    if (!assistant.content) {
      assistant.content = `⚠️ ${err.message}`
    }
  } finally {
    assistant.streaming = false
    streaming.value = false
    scrollToBottom()
  }
}

function onKeydown(ev) {
  if (ev.key === 'Enter' && !ev.shiftKey) {
    ev.preventDefault()
    send()
  }
}

onMounted(checkStatus)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <h1>LLM Chat</h1>
      <div class="status" :class="status">
        <span class="dot"></span>
        <span v-if="status === 'ok'">Model available</span>
        <span v-else-if="status === 'checking'">Checking…</span>
        <span v-else>Model unavailable</span>
      </div>
      <button class="ghost" :disabled="streaming" @click="newChat">New chat</button>
    </header>

    <div class="banner danger" v-if="status === 'unavailable'">
      Cannot reach the LLM backend{{ detail ? ` — ${detail}` : '' }}. Streaming responses will fail
      until the vLLM server is reachable.
    </div>

    <main ref="scrollRef" class="messages">
      <div v-if="messages.length === 0" class="empty">
        <div class="empty-title">Start a conversation</div>
        <div class="empty-sub">Type a message below to chat with the local model.</div>
      </div>

      <div
        v-for="(m, i) in messages"
        :key="i"
        class="row"
        :class="m.role"
      >
        <div class="bubble">{{ m.content }}<span class="caret" v-if="m.streaming"></span></div>
      </div>
    </main>

    <footer class="composer">
      <div class="composer-inner">
        <textarea
          v-model="input"
          rows="1"
          :disabled="streaming"
          placeholder="Type a message… (Enter to send, Shift+Enter for a new line)"
          @keydown="onKeydown"
        ></textarea>
        <button class="send" :disabled="streaming || !input.trim()" @click="send">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
      <div class="hint">Responses are streamed live from your local vLLM server.</div>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-alt);
}

.topbar h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-dim);
}

.status .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #6c747d;
}

.status.ok .dot {
  background: #37c27a;
  box-shadow: 0 0 8px #37c27a88;
}

.status.unavailable .dot {
  background: var(--danger);
}

.status.unavailable {
  color: var(--danger);
}

.ghost {
  margin-left: auto;
  background: transparent;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
}

.ghost:hover {
  color: var(--text);
  border-color: var(--accent);
}

.ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.banner {
  padding: 10px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}

.banner.danger {
  background: #3a2626;
  color: #f29a9a;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty {
  margin: auto;
  text-align: center;
  color: var(--text-dim);
}

.empty-title {
  font-size: 20px;
  color: var(--text);
  font-weight: 600;
}

.empty-sub {
  margin-top: 8px;
  font-size: 14px;
}

.row {
  display: flex;
}

.row.user {
  justify-content: flex-end;
}

.row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 78%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.row.user .bubble {
  background: var(--user-bubble);
  border-bottom-right-radius: 4px;
  color: #fff;
}

.row.assistant .bubble {
  background: var(--assistant-bubble);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.caret {
  display: inline-block;
  width: 7px;
  height: 15px;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--accent);
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

.composer {
  padding: 14px 20px 18px;
  border-top: 1px solid var(--border);
  background: var(--bg-alt);
}

.composer-inner {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 10px 10px 16px;
}

textarea {
  flex: 1;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  max-height: 200px;
}

textarea::placeholder {
  color: var(--text-dim);
}

.send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.send:hover {
  background: var(--accent-2);
}

.send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-dim);
}
</style>