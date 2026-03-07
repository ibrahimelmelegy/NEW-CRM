import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from './useApiFetch';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface LeadScoreResult {
  leadId: string;
  leadName: string;
  qualityScore: number;
  tier: 'hot' | 'warm' | 'cold';
  reasoning: string[];
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    score: number;
    detail: string;
  }>;
  recommendations: string[];
  scoredAt: string;
}

export interface EmailDraftResult {
  subject: string;
  body: string;
  tone: string;
  purpose: string;
  generatedAt: string;
}

export interface DealWinProbabilityResult {
  dealId: string;
  dealName: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  positiveSignals: string[];
  riskFactors: string[];
  nextSteps: string[];
  comparisons: {
    avgProbabilityForStage: number;
    pipelineRank: string;
  };
  calculatedAt: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'action' | 'insight' | 'warning' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  confidence: number;
}

export interface SmartSuggestionsResult {
  entityType: string;
  entityId: string;
  entityName: string;
  suggestions: SmartSuggestion[];
  generatedAt: string;
}

// ─── Composable ─────────────────────────────────────────────────────────────

export function useAiAssistant() {
  // ===== Lead Scoring =====
  const leadScore = ref<LeadScoreResult | null>(null);
  const isLeadScoreLoading = ref(false);

  async function scoreLeadQuality(leadId: string): Promise<LeadScoreResult | null> {
    isLeadScoreLoading.value = true;
    try {
      const response = await useApiFetch(`ai/assistant/score-lead/${leadId}`, 'POST');

      if (response.success && response.body) {
        leadScore.value = response.body as LeadScoreResult;
        return leadScore.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Scoring Error',
          message: response.message || 'Failed to score lead'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to calculate lead quality score'
      });
      return null;
    } finally {
      isLeadScoreLoading.value = false;
    }
  }

  // ===== Email Draft Generation =====
  const emailDraft = ref<EmailDraftResult | null>(null);
  const isEmailDraftLoading = ref(false);

  async function generateEmailDraft(context: {
    recipientName?: string;
    recipientCompany?: string;
    senderName?: string;
    dealName?: string;
    dealStage?: string;
    dealValue?: number;
    purpose: string;
    tone?: string;
    additionalContext?: string;
  }): Promise<EmailDraftResult | null> {
    isEmailDraftLoading.value = true;
    try {
      const response = await useApiFetch('ai/assistant/generate-email', 'POST', context as Record<string, unknown>);

      if (response.success && response.body) {
        emailDraft.value = response.body as EmailDraftResult;
        return emailDraft.value;
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
        message: 'Failed to generate email draft'
      });
      return null;
    } finally {
      isEmailDraftLoading.value = false;
    }
  }

  // ===== Deal Win Probability =====
  const dealProbability = ref<DealWinProbabilityResult | null>(null);
  const isDealProbabilityLoading = ref(false);

  async function calculateDealProbability(dealId: string): Promise<DealWinProbabilityResult | null> {
    isDealProbabilityLoading.value = true;
    try {
      const response = await useApiFetch(`ai/assistant/deal-probability/${dealId}`, 'POST');

      if (response.success && response.body) {
        dealProbability.value = response.body as DealWinProbabilityResult;
        return dealProbability.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Analysis Error',
          message: response.message || 'Failed to analyze deal probability'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to calculate deal win probability'
      });
      return null;
    } finally {
      isDealProbabilityLoading.value = false;
    }
  }

  // ===== Smart Suggestions =====
  const smartSuggestions = ref<SmartSuggestionsResult | null>(null);
  const isSuggestionsLoading = ref(false);

  async function getSmartSuggestions(entityType: 'lead' | 'deal' | 'client', entityId: string): Promise<SmartSuggestionsResult | null> {
    isSuggestionsLoading.value = true;
    try {
      const response = await useApiFetch(`ai/assistant/suggestions/${entityType}/${entityId}`);

      if (response.success && response.body) {
        smartSuggestions.value = response.body as SmartSuggestionsResult;
        return smartSuggestions.value;
      } else {
        ElNotification({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to get suggestions'
        });
        return null;
      }
    } catch (error) {
      ElNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load smart suggestions'
      });
      return null;
    } finally {
      isSuggestionsLoading.value = false;
    }
  }

  return {
    // Lead Scoring
    leadScore,
    isLeadScoreLoading,
    scoreLeadQuality,

    // Email Draft
    emailDraft,
    isEmailDraftLoading,
    generateEmailDraft,

    // Deal Win Probability
    dealProbability,
    isDealProbabilityLoading,
    calculateDealProbability,

    // Smart Suggestions
    smartSuggestions,
    isSuggestionsLoading,
    getSmartSuggestions
  };
}
