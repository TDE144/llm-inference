<script setup>
import ConnectionStatus from './ConnectionStatus.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { IconPlus } from '../icons/index.js'
import logo from '../../../img/logo.png'

defineProps({
  appName: { type: String, default: 'Assistant' },
  connection: { type: String, default: 'checking' },
  model: { type: String, default: '' },
  generating: { type: Boolean, default: false },
  theme: { type: String, default: 'system' },
})

const emit = defineEmits(['new-chat', 'update:theme'])
</script>

<template>
  <header class="chat-header">
    <div class="header-inner">
      <div class="brand">
        <img class="brand-logo" :src="logo" width="28" height="28" alt="DickPick logo" />
        <h1 class="header-title">{{ appName }}</h1>
      </div>

      <ConnectionStatus
        :connection="connection"
        :model="model"
        :generating="generating"
      />

      <div class="header-actions">
        <button
          type="button"
          class="ghost new-chat"
          :disabled="generating"
          aria-label="New chat"
          title="New chat"
          @click="emit('new-chat')"
        >
          <IconPlus />
          <span class="new-chat-text">New chat</span>
        </button>

        <ThemeSwitcher :model-value="theme" @update:model-value="emit('update:theme', $event)" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.chat-header {
  flex-shrink: 0;
  height: var(--header-height);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.header-inner {
  height: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.brand-logo {
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-family: var(--font-brand);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-brand);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 38px;
  padding: 0 var(--space-3);
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast),
    background var(--transition-fast);
}

.ghost > svg {
  width: 16px;
  height: 16px;
}

.new-chat:hover:not(:disabled) {
  color: var(--color-text-primary);
  border-color: var(--color-accent);
  background: var(--color-surface-hover);
}

.ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .header-inner {
    gap: var(--space-2);
  }

  .new-chat-text {
    display: none;
  }

  .new-chat {
    width: 38px;
    padding: 0;
    justify-content: center;
  }
}
</style>