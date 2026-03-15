/**
 * useAI - Unit Tests
 * ====================
 * Tests for composables/useAI.ts
 *
 * The composable provides:
 * - askCRM(question): Chat with AI
 * - clearChat(): Clear chat history
 * - scoreDeal(dealId): Score a deal using AI
 * - generateEmailDraft(context): Generate an email draft
 * - suggestReply(thread, context): Suggest an email reply
 * - improveEmail(draft, instruction): Improve an email draft
 * - getDailyInsights(): Get daily AI insights
 * - dismissInsight(insightId): Dismiss an insight
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAI } from '~/composables/useAI';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

// Mock ElNotification
const mockNotification = vi.fn();
(globalThis as Record<string, unknown>).ElNotification = mockNotification;

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockNotification(...args)
}));

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

describe('useAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // askCRM - AI Chat
  // ============================================
  describe('askCRM', () => {
    it('should add user message to chatHistory immediately', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { answer: 'Here is the answer' } });

      const { askCRM, chatHistory } = useAI();
      await askCRM('How many leads do we have?');

      const userMsg = chatHistory.value.find(m => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg?.content).toBe('How many leads do we have?');
    });

    it('should add assistant reply to chatHistory on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { answer: 'You have 150 leads.' } });

      const { askCRM, chatHistory } = useAI();
      const result = await askCRM('How many leads?');

      expect(result).toBe('You have 150 leads.');
      const assistantMsg = chatHistory.value.find(m => m.role === 'assistant');
      expect(assistantMsg?.content).toBe('You have 150 leads.');
    });

    it('should use fallback message when answer is missing from response', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: {} });

      const { askCRM } = useAI();
      const result = await askCRM('What is the revenue?');

      expect(result).toBe('I could not process your question.');
    });

    it('should add error message to chatHistory when API fails', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'AI service unavailable' });

      const { askCRM, chatHistory } = useAI();
      const result = await askCRM('Some question');

      expect(result).toBe('AI service unavailable');
      const assistantMsg = chatHistory.value.find(m => m.role === 'assistant');
      expect(assistantMsg?.content).toBe('AI service unavailable');
    });

    it('should return empty string for blank question', async () => {
      const { askCRM } = useAI();
      const result = await askCRM('   ');

      expect(result).toBe('');
      expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it('should handle thrown errors gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { askCRM, chatHistory } = useAI();
      const result = await askCRM('Question?');

      expect(result).toBe('Sorry, I encountered an error. Please try again.');
      const lastMsg = chatHistory.value[chatHistory.value.length - 1];
      expect(lastMsg?.role).toBe('assistant');
    });

    it('should manage isChatLoading state correctly', async () => {
      let resolvePromise: (value: unknown) => void;
      mockApiFetch.mockReturnValueOnce(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      const { askCRM, isChatLoading } = useAI();

      expect(isChatLoading.value).toBe(false);
      const promise = askCRM('Question?');
      expect(isChatLoading.value).toBe(true);

      resolvePromise!({ success: true, body: { answer: 'ok' } });
      await promise;
      expect(isChatLoading.value).toBe(false);
    });

    it('should call the correct API endpoint with POST method', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { answer: 'Answer' } });

      const { askCRM } = useAI();
      await askCRM('Test question');

      expect(mockApiFetch).toHaveBeenCalledWith('ai/chat', 'POST', { question: 'Test question' });
    });
  });

  // ============================================
  // clearChat
  // ============================================
  describe('clearChat', () => {
    it('should clear chatHistory', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { answer: 'Hello' } });

      const { askCRM, clearChat, chatHistory } = useAI();
      await askCRM('Hello?');
      expect(chatHistory.value.length).toBeGreaterThan(0);

      mockApiFetch.mockResolvedValue({ success: true });
      await clearChat();

      expect(chatHistory.value).toHaveLength(0);
    });

    it('should call the clear API endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { clearChat } = useAI();
      await clearChat();

      expect(mockApiFetch).toHaveBeenCalledWith('ai/chat/clear', 'POST');
    });

    it('should still clear local history even when API call fails', async () => {
      mockApiFetch.mockRejectedValue(new Error('Server error'));

      const { clearChat, chatHistory } = useAI();
      chatHistory.value.push({ role: 'user', content: 'Old message', timestamp: new Date() });

      await clearChat();

      expect(chatHistory.value).toHaveLength(0);
    });
  });

  // ============================================
  // scoreDeal
  // ============================================
  describe('scoreDeal', () => {
    it('should call the correct API endpoint', async () => {
      const mockScore = { dealId: 'deal-1', score: 'A', winProbability: 0.85, factors: [], suggestions: [], dealName: 'Test Deal', scoredAt: '2024-01-01' };
      mockApiFetch.mockResolvedValue({ success: true, body: mockScore });

      const { scoreDeal } = useAI();
      await scoreDeal('deal-1');

      expect(mockApiFetch).toHaveBeenCalledWith('ai/score-deal/deal-1', 'POST');
    });

    it('should return score result on success', async () => {
      const mockScore = { dealId: 'deal-1', score: 'A', winProbability: 0.85, factors: [], suggestions: [], dealName: 'Test Deal', scoredAt: '2024-01-01' };
      mockApiFetch.mockResolvedValue({ success: true, body: mockScore });

      const { scoreDeal, dealScore } = useAI();
      const result = await scoreDeal('deal-1');

      expect(result).toEqual(mockScore);
      expect(dealScore.value).toEqual(mockScore);
    });

    it('should return null and show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Deal not found' });

      const { scoreDeal } = useAI();
      const result = await scoreDeal('invalid-deal');

      expect(result).toBeNull();
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should manage isDealScoreLoading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { scoreDeal, isDealScoreLoading } = useAI();

      expect(isDealScoreLoading.value).toBe(false);
      const promise = scoreDeal('deal-1');
      expect(isDealScoreLoading.value).toBe(true);

      resolvePromise!({ success: true, body: { dealId: 'deal-1', score: 'B', winProbability: 0.6, factors: [], suggestions: [], dealName: 'Test', scoredAt: '2024-01-01' } });
      await promise;
      expect(isDealScoreLoading.value).toBe(false);
    });

    it('should return null and show error on thrown exception', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { scoreDeal } = useAI();
      const result = await scoreDeal('deal-1');

      expect(result).toBeNull();
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // generateEmailDraft
  // ============================================
  describe('generateEmailDraft', () => {
    it('should call the correct API endpoint', async () => {
      const context = { to: 'client@example.com', purpose: 'Follow-up', tone: 'professional' };
      const mockEmail = { subject: 'Follow-up', body: 'Dear Client...' };
      mockApiFetch.mockResolvedValue({ success: true, body: mockEmail });

      const { generateEmailDraft } = useAI();
      await generateEmailDraft(context);

      expect(mockApiFetch).toHaveBeenCalledWith('ai/email/generate', 'POST', context);
    });

    it('should return generated email on success', async () => {
      const mockEmail = { subject: 'Hello', body: 'Email body' };
      mockApiFetch.mockResolvedValue({ success: true, body: mockEmail });

      const { generateEmailDraft, generatedEmail } = useAI();
      const result = await generateEmailDraft({ to: 'test@test.com' });

      expect(result).toEqual(mockEmail);
      expect(generatedEmail.value).toEqual(mockEmail);
    });

    it('should return null and show error on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Generation failed' });

      const { generateEmailDraft } = useAI();
      const result = await generateEmailDraft({});

      expect(result).toBeNull();
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should manage isEmailLoading state', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { subject: 'S', body: 'B' } });

      const { generateEmailDraft, isEmailLoading } = useAI();

      expect(isEmailLoading.value).toBe(false);
      const promise = generateEmailDraft({});
      // loading is set synchronously
      await promise;
      expect(isEmailLoading.value).toBe(false);
    });
  });

  // ============================================
  // suggestReply
  // ============================================
  describe('suggestReply', () => {
    it('should call the correct API endpoint with thread and context', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { subject: 'Re: Hello', body: 'Reply body' } });

      const { suggestReply } = useAI();
      await suggestReply('Original email thread', { dealId: '1' });

      expect(mockApiFetch).toHaveBeenCalledWith('ai/email/suggest-reply', 'POST', { thread: 'Original email thread', context: { dealId: '1' } });
    });

    it('should return suggested reply on success', async () => {
      const mockReply = { subject: 'Re: Hi', body: 'Thanks for reaching out' };
      mockApiFetch.mockResolvedValue({ success: true, body: mockReply });

      const { suggestReply } = useAI();
      const result = await suggestReply('Original thread');

      expect(result).toEqual(mockReply);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Cannot suggest reply' });

      const { suggestReply } = useAI();
      const result = await suggestReply('Thread');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // improveEmail
  // ============================================
  describe('improveEmail', () => {
    it('should call the correct API endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { subject: 'Improved Subject', body: 'Improved body' } });

      const { improveEmail } = useAI();
      await improveEmail('Original draft', 'Make it more formal');

      expect(mockApiFetch).toHaveBeenCalledWith('ai/email/improve', 'POST', { draft: 'Original draft', instruction: 'Make it more formal' });
    });

    it('should return improved email on success', async () => {
      const improved = { subject: 'Formal Subject', body: 'Formal body' };
      mockApiFetch.mockResolvedValue({ success: true, body: improved });

      const { improveEmail } = useAI();
      const result = await improveEmail('Draft', 'More formal');

      expect(result).toEqual(improved);
    });
  });

  // ============================================
  // getDailyInsights
  // ============================================
  describe('getDailyInsights', () => {
    it('should fetch and return daily insights', async () => {
      const mockInsights = [
        { id: '1', type: 'warning', icon: 'alert', title: 'Low conversion', description: 'Rate dropped', dismissed: false },
        { id: '2', type: 'success', icon: 'check', title: 'Revenue up', description: 'Revenue increased', dismissed: false }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: { insights: mockInsights, generatedAt: '2024-01-01' } });

      const { getDailyInsights, insights } = useAI();
      const result = await getDailyInsights();

      expect(mockApiFetch).toHaveBeenCalledWith('ai/insights/daily');
      expect(result).toHaveLength(2);
      expect(insights.value).toHaveLength(2);
    });

    it('should set dismissed to false for all insights', async () => {
      const mockInsights = [{ id: '1', type: 'info', icon: 'i', title: 'Tip', description: 'Some tip' }];
      mockApiFetch.mockResolvedValue({ success: true, body: { insights: mockInsights } });

      const { getDailyInsights, insights } = useAI();
      await getDailyInsights();

      expect(insights.value[0]?.dismissed).toBe(false);
    });

    it('should return empty array on API failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, body: null });

      const { getDailyInsights } = useAI();
      const result = await getDailyInsights();

      expect(result).toEqual([]);
    });

    it('should return empty array on thrown error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Server error'));

      const { getDailyInsights } = useAI();
      const result = await getDailyInsights();

      expect(result).toEqual([]);
    });

    it('should manage isInsightsLoading state', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { insights: [] } });

      const { getDailyInsights, isInsightsLoading } = useAI();
      expect(isInsightsLoading.value).toBe(false);
      await getDailyInsights();
      expect(isInsightsLoading.value).toBe(false);
    });
  });

  // ============================================
  // dismissInsight
  // ============================================
  describe('dismissInsight', () => {
    it('should remove insight from the list by id', async () => {
      const mockInsights = [
        { id: '1', type: 'info', icon: 'i', title: 'Insight 1', description: 'Desc 1' },
        { id: '2', type: 'warning', icon: 'w', title: 'Insight 2', description: 'Desc 2' }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: { insights: mockInsights } });

      const { getDailyInsights, dismissInsight, insights } = useAI();
      await getDailyInsights();
      expect(insights.value).toHaveLength(2);

      dismissInsight('1');

      expect(insights.value).toHaveLength(1);
      expect(insights.value[0]?.id).toBe('2');
    });

    it('should do nothing when insight id does not exist', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { insights: [{ id: '1', type: 'info', icon: 'i', title: 'I', description: 'D' }] } });

      const { getDailyInsights, dismissInsight, insights } = useAI();
      await getDailyInsights();

      dismissInsight('non-existent-id');

      expect(insights.value).toHaveLength(1);
    });
  });
});
