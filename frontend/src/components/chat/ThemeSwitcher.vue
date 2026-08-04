<script setup>
import { IconMonitor, IconMoon, IconSun } from '../icons/index.js'

defineProps({
  modelValue: { type: String, default: 'system' },
})

const emit = defineEmits(['update:modelValue'])

const options = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconMonitor },
]

function select(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="theme-switcher" role="group" aria-label="Color theme">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="theme-btn"
      :class="{ active: modelValue === opt.value }"
      :aria-label="`Use ${opt.label} theme`"
      :aria-pressed="modelValue === opt.value"
      :title="opt.label"
      @click="select(opt.value)"
    >
      <component :is="opt.icon" />
    </button>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.theme-btn > svg {
  width: 16px;
  height: 16px;
}

.theme-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.theme-btn.active {
  background: var(--color-surface-elevated);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}
</style>