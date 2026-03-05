import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from './useApiFetch';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: unknown;
}

export interface DealScoreResult {
  dealId: string;
  dealName: string;
  winProbability: number;
  score: 'A' | 'B' | 'C' | 'D';
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    description: string;
    weight: number;
  }>;
  suggestions: string[];
  scoredAt: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  icon: string;
  title: string;
  description: string;
  action?: { label: string; route: string };
  metric?: string;
  dismissed?: boolean;
}

export interface DailyInsightsResponse {
  insights: AIInsight[];
  generatedAt: string;
}

export function useAI() {
  const chatHistory = ref<AIChatMessage[]>([]);
  const isLoading = ref(false);
  const isChatLoading = ref(false);
  const dealScore = ref<DealScoreResult | null>(null);
  const isDealScoreLoading = ref(false);
  const generatedEmail = ref<GeneratedEmail | null>(null);
  const isEmailLoading = ref(false);
  const insights = ref<AIInsight[]>([]);
  const isInsightsLoading = ref(false);

  // ===== Chat Methods =====

  async function askCRM(question: string): Promise<string> {
    if (!question.trim()) return '';

    isChatLoading.value = true;

    // Add user message immediately
    chatHistory.value.push({
      role: 'user',
      content: question,
      timestamp: new Date()
    });

    try {
      const response = await useApiFetch('ai/chat', 'POST', { question });

      if (response.success && response.body) {
        const answer = (response.body as unknown).answer || 'I could not process your question.';
        chatHistory.value.push({
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
          data: (response.body as unknown).data
        });
        return answer;
      } else {
        const errorMsg = response.message || 'Failed to get a response.';
        chatHistory.value.push({
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date()
        });
        return errorMsg;
      }
    } catch (error) {
      const errorMsg = 'Sorry, I encountered an error. Please try again.';
      chatHistory.value.push({
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      });
      return errorMsg;
    } finally {
      isChatLoading.value = false;
    }
  }

  async function clearChat(): Promise<void> {
    try {
      await useApiFetch('ai/chat/clear', 'POST');
    } catch {
      // Silent fail for clearing server history
    }
    chatHistory.value = [];
  }

  // ===== Deal Scoring Methods =====

  async function scoreDeal(dealId: string): Promise<DealScoreResult | null> {
    isDealScoreLoading.value = true;
    try {
      const response = await useApiFetch(`ai/score-deal/${dealId}`, 'POST');

      if (response.success && response.body) {
        dealScore.value = response.body as DealScoreResult;
        return dealScore.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Scoring Error',
          message: response.message || 'Failed to score deal'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to calculate deal score'
      });
      return null;
    } finally {
      isDealScoreLoading.value = false;
    }
  }

  // ===== Email Methods =====

  async function generateEmailDraft(context: {
    to?: string;
    toCompany?: string;
    purpose?: string;
    tone?: string;
    dealInfo?: unknown;
    clientInfo?: unknown;
    customInstructions?: string;
    senderName?: string;
    senderCompany?: string;
  }): Promise<GeneratedEmail | null> {
    isEmailLoading.value = true;
    try {
      const response = await useApiFetch('ai/email/generate', 'POST', context);

      if (response.success && response.body) {
        generatedEmail.value = response.body as GeneratedEmail;
        return generatedEmail.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Generation Error',
          message: response.message || 'Failed to generate email'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate email'
      });
      return null;
    } finally {
      isEmailLoading.value = false;
    }
  }

  async function suggestReply(thread: string, context?: unknown): Promise<GeneratedEmail | null> {
    isEmailLoading.value = true;
    try {
      const response = await useApiFetch('ai/email/suggest-reply', 'POST', { thread, context });

      if (response.success && response.body) {
        generatedEmail.value = response.body as GeneratedEmail;
        return generatedEmail.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to suggest reply'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to suggest reply'
      });
      return null;
    } finally {
      isEmailLoading.value = false;
    }
  }

  async function improveEmail(draft: string, instruction: string): Promise<GeneratedEmail | null> {
    isEmailLoading.value = true;
    try {
      const response = await useApiFetch('ai/email/improve', 'POST', { draft, instruction });

      if (response.success && response.body) {
        generatedEmail.value = response.body as GeneratedEmail;
        return generatedEmail.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to improve email'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to improve email'
      });
      return null;
    } finally {
      isEmailLoading.value = false;
    }
  }

  // ===== Insights Methods =====

  async function getDailyInsights(): Promise<AIInsight[]> {
    isInsightsLoading.value = true;
    try {
      const response = await useApiFetch('ai/insights/daily');

      if (response.success && response.body) {
        const data = response.body as DailyInsightsResponse;
        insights.value = (data.insights || []).map(i => ({ ...i, dismissed: false }));
        return insights.value;
      }
      return [];
    } catch (error) {
      console.error('Error fetching insights:', error);
      return [];
    } finally {
      isInsightsLoading.value = false;
    }
  }

  function dismissInsight(insightId: string): void {
    const idx = insights.value.findIndex(i => i.id === insightId);
    if (idx !== -1) {
      insights.value.splice(idx, 1);
    }
  }

  return {
    // Chat
    chatHistory,
    isChatLoading,
    askCRM,
    clearChat,

    // Deal scoring
    dealScore,
    isDealScoreLoading,
    scoreDeal,

    // Email
    generatedEmail,
    isEmailLoading,
    generateEmailDraft,
    suggestReply,
    improveEmail,

    // Insights
    insights,
    isInsightsLoading,
    getDailyInsights,
    dismissInsight,

    // General
    isLoading
  };
}
