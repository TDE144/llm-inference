import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Safe Markdown rendering pipeline.
 *  - marked parses markdown to HTML (no raw HTML execution by itself).
 *  - DOMPurify sanitizes the resulting HTML (strips scripts, javascript: URLs,
 *    event handlers, unknown tags, etc.).
 *  - External links get safe rel/target attributes.
 */

function escapeHtml(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    // External links: open in a new tab with safe rel attributes.
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens)
      const safeHref = String(href).replace(/"/g, '&quot;')
      return `<a href="${safeHref}" rel="noopener noreferrer" target="_blank"${
        title ? ` title="${title}"` : ''
      }>${text}</a>`
    },
    // Fenced/inline code: emit a header with the language + a copy button.
    codespan(code) {
      return `<code class="inline-code">${escapeHtml(code)}</code>`
    },
    code(code, infostring) {
      if (!infostring) {
        return `<div class="code-block"><pre><code>${escapeHtml(code)}</code></pre></div>`
      }
      const info = String(infostring).split(/\s+/)[0]
      const safeInfo = info.replace(/[^\w+-]/g, '')
      return (
        `<div class="code-block">` +
        `<div class="code-block-header"><span class="code-block-lang">${escapeHtml(
          safeInfo || 'code',
        )}</span>` +
        `<button type="button" class="code-block-copy-btn" aria-label="Copy code">Copy</button></div>` +
        `<pre><code class="language-${escapeHtml(safeInfo)}">${escapeHtml(code)}</code></pre>` +
        `</div>`
      )
    },
  },
})

let initialized = false
function initPurify() {
  if (initialized) return
  initialized = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (/^(https?:|mailto:|ftp:)/i.test(href)) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      } else {
        node.removeAttribute('target')
      }
    }
  })
}

const PURIFY_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
}

/** Render and sanitize arbitrary model text into safe HTML. */
export function renderMarkdown(text) {
  initPurify()
  const raw = marked.parse(text ?? '')
  return DOMPurify.sanitize(raw, PURIFY_CONFIG)
}