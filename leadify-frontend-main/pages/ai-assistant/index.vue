<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="ai-assistant-page p-6 md:p-8">
    <!-- Page Header -->
    <div class="header mb-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">
            <Icon class="mr-2 align-middle" name="ph:brain-bold" size="32" style="color: var(--accent-color, #7849ff)" />
            {{ $t('aiAssistant.title') }}
          </h2>
          <p style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.pageSubtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="ai-tabs">
      <!-- Tab 1: AI Chat -->
      <el-tab-pane :label="$t('aiAssistantExpanded.chatTab')" name="chat">
        <div class="flex gap-6" style="height: calc(100vh - 280px)">
          <!-- Main Chat Area -->
          <div class="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
            <!-- Chat Header -->
            <div class="p-4 border-b border-slate-800/60 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Icon name="ph:brain-bold" class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold" style="color: var(--text-primary)">{{ $t('aiAssistant.howCanIHelp') }}</h3>
                  <p class="text-xs" style="color: var(--text-muted)">{{ $t('aiAssistant.subtitle') }}</p>
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
                <h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary)">{{ $t('aiAssistant.howCanIHelp') }}</h3>
                <p class="max-w-md mb-8" style="color: var(--text-muted)">
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
                    <p class="text-sm" style="color: var(--text-secondary)">{{ suggestion.text }}</p>
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
                    <div class="text-sm whitespace-pre-wrap" style="color: var(--text-secondary)" v-html="sanitizeHtml(formatMessage(msg.content))"></div>
                  </div>
                </template>

                <!-- User Message -->
                <template v-else>
                  <div class="bg-primary-500/20 border border-primary-500/30 p-4 rounded-xl rounded-tr-sm max-w-[70%]">
                    <p class="text-sm" style="color: var(--text-primary)">{{ msg.content }}</p>
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
              <p class="text-xs mt-2 text-center" style="color: var(--text-muted)">{{ $t('aiAssistant.disclaimer') }}</p>
            </div>
          </div>

          <!-- Right Sidebar: Insights -->
          <div class="w-80 space-y-4 hidden xl:block">
            <!-- Daily Insights -->
            <div class="glass-panel p-5 rounded-xl">
              <h3 class="text-sm font-medium mb-4 flex items-center gap-2" style="color: var(--text-secondary)">
                <Icon name="ph:lightbulb-bold" class="w-4 h-4 text-amber-400" />
                {{ $t('aiAssistant.dailyInsights') }}
              </h3>
              <div v-if="insightsLoading" class="space-y-3">
                <div v-for="i in 3" :key="i" class="h-16 bg-slate-700/30 rounded-lg animate-pulse"></div>
              </div>
              <div v-else class="space-y-3">
                <div v-for="(insight, idx) in dailyInsights" :key="idx" class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p class="text-sm" style="color: var(--text-secondary)">{{ insight.text || insight }}</p>
                </div>
                <div v-if="dailyInsights.length === 0" class="text-sm text-center py-4" style="color: var(--text-muted)">
                  {{ $t('aiAssistant.noInsights') }}
                </div>
              </div>
            </div>

            <!-- Quick Tools -->
            <div class="glass-panel p-5 rounded-xl">
              <h3 class="text-sm font-medium mb-4 flex items-center gap-2" style="color: var(--text-secondary)">
                <Icon name="ph:wrench-bold" class="w-4 h-4 text-teal-400" />
                {{ $t('aiAssistant.aiTools') }}
              </h3>
              <div class="space-y-2">
                <button
                  class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
                  @click="sendMessage(t('aiAssistant.emailGeneratorPrompt'))"
                >
                  <Icon name="ph:envelope-simple-bold" class="w-4 h-4 text-blue-400" />
                  <span class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistant.emailGenerator') }}</span>
                </button>
                <button
                  class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
                  @click="sendMessage(t('aiAssistant.pipelineAnalysisPrompt'))"
                >
                  <Icon name="ph:chart-line-bold" class="w-4 h-4 text-emerald-400" />
                  <span class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistant.pipelineAnalysis') }}</span>
                </button>
                <button
                  class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
                  @click="sendMessage(t('aiAssistant.churnPredictionPrompt'))"
                >
                  <Icon name="ph:warning-bold" class="w-4 h-4 text-amber-400" />
                  <span class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistant.churnPrediction') }}</span>
                </button>
                <button
                  class="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition text-left flex items-center gap-3"
                  @click="sendMessage(t('aiAssistant.salesCoachPrompt'))"
                >
                  <Icon name="ph:graduation-cap-bold" class="w-4 h-4 text-purple-400" />
                  <span class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistant.salesCoach') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Lead Scoring -->
      <el-tab-pane :label="$t('aiAssistantExpanded.leadScoringTab')" name="leadScoring">
        <div class="tool-section">
          <!-- Lead Scoring Header -->
          <div class="tool-header glass-panel rounded-xl p-6 mb-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="tool-icon-wrapper bg-green-500/10">
                <Icon name="ph:user-circle-check-bold" size="28" class="text-green-500" />
              </div>
              <div>
                <h3 class="text-xl font-bold" style="color: var(--text-primary)">{{ $t('aiAssistantExpanded.leadScoringTitle') }}</h3>
                <p class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.leadScoringDesc') }}</p>
              </div>
            </div>
            <div class="flex items-end gap-4 flex-wrap">
              <div class="flex-1" style="min-width: 200px">
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.leadIdLabel') }}</label>
                <el-input v-model="leadIdInput" :placeholder="$t('aiAssistantExpanded.leadIdPlaceholder')" size="large" />
              </div>
              <el-button type="primary" size="large" :loading="isLeadScoreLoading" @click="runLeadScoring">
                <Icon name="ph:sparkle-bold" size="16" class="mr-2" />
                {{ $t('aiAssistantExpanded.analyzeLeadQuality') }}
              </el-button>
            </div>
          </div>

          <!-- Lead Score Result -->
          <LeadScoreWidget v-if="leadIdScored" :lead-id="leadIdScored" />
        </div>
      </el-tab-pane>

      <!-- Tab 3: Deal Probability -->
      <el-tab-pane :label="$t('aiAssistantExpanded.dealProbabilityTab')" name="dealProbability">
        <div class="tool-section">
          <!-- Deal Probability Header -->
          <div class="tool-header glass-panel rounded-xl p-6 mb-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="tool-icon-wrapper bg-blue-500/10">
                <Icon name="ph:chart-line-up-bold" size="28" class="text-blue-500" />
              </div>
              <div>
                <h3 class="text-xl font-bold" style="color: var(--text-primary)">{{ $t('aiAssistantExpanded.dealProbabilityTitle') }}</h3>
                <p class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.dealProbabilityDesc') }}</p>
              </div>
            </div>
            <div class="flex items-end gap-4 flex-wrap">
              <div class="flex-1" style="min-width: 200px">
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.dealIdLabel') }}</label>
                <el-input v-model="dealIdInput" :placeholder="$t('aiAssistantExpanded.dealIdPlaceholder')" size="large" />
              </div>
              <el-button type="primary" size="large" :loading="isDealProbLoading" @click="runDealProbability">
                <Icon name="ph:sparkle-bold" size="16" class="mr-2" />
                {{ $t('aiAssistantExpanded.analyzeDeal') }}
              </el-button>
            </div>
          </div>

          <!-- Deal Probability Result -->
          <DealProbabilityWidget v-if="dealIdScored" :deal-id="dealIdScored" />
        </div>
      </el-tab-pane>

      <!-- Tab 4: Email Generator -->
      <el-tab-pane :label="$t('aiAssistantExpanded.emailGeneratorTab')" name="emailGenerator">
        <div class="tool-section">
          <!-- Email Generator Header -->
          <div class="tool-header glass-panel rounded-xl p-6 mb-6">
            <div class="flex items-center gap-4 mb-6">
              <div class="tool-icon-wrapper bg-purple-500/10">
                <Icon name="ph:envelope-simple-bold" size="28" class="text-purple-500" />
              </div>
              <div>
                <h3 class="text-xl font-bold" style="color: var(--text-primary)">{{ $t('aiAssistantExpanded.emailGeneratorTitle') }}</h3>
                <p class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.emailGeneratorDesc') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.emailPurpose') }}</label>
                <el-select v-model="emailForm.purpose" size="large" class="w-full">
                  <el-option value="follow-up" :label="$t('aiAssistantExpanded.purposeFollowUp')" />
                  <el-option value="introduction" :label="$t('aiAssistantExpanded.purposeIntroduction')" />
                  <el-option value="proposal" :label="$t('aiAssistantExpanded.purposeProposal')" />
                  <el-option value="thank-you" :label="$t('aiAssistantExpanded.purposeThankYou')" />
                  <el-option value="meeting-request" :label="$t('aiAssistantExpanded.purposeMeetingRequest')" />
                  <el-option value="cold-outreach" :label="$t('aiAssistantExpanded.purposeColdOutreach')" />
                  <el-option value="check-in" :label="$t('aiAssistantExpanded.purposeCheckIn')" />
                </el-select>
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.emailTone') }}</label>
                <el-select v-model="emailForm.tone" size="large" class="w-full">
                  <el-option value="professional" :label="$t('aiAssistantExpanded.toneProfessional')" />
                  <el-option value="friendly" :label="$t('aiAssistantExpanded.toneFriendly')" />
                  <el-option value="formal" :label="$t('aiAssistantExpanded.toneFormal')" />
                  <el-option value="casual" :label="$t('aiAssistantExpanded.toneCasual')" />
                </el-select>
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.recipientName') }}</label>
                <el-input v-model="emailForm.recipientName" :placeholder="$t('aiAssistantExpanded.recipientNamePlaceholder')" size="large" />
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">
                  {{ $t('aiAssistantExpanded.recipientCompany') }}
                </label>
                <el-input v-model="emailForm.recipientCompany" :placeholder="$t('aiAssistantExpanded.recipientCompanyPlaceholder')" size="large" />
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.dealName') }}</label>
                <el-input v-model="emailForm.dealName" :placeholder="$t('aiAssistantExpanded.dealNamePlaceholder')" size="large" />
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.dealStage') }}</label>
                <el-input v-model="emailForm.dealStage" :placeholder="$t('aiAssistantExpanded.dealStagePlaceholder')" size="large" />
              </div>
            </div>
            <div class="mb-4">
              <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.additionalContext') }}</label>
              <el-input
                v-model="emailForm.additionalContext"
                type="textarea"
                :rows="2"
                :placeholder="$t('aiAssistantExpanded.additionalContextPlaceholder')"
                size="large"
              />
            </div>
            <el-button type="primary" size="large" :loading="isEmailDraftLoading" @click="runEmailGeneration">
              <Icon name="ph:sparkle-bold" size="16" class="mr-2" />
              {{ $t('aiAssistantExpanded.generateEmail') }}
            </el-button>
          </div>

          <!-- Email Result -->
          <div v-if="emailDraft" class="glass-panel rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-bold" style="color: var(--text-primary)">{{ $t('aiAssistantExpanded.generatedEmail') }}</h4>
              <div class="flex gap-2">
                <el-button size="small" @click="copyEmailToClipboard">
                  <Icon name="ph:copy-bold" size="14" class="mr-1" />
                  {{ $t('aiAssistantExpanded.copyEmail') }}
                </el-button>
              </div>
            </div>
            <div class="email-preview">
              <div class="email-field mb-3">
                <span class="email-label">{{ $t('aiAssistantExpanded.subjectLabel') }}:</span>
                <span class="email-value">{{ emailDraft.subject }}</span>
              </div>
              <div class="email-field mb-2">
                <span class="email-label">{{ $t('aiAssistantExpanded.toneLabel') }}:</span>
                <el-tag size="small" effect="plain" round>{{ emailDraft.tone }}</el-tag>
                <span class="email-label ml-4">{{ $t('aiAssistantExpanded.purposeLabel') }}:</span>
                <el-tag size="small" effect="plain" round type="info">{{ emailDraft.purpose }}</el-tag>
              </div>
              <div
                class="email-body-preview mt-4 p-4 rounded-lg"
                style="background: rgba(0, 0, 0, 0.05); white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: var(--text-secondary)"
              >
                {{ emailDraft.body }}
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 5: Smart Suggestions -->
      <el-tab-pane :label="$t('aiAssistantExpanded.suggestionsTab')" name="suggestions">
        <div class="tool-section">
          <!-- Smart Suggestions Header -->
          <div class="tool-header glass-panel rounded-xl p-6 mb-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="tool-icon-wrapper bg-amber-500/10">
                <Icon name="ph:magic-wand-bold" size="28" class="text-amber-500" />
              </div>
              <div>
                <h3 class="text-xl font-bold" style="color: var(--text-primary)">{{ $t('aiAssistantExpanded.smartSuggestionsTitle') }}</h3>
                <p class="text-sm" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.smartSuggestionsDesc') }}</p>
              </div>
            </div>
            <div class="flex items-end gap-4 flex-wrap">
              <div style="min-width: 150px">
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.entityType') }}</label>
                <el-select v-model="suggestionsForm.entityType" size="large" class="w-full">
                  <el-option value="lead" :label="$t('aiAssistantExpanded.entityLead')" />
                  <el-option value="deal" :label="$t('aiAssistantExpanded.entityDeal')" />
                  <el-option value="client" :label="$t('aiAssistantExpanded.entityClient')" />
                </el-select>
              </div>
              <div class="flex-1" style="min-width: 200px">
                <label class="text-xs font-medium mb-1 block" style="color: var(--text-muted)">{{ $t('aiAssistantExpanded.entityIdLabel') }}</label>
                <el-input v-model="suggestionsForm.entityId" :placeholder="$t('aiAssistantExpanded.entityIdPlaceholder')" size="large" />
              </div>
              <el-button type="primary" size="large" :loading="isSuggestionsLoading" @click="runSmartSuggestions">
                <Icon name="ph:sparkle-bold" size="16" class="mr-2" />
                {{ $t('aiAssistantExpanded.getSuggestions') }}
              </el-button>
            </div>
          </div>

          <!-- Smart Suggestions Result -->
          <SmartSuggestionsWidget
            v-if="suggestionsEntityScored"
            :entity-type="suggestionsEntityScored.type"
            :entity-id="suggestionsEntityScored.id"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import DOMPurify from 'dompurify';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import { useAiAssistant } from '~/composables/useAiAssistant';

