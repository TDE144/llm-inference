<script setup>
import ChatMessage from './ChatMessage.vue'
import EmptyChatState from './EmptyChatState.vue'

defineProps({
  messages: { type: Array, required: true },
})
const emit = defineEmits(['suggest', 'retry'])
</script>

<template>
  <div class="message-list" role="list" aria-label="Conversation" aria-live="off">
    <EmptyChatState v-if="messages.length === 0" @suggest="emit('suggest', $event)" />
    <template v-else>
      <ChatMessage
        v-for="m in messages"
        :key="m.id"
        :message="m"
        @retry="emit('retry', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.message-list {
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-4) var(--space-6);
}
</style>