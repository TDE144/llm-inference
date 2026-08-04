<script setup>
import { computed } from 'vue'
import MessageActions from './MessageActions.vue'
import MarkdownContent from './MarkdownContent.vue'
import TypingIndicator from './TypingIndicator.vue'

const props = defineProps({
  message: { type: Object, required: true },
})

const isUser = computed(() => props.message.role === 'user')
const isStreaming = computed(
  () => props.message.status === 'sending' || props.message.status === 'streaming',
)
const isPending = computed(() => props.message.status === 'pending')
const streamingEmpty = computed(() => isPending.value || (isStreaming.value && !props.message.content))
const isError = computed(() => props.message.status === 'error')
const isCancelled = computed(() => props.message.status === 'cancelled')
const isCompleted = computed(() => props.message.status === 'completed')

// Live-region copy so a screen reader announces start/end without
// interrupting on every streaming token.
const liveText = computed(() => {
  if (streamingEmpty.value) return 'Assistant is typing'
  if (isStreaming.value) return ''
  if (isCompleted.value && props.message.content) return 'Assistant response complete'
  return ''
})
</script>

<template>
  <div
    class="message-row"
    :class="[message.role, { error: isError }]"
    role="listitem"
    :aria-busy="isPending || isStreaming ? 'true' : 'false'"
  >
    <!-- User message -->
    <template v-if="isUser">
      <div class="bubble user-bubble">
        {{ message.content }}
      </div>
      <MessageActions :text="message.content" />
    </template>

    <!-- Assistant message -->
    <template v-else>
      <div class="assistant-head">
        <span class="assistant-label">Assistant</span>
        <MessageActions
          :text="message.content"
          :show-retry="isError || isCancelled"
          @retry="$emit('retry', message)"
        />
      </div>

      <div v-if="streamingEmpty" class="typing-wrap">
        <TypingIndicator />
      </div>
      <MarkdownContent v-else-if="message.content" :text="message.content" />

      <p v-if="isError" class="message-error" role="alert">
        {{ message.error }}
      </p>
      <p v-else-if="isCancelled" class="message-muted">Generation stopped.</p>
    </template>

    <span class="sr-only" aria-live="polite">{{ liveText }}</span>
  </div>
</template>

<style scoped>
.message-row {
  position: relative;
}

.bubble {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);
}

.user-bubble {
  background: var(--color-user-bubble);
  color: var(--color-accent-contrast);
  border-bottom-right-radius: var(--radius-sm);
  margin-left: auto;
  max-width: min(620px, 80%);
}

/* Assistant message column */
.assistant-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: 4px;
}

.assistant-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}

.assistant-head :deep(.actions) {
  opacity: 1;
}

.typing-wrap {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) 0;
}

.message-error {
  margin: var(--space-2) 0 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  background: var(--color-error-bg);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.message-muted {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>