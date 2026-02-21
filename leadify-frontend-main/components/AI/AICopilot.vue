<template lang="pug">
.ai-copilot-container
  //- Floating Action Button
  .fixed.bottom-6.right-6.z-50
    el-tooltip(:content="$t('ai.copilot') || 'AI Copilot'" placement="left")
      button.w-14.h-14.rounded-full.flex.items-center.justify-center.shadow-2xl.transition-all.duration-300(
        class="bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-110 hover:shadow-indigo-500/50"
        @click="toggleCopilot"
      )
        Icon(v-if="!isOpen" name="ph:sparkles-bold" size="24" class="text-white")
        Icon(v-else name="ph:x-bold" size="24" class="text-white")

  //- Copilot Panel
  Transition(name="slide-up")
    .fixed.bottom-24.right-6.z-40.w-96.flex.flex-col.overflow-hidden(
      v-if="isOpen"
      class="glass-panel"
    )
      //- Header
      .bg-gradient-to-r.from-violet-600.to-indigo-600.p-4.text-white.flex.items-center.justify-between
        .flex.items-center.gap-2
          Icon(name="ph:robot-bold" size="24")
          div
            h3.font-bold.text-md Leadify Copilot
            p.text-xs.opacity-80 AI-Powered Assistant
        button.opacity-70.hover_opacity-100.transition-opacity(@click="closeCopilot")
          Icon(name="ph:arrows-down-bold" size="18")

      //- Chat Area
      .flex-1.p-4.overflow-y-auto.flex.flex-col.gap-4.bg-white_5(
        ref="chatContainer"
        style="height: 400px; background: var(--bg-card); backdrop-filter: blur(10px);"
      )
        .flex.items-start.gap-3(v-for="(msg, index) in chatHistory" :key="index" :class="{'flex-row-reverse': msg.role === 'user'}")
          .w-8.h-8.rounded-full.flex.items-center.justify-center.shrink-0(
            :class="msg.role === 'assistant' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'"
          )
            Icon(:name="msg.role === 'assistant' ? 'ph:sparkles-fill' : 'ph:user-fill'" size="16")
          
          .p-3.rounded-2xl(
            class="text-sm shadow-sm max-w-[80%]"
            :class="msg.role === 'assistant' ? 'bg-white border text-gray-800' : 'bg-indigo-600 text-white'"
            style="white-space: pre-wrap;"
            v-html="formatMarkdown(msg.content)"
          )
          
        .flex.items-start.gap-3(v-if="isChatLoading")
          .w-8.h-8.rounded-full.flex.items-center.justify-center.shrink-0.bg-indigo-100.text-indigo-600
            Icon(name="ph:sparkles-fill" size="16")
          .p-3.rounded-2xl.bg-white.border.text-gray-500.flex.gap-1
            span.typing-dot
            span.typing-dot
            span.typing-dot

      //- Input Area
      .p-4.bg-white.border-t.border-gray-100
        .flex.items-center.gap-2
          el-input(
            v-model="inputQuery"
            placeholder="Ask Copilot..."
            size="large"
            @keyup.enter="handleSend"
            class="!rounded-full"
          )
            template(#prefix)
              Icon(name="ph:magic-wand" size="18" class="text-indigo-400")
          el-button(
            type="primary"
            circle
            class="!bg-indigo-600 !border-indigo-600 hover:!bg-indigo-700 hover:scale-105 transition-all shadow-md"
            @click="handleSend"
            :disabled="!inputQuery.trim() || isChatLoading"
          )
            Icon(name="ph:paper-plane-right-fill" size="16")
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useAI } from '~/composables/useAI';

const { chatHistory, isChatLoading, askCRM } = useAI();
const isOpen = ref(false);
const inputQuery = ref('');
const chatContainer = ref<HTMLElement | null>(null);

function toggleCopilot() {
  isOpen.value = !isOpen.value;
}

function closeCopilot() {
  isOpen.value = false;
}

async function handleSend() {
  if (!inputQuery.value.trim() || isChatLoading.value) return;
  const query = inputQuery.value;
  inputQuery.value = '';
  await askCRM(query);
}

function formatMarkdown(text: string): string {
    if (!text) return '';
    // Bold
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    // Bullet points
    html = html.replace(/^- (.*?)(<br>|$)/gm, '<span class="bullet-item font-medium">$1</span><br>');
    return html;
}

// Auto-scroll to bottom when messages update
watch(() => chatHistory.value.length, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 20px;
}

[data-theme='dark'] .glass-panel {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.typing-dot {
  width: 6px;
  height: 6px;
  background-color: currentColor;
  border-radius: 50%;
  opacity: 0.6;
  animation: typing 1s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
</style>
