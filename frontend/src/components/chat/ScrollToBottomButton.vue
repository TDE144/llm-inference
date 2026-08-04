<script setup>
import { IconChevronDown } from '../icons/index.js'

defineProps({
  visible: { type: Boolean, default: false },
})
defineEmits(['scroll-bottom'])
</script>

<template>
  <transition name="fade">
    <button
      v-if="visible"
      type="button"
      class="scroll-bottom"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
      @click="$emit('scroll-bottom')"
    >
      <IconChevronDown />
    </button>
  </transition>
</template>

<style scoped>
.scroll-bottom {
  position: absolute;
  bottom: var(--space-5);
  left: 50%;
  transform: translateX(-50%);
  width: var(--touch-target);
  height: var(--touch-target);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  z-index: 5;
  transition: background var(--transition-fast);
}

.scroll-bottom:hover {
  background: var(--color-surface-hover);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>