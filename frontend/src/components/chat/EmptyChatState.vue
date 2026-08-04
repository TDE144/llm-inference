<script setup>
import logo from '../../../img/logo.png'

const emit = defineEmits(['suggest'])

const suggestions = [
  {
    title: 'Explain a topic',
    prompt: 'Explain how attention works in transformer models.',
  },
  {
    title: 'Help with code',
    prompt: 'Review this Python snippet and suggest improvements.',
  },
  {
    title: 'Analyze an error',
    prompt: 'Help me debug an HTTP 502 from a FastAPI backend.',
  },
  {
    title: 'Make a plan',
    prompt: 'Outline a plan for building a small REST API with FastAPI.',
  },
]

function suggest(prompt) {
  emit('suggest', prompt)
}
</script>

<template>
  <div class="empty" role="presentation">
    <div class="empty-inner">
      <img class="empty-logo" :src="logo" alt="DickPick logo" />
      <h2 class="empty-title">Start a conversation</h2>
      <p class="empty-sub">Ask anything — the assistant responds live.</p>

      <div class="suggestions" role="list" aria-label="Suggested prompts">
        <button
          v-for="s in suggestions"
          :key="s.title"
          type="button"
          class="suggestion"
          role="listitem"
          @click="suggest(s.prompt)"
        >
          <span class="suggestion-title">{{ s.title }}</span>
          <span class="suggestion-prompt">{{ s.prompt }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--space-5) var(--space-4);
}

.empty-inner {
  max-width: 560px;
  width: 100%;
  text-align: center;
}

.empty-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-4);
  border-radius: var(--radius-lg);
  display: block;
}

.empty-title {
  margin: 0 0 var(--space-2);
  font-family: var(--font-brand);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-brand);
}

.empty-sub {
  margin: 0 0 var(--space-6);
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}

.suggestions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  text-align: left;
}

@media (max-width: 560px) {
  .suggestions {
    grid-template-columns: 1fr;
  }
}

.suggestion {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  min-height: var(--touch-target);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.suggestion:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-hover);
}

.suggestion-title {
  font-size: var(--font-size-md);
  font-weight: 600;
}

.suggestion-prompt {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>