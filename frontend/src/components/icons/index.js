/**
 * Minimal inline SVG icon set (currentColor, stroke-based, Lucide-style paths).
 * No icon library is pulled in — only the handful actually used.
 */
import { h } from 'vue'

function icon(name, paths, viewBox = '0 0 24 24') {
  return {
    name,
    render() {
      return h(
        'svg',
        {
          viewBox,
          width: '18',
          height: '18',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
        },
        paths.map((p) => h('path', p)),
      )
    },
  }
}

export const IconSend = icon('send', [
  { d: 'm22 2-7 20-4-9-9-4Z' },
  { d: 'M22 2 11 13' },
])
export const IconStop = icon('stop', [{ d: 'M5 5h14v14H5z' }])
export const IconPlus = icon('plus', [{ d: 'M12 5v14' }, { d: 'M5 12h14' }])
export const IconCopy = icon('copy', [
  { d: 'M8 8h12v12H8z' },
  { d: 'M16 8V4H4v12h4' },
])
export const IconCheck = icon('check', [{ d: 'M20 6 9 17l-5-5' }])
export const IconRetry = icon('retry', [
  { d: 'M3 12a9 9 0 1 0 3-6.7' },
  { d: 'M3 4v6h6' },
])
export const IconSun = icon('sun', [
  { d: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z' },
  { d: 'M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4' },
])
export const IconMoon = icon('moon', [
  { d: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z' },
])
export const IconMonitor = icon('monitor', [
  { d: 'M2 4h20v12H2z' },
  { d: 'M8 20h8M12 16v4' },
])
export const IconChevronDown = icon('chevron-down', [{ d: 'm6 9 6 6 6-6' }])
export const IconWifi = icon('wifi', [
  { d: 'M5 13a10 10 0 0 1 14 0' },
  { d: 'M8.5 16.5a5 5 0 0 1 7 0' },
  { d: 'M2 9.5a15 15 0 0 1 20 0' },
  { d: 'M12 20h.01' },
])
export const IconWifiOff = icon('wifi-off', [
  { d: 'M2 9.5a15 15 0 0 1 6.4-2.4M9 2.9a15 15 0 0 1 13 6.6' },
  { d: 'M8.5 16.5a5 5 0 0 1 3-1.5M12 20h.01' },
  { d: 'M5 13a10 10 0 0 1 3.9-1.8M18.3 9.3A15 15 0 0 0 22 9.5' },
  { d: 'm2 2 20 20' },
])