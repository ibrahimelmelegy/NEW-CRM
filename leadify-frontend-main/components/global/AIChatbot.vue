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
          h4.font-bold AI Assistant
          p(class="text-[10px] text-emerald-500 flex items-center")
            span.w-1.h-1.bg-emerald-500.rounded-full.mr-1
            | Online & Ready
            
      .chat-messages.p-4.flex.flex-col.gap-3(ref="msgContainer")
        .message(v-for="(msg, i) in messages" :key="i" :class="msg.role")
          .msg-bubble.p-3.rounded-2xl.text-sm {{ msg.content }}
          
      .chat-input.p-4.border-t.border-white.border-opacity-10
        el-input(
          v-model="input" 
          placeholder="Ask me anything..." 
          @keyup.enter="sendMessage"
          :disabled="loading"
          class="glass-input"
        )
          template(#suffix)
            Icon.cursor-pointer(name="ph:paper-plane-right-fill" @click="sendMessage" :class="{ 'text-primary': input }")
</template>

<script setup lang="ts">
const isOpen = ref(false);
const input = ref('');
const loading = ref(false);
const messages = ref([
  { role: 'assistant', content: 'Hello! I am your CRM assistant. How can I help you today?' }
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
  } catch (e) {
    messages.value.push({ role: 'assistant', content: 'Sorry, I am having trouble connecting to my brain.' });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.ai-chatbot-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
}

.floating-chat-btn {
  width: 65px;
  height: 65px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(120, 73, 255, 0.4);
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  
  .message {
    max-width: 85%;
    &.user { 
      align-self: flex-end; 
      .msg-bubble { background: var(--primary-color); color: white; border-bottom-right-radius: 4px; }
    }
    &.assistant { 
      align-self: flex-start; 
      .msg-bubble { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); border-bottom-left-radius: 4px; }
    }
  }
}

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>
