<script setup>
import { computed } from 'vue'
import { IconWifi, IconWifiOff } from '../icons/index.js'

const props = defineProps({
  connection: { type: String, default: 'checking' }, // checking | ok | unavailable
  model: { type: String, default: '' },
  generating: { type: Boolean, default: false },
})

const config = computed(() => {
  switch (props.connection) {
    case 'ok':
      return props.generating
        ? { label: 'Generating', tone: 'generating', icon: IconWifi }
        : { label: 'Connected', tone: 'ok', icon: IconWifi }
    case 'unavailable':
      return { label: 'Offline', tone: 'unavailable', icon: IconWifiOff }
    default:
      return { label: 'Connecting', tone: 'connecting', icon: IconWifi }
  }
})
</script>

<template>
  <span
    class="status"
    :class="config.tone"
    role="status"
    :aria-live="config.tone === 'unavailable' ? 'assertive' : 'polite'"
    :title="generating ? 'Model is generating a response' : ''"
  >
    <span class="dot" aria-hidden="true"></span>
    <span class="label">{{ config.label }}</span>
    <span v-if="model" class="model" :title="model">{{ model }}</span>
  </span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-height: var(--touch-target);
  padding: 0 2px;
}

.status .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
  flex-shrink: 0;
}

.status.ok .dot {
  background: var(--color-success);
}

.status.unavailable .dot {
  background: var(--color-error);
}

.status.unavailable .label {
  color: var(--color-error);
}

.status.generating .dot {
  background: var(--color-accent);
  animation: pulse 1.4s ease-in-out infinite;
}

.status.connecting .dot {
  background: var(--color-warning);
  animation: pulse 1.4s ease-in-out infinite;
}

.status .model {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .status .model {
    display: none;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>