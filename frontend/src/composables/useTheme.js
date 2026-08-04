import { computed, onBeforeUnmount, ref, watch } from 'vue'

const STORAGE_KEY = 'chat-theme'
const THEME_COLOR_EL_ID = 'theme-color-meta'

/**
 * Theme management: light | dark | system.
 * - persisted in localStorage ("chat-theme")
 * - defaults to "system"
 * - applies an attribute on <html data-theme> so themes.css can style it
 * - tracks the system media query only while "system" is selected
 */
export function useTheme() {
  const systemPrefersDark = ref(false)

  const mq = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

  function updateSystemPref() {
    systemPrefersDark.value = mq ? mq.matches : false
  }

  function isSystemDark() {
    return mq ? mq.matches : false
  }

  function loadStoredTheme() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system'
    } catch {
      return 'system'
    }
  }

  const theme = ref(loadStoredTheme())

  function applyToDom(value) {
    document.documentElement.setAttribute('data-theme', value)
    // Keep the browser chrome/tab tint in sync with the "visible" theme.
    const meta = document.getElementById(THEME_COLOR_EL_ID)
    if (meta) {
      const dark = value === 'dark' || (value === 'system' && isSystemDark())
      meta.setAttribute('content', dark ? '#1e1f24' : '#f7f8fa')
    }
  }

  function setTheme(value) {
    const next = value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
    theme.value = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    applyToDom(next)
  }

  // Watch for system changes only when "system" is active.
  const resolved = computed(() => {
    if (theme.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
    return theme.value
  })

  function onSystemChange(event) {
    systemPrefersDark.value = event.matches
    applyToDom('system')
  }

  let onAttachMq = null
  if (mq) {
    // Listeners may be removed when the user leaves "system" mode.
    const attach = () => mq.addEventListener('change', onSystemChange)
    const detach = () => mq.removeEventListener('change', onSystemChange)
    onAttachMq = { attach, detach }
    updateSystemPref()
    if (theme.value === 'system') attach()
  }

  // Sync theme-color and listener state with the resolved initial value.
  applyToDom(theme.value)

  // Keep the listener attached while in "system" mode only.
  const stopWatch = watch(
    theme,
    (value) => {
      if (!onAttachMq) return
      if (value === 'system') onAttachMq.attach()
      else onAttachMq.detach()
      applyToDom(value)
    },
    { immediate: false },
  )

  onBeforeUnmount(() => {
    stopWatch()
    if (onAttachMq) onAttachMq.detach()
  })

  return { theme, resolved, setTheme }
}