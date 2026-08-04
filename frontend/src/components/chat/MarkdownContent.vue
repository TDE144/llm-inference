<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { renderMarkdown } from '../../utils/markdown.js'

const props = defineProps({
  text: { type: String, default: '' },
})

const containerRef = ref(null)

// Render once per non-empty content value. Streaming updates the same string,
// so this re-parses as deltas arrive — acceptable for typical message sizes.
const html = computed(() => renderMarkdown(props.text))

function findPre(btn) {
  const block = btn.closest('.code-block')
  return block ? block.querySelector('pre code') : null
}

async function onCopyClick(btn) {
  const codeEl = findPre(btn)
  if (!codeEl) return
  try {
    await navigator.clipboard.writeText(codeEl.textContent || '')
    const original = btn.textContent
    btn.textContent = 'Copied'
    setTimeout(() => {
      if (btn.isConnected) btn.textContent = original
    }, 1600)
  } catch {
    /* clipboard unavailable */
  }
}

function onContainerClick(event) {
  const btn = event.target.closest('.code-block-copy-btn')
  if (btn) onCopyClick(btn)
}

onMounted(() => {
  containerRef.value?.addEventListener('click', onContainerClick)
})

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('click', onContainerClick)
})
</script>

<template>
  <div
    ref="containerRef"
    class="markdown-content"
    data-testid="markdown"
    v-html="html"
  ></div>
</template>

<style>
/* Global (not scoped): the rendered HTML is injected from marked + DOMPurify. */
.markdown-content {
  --code-font: var(--font-mono);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  color: var(--color-text-primary);
  word-break: break-word;
  overflow-wrap: anywhere;
}

.markdown-content > *:first-child {
  margin-top: 0;
}

.markdown-content > *:last-child {
  margin-bottom: 0;
}

.markdown-content p {
  margin: 0 0 12px;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4 {
  margin: 20px 0 8px;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-content h1 {
  font-size: 1.25em;
}

.markdown-content h2 {
  font-size: 1.15em;
}

.markdown-content h3 {
  font-size: 1.05em;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0 0 12px;
  padding-left: 24px;
}

.markdown-content li {
  margin: 4px 0;
}

.markdown-content blockquote {
  margin: 0 0 12px;
  padding: 4px 16px;
  border-left: 3px solid var(--color-accent);
  color: var(--color-text-secondary);
}

.markdown-content code.inline-code {
  font-family: var(--code-font);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  border-radius: var(--radius-sm);
  background: var(--color-code-bg);
  border: 1px solid var(--color-code-border);
}

.markdown-content a {
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 16px 0;
}

.markdown-content table {
  border-collapse: collapse;
  margin: 0 0 12px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.markdown-content th,
.markdown-content td {
  border: 1px solid var(--color-border);
  padding: 6px 10px;
  font-size: var(--font-size-md);
  text-align: left;
}

.markdown-content th {
  background: var(--color-surface-hover);
  font-weight: 600;
}

/* Code blocks */
.markdown-content .code-block {
  margin: 0 0 14px;
  border: 1px solid var(--color-code-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-code-bg);
}

.markdown-content .code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  border-bottom: 1px solid var(--color-code-border);
  font-family: var(--code-font);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-surface);
}

.markdown-content .code-block-copy-btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.markdown-content .code-block-copy-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.markdown-content .code-block > pre {
  margin: 0;
  overflow-x: auto;
  padding: 12px 14px;
}

.markdown-content .code-block > pre code {
  font-family: var(--code-font);
  font-size: var(--font-size-sm);
  line-height: 1.55;
  white-space: pre;
  color: var(--color-text-primary);
}
</style>