<template>
  <div class="flex h-[calc(100vh-80px)] gap-6">
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
      <!-- Chat Header -->
      <div class="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Icon name="ph:brain-bold" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-slate-200">{{ $t('aiAssistant.title') }}</h2>
            <p class="text-xs text-slate-500">{{ $t('aiAssistant.subtitle') }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <el-button size="small" text @click="clearChat">
            <Icon name="ph:trash-bold" class="w-4 h-4 mr-1" />
            {{ $t('aiAssistant.clearChat') }}
          </el-button>
        </div>
      </div>

      <!-- Messages Area -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- Welcome Message -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-6">
            <Icon name="ph:sparkle-bold" class="w-10 h-10 text-indigo-400" />
          </div>
          <h3 class="text-xl font-semibold text-slate-200 mb-2">{{ $t('aiAssistant.howCanIHelp') }}</h3>
          <p class="text-slate-500 max-w-md mb-8">
            {{ $t('aiAssistant.welcomeDescription') }}
          </p>

          <!-- Quick Actions -->
          <div class="grid grid-cols-2 gap-3 max-w-lg w-full">
            <button
              v-for="suggestion in quickSuggestions"
              :key="suggestion.text"
              class="glass-panel p-4 rounded-xl text-left hover:border-primary-500/30 transition-all group"
              @click="sendMessage(suggestion.text)"
            >
              <Icon :name="suggestion.icon" class="w-5 h-5 text-indigo-400 mb-2" />
              <p class="text-sm text-slate-300 group-hover:text-slate-100">{{ suggestion.text }}</p>
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div v-for="(msg, idx) in messages" :key="idx" class="flex gap-3" :class="msg.role === 'user' ? 'justify-end' : ''">
          <!-- AI Message -->
          <template v-if="msg.role === 'assistant'">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Icon name="ph:brain-bold" class="w-4 h-4 text-white" />
            </div>
            <div class="glass-panel p-4 rounded-xl rounded-tl-sm max-w-[70%]">
              <div class="text-sm text-slate-300 whitespace-pre-wrap" v-html="formatMessage(msg.content)"></div>
            </div>
          </template>

          <!-- User Message -->
          <template v-else>
            <div class="bg-primary-500/20 border border-primary-500/30 p-4 rounded-xl rounded-tr-sm max-w-[70%]">
              <p class="text-sm text-slate-200">{{ msg.content }}</p>
            </div>
            <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
              <Icon name="ph:user-bold" class="w-4 h-4 text-slate-400" />
            </div>
          </template>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <Icon name="ph:brain-bold" class="w-4 h-4 text-white" />
          </div>
          <div class="glass-panel p-4 rounded-xl rounded-tl-sm">
            <div class="flex gap-1">
              <div class="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-slate-800/60">
        <div class="flex gap-3">
          <el-input
            v-model="inputMessage"
            :placeholder="$t('aiAssistant.placeholder')"
            class="flex-1"
            size="large"
            :disabled="isTyping"
            @keyup.enter="sendMessage()"
          />
          <el-button
            type="primary"
            size="large"
            class="!rounded-xl !px-6"
            :loading="isTyping"
            :disabled="!inputMessage.trim()"
            @click="sendMessage()"
          >
            <Icon name="ph:paper-plane-tilt-bold" class="w-5 h-5" />
          </el-button>
        </div>
        <p class="text-xs text-slate-600 mt-2 text-center">{{ $t('aiAssistant.disclaimer') }}</p>
      </div>
    </div>

    <!-- Right Sidebar: Insights -->
    <div class="w-80 space-y-4 hidden xl:block">
      <!-- Daily Insights -->
      <div class="glass-panel p-5 rounded-xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Icon name="ph:lightbulb-bold" class="w-4 h-4 text-amber-400" />
          {{ $t('aiAssistant.dailyInsights') }}
        </h3>
        <div v-if="insightsLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 bg-slate-700/30 rounded-lg animate-pulse"></div>
        </div>
        <div v-else class="space-y-3">
          <div v-for="(insight, idx) in dailyInsights" :key="idx" class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p class="text-sm text-slate-300">{{ insight.text || insight }}</p>
          </div>
          <div v-if="dailyInsights.length === 0" class="text-sm text-slate-500 text-center py-4">{{ $t('aiAssistant.noInsights') }}</div>
        </div>
      </div>

      <!-- Quick Tools -->
      <div class="glass-panel p-5 rounded-xl">
        <h3 class="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Icon name="ph:wrench-bold" class="w-4 h-4 text-teal-400" />
          {{ $t('aiAssistant.aiTools') }}
        </h3>
        <div class="space-y-2">
          <button
            class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
            @click="sendMessage('Generate a follow-up email for my latest deals')"
          >
            <Icon name="ph:envelope-simple-bold" class="w-4 h-4 text-blue-400" />
            <span class="text-sm text-slate-400">{{ $t('aiAssistant.emailGenerator') }}</span>
          </button>
          <button
            class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
            @click="sendMessage('Analyze my sales pipeline health')"
          >
            <Icon name="ph:chart-line-bold" class="w-4 h-4 text-emerald-400" />
            <span class="text-sm text-slate-400">{{ $t('aiAssistant.pipelineAnalysis') }}</span>
          </button>
          <button
            class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
            @click="sendMessage('Show me leads at risk of churning')"
          >
            <Icon name="ph:warning-bold" class="w-4 h-4 text-amber-400" />
            <span class="text-sm text-slate-400">{{ $t('aiAssistant.churnPrediction') }}</span>
          </button>
          <button
            class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
            @click="sendMessage('Give me coaching tips for my current deals')"
          >
            <Icon name="ph:graduation-cap-bold" class="w-4 h-4 text-purple-400" />
            <span class="text-sm text-slate-400">{{ $t('aiAssistant.salesCoach') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const messages = ref<Array<{ role: string; content: string }>>([]);
const inputMessage = ref('');
const isTyping = ref(false);
const messagesContainer = ref<HTMLElement>();
const dailyInsights = ref<any[]>([]);
const insightsLoading = ref(true);

const quickSuggestions = computed(() => [
  { text: t('aiAssistant.suggestion1'), icon: 'ph:funnel-bold' },
  { text: t('aiAssistant.suggestion2'), icon: 'ph:warning-circle-bold' },
  { text: t('aiAssistant.suggestion3'), icon: 'ph:envelope-simple-bold' },
  { text: t('aiAssistant.suggestion4'), icon: 'ph:chart-bar-bold' }
]);

const sendMessage = async (text?: string) => {
  const message = text || inputMessage.value.trim();
  if (!message) return;

  messages.value.push({ role: 'user', content: message });
  inputMessage.value = '';
  isTyping.value = true;
  await scrollToBottom();

  const res: any = await useApiFetch('ai/chat', 'POST', { message });

  isTyping.value = false;

  if (res?.success && res.body) {
    const reply = res.body.reply || res.body.response || res.body.message || JSON.stringify(res.body);
    messages.value.push({ role: 'assistant', content: reply });
  } else {
    messages.value.push({
      role: 'assistant',
      content: res?.message || t('aiAssistant.errorMessage')
    });
  }
  await scrollToBottom();
};

const clearChat = async () => {
  messages.value = [];
  await useApiFetch('ai/chat/clear', 'POST');
  ElMessage.success(t('aiAssistant.chatCleared'));
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatMessage = (content: string) => {
  // Escape HTML entities first to prevent XSS, then apply safe markdown-like formatting
  const safe = escapeHtml(content);
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-slate-700 rounded text-indigo-300 text-xs">$1</code>')
    .replace(/\n/g, '<br/>');
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const fetchDailyInsights = async () => {
  insightsLoading.value = true;
  const res: any = await useApiFetch('ai/insights/daily');
  if (res?.success && res.body) {
    dailyInsights.value = Array.isArray(res.body) ? res.body : res.body.insights || [];
  }
  insightsLoading.value = false;
};

onMounted(() => {
  fetchDailyInsights();
});
</script>
