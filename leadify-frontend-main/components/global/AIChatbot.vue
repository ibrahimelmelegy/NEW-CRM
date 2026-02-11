<template lang="pug">
.ai-chatbot-container(:class="{ 'is-open': isOpen }")
  //- Floating Button
  button.floating-chat-btn(@click="isOpen = !isOpen" class="premium-btn glow-purple")
    Icon(:name="isOpen ? 'ph:x-bold' : 'ph:sparkle-bold'" size="28")

  //- Chat Window
  transition(name="slide-up")
    .chat-window.glass-card(v-show="isOpen")
      .chat-header.p-4.flex.items-center.gap-3
        .assistant-avatar.bg-indigo-500: Icon(name="ph:robot-bold" size="24" class="text-white")
        div
          h4.font-bold {{ $t('ai.assistant') }}
          p(class="text-[10px] flex items-center" style="color: var(--color-status-online)")
            span.w-1.h-1.rounded-full.mr-1(style="background: var(--color-status-online)")
            | {{ $t('ai.onlineReady') }}

      .chat-messages.p-4.flex.flex-col.gap-3(ref="msgContainer")
        .message(v-for="(msg, i) in messages" :key="i" :class="msg.role")
          .msg-bubble.p-3.rounded-2xl.text-sm {{ msg.content }}

      .chat-input.p-4(style="border-top: 1px solid var(--border-default)")
        el-input(
          v-model="input"
          :placeholder="$t('ai.askPlaceholder')"
          @keyup.enter="sendMessage"
          :disabled="loading"
          class="glass-input"
        )
          template(#suffix)
            Icon.cursor-pointer(name="ph:paper-plane-right-fill" @click="sendMessage" :class="{ 'text-primary': input }")
</template>

<script setup lang="ts">
const { t } = useI18n();
const isOpen = ref(false);
const input = ref('');
const loading = ref(false);
const messages = ref([
  { role: 'assistant', content: t('ai.welcomeMessage') }
]);

const sendMessage = async () => {
  if (!input.value || loading.value) return;

  const userMsg = input.value;
  messages.value.push({ role: 'user', content: userMsg });
  input.value = '';
  loading.value = true;

  try {
    const response: any = await useApiFetch('ai/generate-email', 'POST', {
      prompt: `Act as a CRM Assistant. Answer based on CRM context. Question: ${userMsg}`,
      context: { source: 'chatbot' }
    });

    if (response.success) {
      messages.value.push({ role: 'assistant', content: response.data });
    }
  } catch (e: any) {
    // Handle Lockout (429)
    if (e.response && e.response.status === 429) {
       const data = await e.response._data;
       const hours = data.remainingHours || 10;
       messages.value.push({ 
         role: 'assistant', 
         content: `🔒 ${t('ai.lockedMessage', { hours })}` 
       });
    } else {
       messages.value.push({ role: 'assistant', content: t('ai.connectionError') });
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.ai-chatbot-container {
  position: fixed;
  bottom: 30px;
  inset-inline-end: 30px;
  z-index: 9999;
}

.floating-chat-btn {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--elevation-shadow-16);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px var(--color-primary-alpha-40);
  }
}

.chat-window {
  position: absolute;
  bottom: 70px;
  inset-inline-end: 0;
  width: 380px;
  height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px var(--color-surface-overlay);
  border-radius: 20px !important;

  @media (max-width: 640px) {
    position: fixed;
    inset: 12px;
    width: auto;
    height: auto;
    bottom: 80px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;

  .message {
    max-width: 85%;
    &.user {
      align-self: flex-end;
      .msg-bubble { background: var(--accent-color); color: white; border-bottom-right-radius: 4px; }
    }
    &.assistant {
      align-self: flex-start;
      .msg-bubble { background: var(--bg-card-hover); color: var(--text-primary); border-bottom-left-radius: 4px; }
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
