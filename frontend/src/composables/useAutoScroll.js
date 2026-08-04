import { nextTick, onBeforeUnmount, ref } from 'vue'

/**
 * Auto-scroll behaviour for the message list.
 * - Only auto-scrolls while the user is near the bottom.
 * - If the user scrolled up, do not force them down.
 * - Write operations are coalesced with requestAnimationFrame to avoid jank
 *   during streaming.
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef
 */
export function useAutoScroll(containerRef) {
  const isAtBottom = ref(true)
  const nearBottomThreshold = 120
  let rafId = null

  function checkPosition(el) {
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottom.value = distance <= nearBottomThreshold
  }

  function scrollToBottom({ smooth = false } = {}) {
    const el = containerRef.value
    if (!el) return
    const behavior = smooth
      ? // Respect reduced-motion preference (CSS handles the actual animation).
        'smooth'
      : 'auto'
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  function scrollToBottomIfNeeded({ force = false } = {}) {
    const el = containerRef.value
    if (!el) return
    if (!force && !isAtBottom.value) return

    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      if (!containerRef.value) return
      checkPosition(containerRef.value)
      if (force || isAtBottom.value) scrollToBottom()
    })
  }

  function forceScrollToBottom() {
    scrollToBottomIfNeeded({ force: true })
  }

  function onScroll() {
    checkPosition(containerRef.value)
  }

  // Re-check once after a full frame so streaming layout settles smoothly.
  function schedulePositionCheck() {
    nextTick(() => checkPosition(containerRef.value))
  }

  onBeforeUnmount(() => {
    if (rafId != null) cancelAnimationFrame(rafId)
  })

  return {
    isAtBottom,
    forceScrollToBottom,
    scrollToBottomIfNeeded,
    schedulePositionCheck,
    onScroll,
  }
}