const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: []
  });
};

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const activeTab = ref('chat');

// ─── Chat State ───────────────────────────────────────────────────────────────
const messages = ref<Array<{ role: string; content: string }>>([]);
const inputMessage = ref('');
const isTyping = ref(false);
const messagesContainer = ref<HTMLElement>();
const dailyInsights = ref<Record<string, unknown>[]>([]);
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

  const res = await useApiFetch('ai/chat', 'POST', { message });

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
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

const formatMessage = (content: string) => {
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
  const res = await useApiFetch('ai/insights/daily');
  if (res?.success && res.body) {
    dailyInsights.value = Array.isArray(res.body) ? res.body : res.body.insights || [];
  }
  insightsLoading.value = false;
};

// ─── Lead Scoring State ───────────────────────────────────────────────────────
const { isLeadScoreLoading } = useAiAssistant();
const leadIdInput = ref('');
const leadIdScored = ref('');

function runLeadScoring() {
  if (!leadIdInput.value.trim()) {
    ElMessage.warning(t('aiAssistantExpanded.enterLeadId'));
    return;
  }
  leadIdScored.value = leadIdInput.value.trim();
}

// ─── Deal Probability State ──────────────────────────────────────────────────
const { isDealProbabilityLoading: isDealProbLoading } = useAiAssistant();
const dealIdInput = ref('');
const dealIdScored = ref('');

