<script setup>
import { onMounted, ref } from 'vue'
import ChatHeader from './components/chat/ChatHeader.vue'
import MessageList from './components/chat/MessageList.vue'
import ChatComposer from './components/chat/ChatComposer.vue'
import ScrollToBottomButton from './components/chat/ScrollToBottomButton.vue'
import { useTheme } from './composables/useTheme.js'
import { useChat } from './composables/useChat.js'
import { useAutoScroll } from './composables/useAutoScroll.js'

const { theme, setTheme } = useTheme()

const scroller = ref(null)
const composerRef = ref(null)

const auto = useAutoScroll(scroller)

const scrollToBottom = ({ force = false } = {}) => {
  if (force) auto.forceScrollToBottom()
  else auto.scrollToBottomIfNeeded()
}

const chat = useChat({ scrollToBottom })

// Top-level alias so v-model binds to a plain unwrapped ref reliably.
const input = chat.input

onMounted(() => {
  chat.refreshHealth()
})

function onSuggest(prompt) {
  input.value = prompt
  composerRef.value?.focus()
}

function onNewChat() {
  chat.newChat()
  auto.forceScrollToBottom()
  composerRef.value?.focus()
}

function onStop() {
  chat.abortCurrent()
}
</script>

<template>
  <div class="app-layout">
    <ChatHeader
      :app-name="'Assistant'"
      :connection="chat.connection.value"
      :model="chat.model.value"
      :generating="chat.isGenerating.value"
      :theme="theme"
      @new-chat="onNewChat"
      @update:theme="setTheme"
    />

    <div v-if="chat.connection.value === 'unavailable'" class="offline-banner" role="alert">
      The model server is unreachable. Responses may fail until it is back online.
    </div>

    <main ref="scroller" class="scroller" @scroll="auto.onScroll">
      <MessageList :messages="chat.messages.value" @suggest="onSuggest" @retry="chat.retry" />
      <ScrollToBottomButton :visible="!auto.isAtBottom.value" @scroll-bottom="auto.forceScrollToBottom" />
    </main>

    <footer class="composer-area">
      <div class="composer-col">
        <ChatComposer
          ref="composerRef"
          v-model="input"
          :generating="chat.isGenerating.value"
          @send="chat.send"
          @stop="onStop"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  height: 100vh;
  background: var(--color-background);
}

.scroller {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scroll-behavior: auto;
}

.offline-banner {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4);
  background: var(--color-error-bg);
  color: var(--color-error);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
  text-align: center;
}

.composer-area {
  flex-shrink: 0;
  padding: var(--space-3) var(--space-4)
    calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.composer-col {
  max-width: var(--content-max-width);
  margin: 0 auto;
}
</style>