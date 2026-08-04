<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { IconSend, IconStop } from '../icons/index.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  generating: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'send', 'stop'])

const textareaEl = ref(null)
const isComposing = ref(false)
const MAX_HEIGHT = 200

function currentValue() {
  return textareaEl.value ? textareaEl.value.value : props.modelValue
}

function autoResize() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  const next = Math.min(el.scrollHeight, MAX_HEIGHT)
  el.style.height = `${next}px`
}

function onInput() {
  emit('update:modelValue', currentValue())
  autoResize()
}

function submit() {
  if (props.generating) return
  const text = (props.modelValue || '').trim()
  if (!text) return
  emit('update:modelValue', '')
  emit('send', text)
  nextTick(autoResize)
}

function onKeydown(event) {
  if (props.generating) return
  // Do not submit during IME composition.
  if (event.key === 'Enter' && !event.shiftKey && !isComposing.value) {
    event.preventDefault()
    submit()
  }
}

watch(
  () => props.modelValue,
  () => nextTick(autoResize),
)

onMounted(() => nextTick(autoResize))

defineExpose({ focus: () => textareaEl.value?.focus() })
</script>

<template>
  <div class="composer-wrap">
    <div class="composer-inner">
      <textarea
        ref="textareaEl"
        :value="modelValue"
        :disabled="generating"
        class="composer-input"
        rows="1"
        placeholder="Message the assistant…"
        aria-label="Message"
        @input="onInput"
        @keydown="onKeydown"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
      ></textarea>

      <button
        type="button"
        class="composer-action"
        :class="generating ? 'stop' : 'send'"
        :disabled="!generating && !(modelValue || '').trim()"
        :aria-label="generating ? 'Stop generating' : 'Send message'"
        :title="generating ? 'Stop' : 'Send'"
        @click="generating ? emit('stop') : submit()"
      >
        <IconStop v-if="generating" />
        <IconSend v-else />
      </button>
    </div>
    <p class="composer-hint">
      <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line
    </p>
  </div>
</template>

<style scoped>
.composer-wrap {
  position: relative;
}

.composer-inner {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.composer-inner:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.composer-input {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-lg);
  line-height: 1.5;
  padding: var(--space-2) 0;
  max-height: 200px;
  overflow-y: auto;
  outline: none;
}

.composer-input::placeholder {
  color: var(--color-text-muted);
}

.composer-input:disabled {
  opacity: 0.7;
}

.composer-action {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.composer-action > svg {
  width: 17px;
  height: 17px;
}

.composer-action.send {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.composer-action.send:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.composer-action.stop {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.composer-action.stop:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.composer-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.composer-hint {
  margin: var(--space-2) 0 0;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.composer-hint kbd {
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  padding: 1px 5px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-elevated);
}
</style>