<script setup>
import { ref, watch } from 'vue'
import { IconCheck, IconCopy, IconRetry } from '../icons/index.js'

const props = defineProps({
  text: { type: String, default: '' },
  showRetry: { type: Boolean, default: false },
})

const emit = defineEmits(['copy', 'retry'])

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    emit('copy')
    setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    /* clipboard unavailable; leave copied=false */
  }
}

function retry() {
  emit('retry')
}

watch(
  () => props.text,
  () => {
    copied.value = false
  },
)
</script>

<template>
  <div class="actions">
    <button
      v-if="showRetry"
      type="button"
      class="action"
      aria-label="Regenerate response"
      title="Regenerate"
      @click="retry"
    >
      <IconRetry />
    </button>
    <button
      type="button"
      class="action"
      :aria-label="copied ? 'Copied' : 'Copy message'"
      :title="copied ? 'Copied' : 'Copy'"
      @click="copy"
    >
      <IconCheck v-if="copied" />
      <IconCopy v-else />
    </button>
  </div>
</template>

<style scoped>
.actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

:global(.message-row:hover) .actions,
.action:focus-visible {
  opacity: 1;
}

.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.action:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.action > svg {
  width: 15px;
  height: 15px;
}

/* Keep actions reachable on touch (opacity reset on tap devices). */
@media (hover: none) {
  .actions {
    opacity: 1;
  }
}
</style>