function runDealProbability() {
  if (!dealIdInput.value.trim()) {
    ElMessage.warning(t('aiAssistantExpanded.enterDealId'));
    return;
  }
  dealIdScored.value = dealIdInput.value.trim();
}

// ─── Email Generator State ───────────────────────────────────────────────────
const { emailDraft, isEmailDraftLoading, generateEmailDraft } = useAiAssistant();
const emailForm = ref({
  purpose: 'follow-up',
  tone: 'professional',
  recipientName: '',
  recipientCompany: '',
  dealName: '',
  dealStage: '',
  additionalContext: ''
});

async function runEmailGeneration() {
  await generateEmailDraft({
    purpose: emailForm.value.purpose,
    tone: emailForm.value.tone,
    recipientName: emailForm.value.recipientName || undefined,
    recipientCompany: emailForm.value.recipientCompany || undefined,
    dealName: emailForm.value.dealName || undefined,
    dealStage: emailForm.value.dealStage || undefined,
    additionalContext: emailForm.value.additionalContext || undefined
  });
}

function copyEmailToClipboard() {
  if (!emailDraft.value) return;
  const text = `Subject: ${emailDraft.value.subject}\n\n${emailDraft.value.body}`;
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('aiAssistantExpanded.emailCopied'));
  });
}

// ─── Smart Suggestions State ─────────────────────────────────────────────────
const { isSuggestionsLoading } = useAiAssistant();
const suggestionsForm = ref({
  entityType: 'lead' as 'lead' | 'deal' | 'client',
  entityId: ''
});
const suggestionsEntityScored = ref<{ type: 'lead' | 'deal' | 'client'; id: string } | null>(null);

function runSmartSuggestions() {
  if (!suggestionsForm.value.entityId.trim()) {
    ElMessage.warning(t('aiAssistantExpanded.enterEntityId'));
    return;
  }
  suggestionsEntityScored.value = {
    type: suggestionsForm.value.entityType,
    id: suggestionsForm.value.entityId.trim()
  };
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  fetchDailyInsights();
});
</script>

<style lang="scss" scoped>
.ai-assistant-page {
  min-height: calc(100vh - 80px);
}

.ai-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 600;
  }
}

.tool-section {
  max-width: 900px;
}

.tool-header {
  background: var(--glass-bg, var(--bg-elevated));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border-color, var(--border-default));
}

.tool-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.email-preview {
  .email-field {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .email-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .email-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
}
</style>
