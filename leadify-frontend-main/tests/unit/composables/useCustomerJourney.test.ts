/**
 * useCustomerJourney - Unit Tests
 * =================================
 * Tests for composables/useCustomerJourney.ts
 *
 * The composable provides:
 * - fetchJourney(leadId): fetch customer journey events and summary
 * - setZoom(level): change zoom level
 * - typeColors, typeIcons, sentimentColors: static mappings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomerJourney } from '@/composables/useCustomerJourney';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

// Mocking auto-imported vue composables
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual };
});

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);
// ref and computed need to be available as globals for composables using Nuxt auto-imports
const { ref, computed } = await import('vue');
(globalThis as Record<string, unknown>).ref = ref;
(globalThis as Record<string, unknown>).computed = computed;

describe('useCustomerJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchJourney
  // ============================================
  describe('fetchJourney', () => {
    it('should fetch journey for a lead and set journey data', async () => {
      const mockJourney = {
        events: [
          { date: '2024-01-01', type: 'creation', title: 'Lead Created', description: 'Lead was created', sentiment: 'positive' },
          { date: '2024-01-05', type: 'email', title: 'Email Sent', description: 'Sent welcome email', sentiment: 'neutral' }
        ],
        summary: {
          totalTouchpoints: 2,
          journeyDurationDays: 5,
          avgDaysBetweenTouchpoints: 2.5,
          firstContact: '2024-01-01',
          lastContact: '2024-01-05'
        }
      };
      mockUseApiFetch.mockResolvedValue({ body: mockJourney, success: true, message: '' });

      const { fetchJourney, journey } = useCustomerJourney();
      await fetchJourney('lead-123');

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead/lead-123/journey');
      expect(journey.value).toEqual(mockJourney);
      expect(journey.value?.events).toHaveLength(2);
    });

    it('should set error when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false, message: 'Not found' });

      const { fetchJourney, journey, error } = useCustomerJourney();
      await fetchJourney('lead-999');

      expect(journey.value).toBeNull();
      expect(error.value).toBe('Not found');
    });

    it('should set default error message when no message provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false, message: '' });

      const { fetchJourney, error } = useCustomerJourney();
      await fetchJourney('lead-999');

      expect(error.value).toBe('Failed to load journey data');
    });

    it('should handle thrown exceptions', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Network failure'));

      const { fetchJourney, error } = useCustomerJourney();
      await fetchJourney('lead-123');

      expect(error.value).toBe('Network failure');
    });

    it('should manage loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      mockUseApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { fetchJourney, loading } = useCustomerJourney();

      expect(loading.value).toBe(false);
      const promise = fetchJourney('lead-123');
      expect(loading.value).toBe(true);

      resolvePromise!({ body: { events: [], summary: { totalTouchpoints: 0, journeyDurationDays: 0, avgDaysBetweenTouchpoints: 0, firstContact: '', lastContact: '' } }, success: true, message: '' });
      await promise;
      expect(loading.value).toBe(false);
    });

    it('should reset error before each fetch', async () => {
      const { fetchJourney, error } = useCustomerJourney();

      // First call fails
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: false, message: 'Error' });
      await fetchJourney('lead-123');
      expect(error.value).toBe('Error');

      // Second call succeeds
      mockUseApiFetch.mockResolvedValueOnce({ body: { events: [], summary: {} }, success: true, message: '' });
      await fetchJourney('lead-123');
      expect(error.value).toBeNull();
    });
  });

  // ============================================
  // setZoom
  // ============================================
  describe('setZoom', () => {
    it('should default to month zoom level', () => {
      const { zoomLevel } = useCustomerJourney();
      expect(zoomLevel.value).toBe('month');
    });

    it('should change zoom to year', () => {
      const { setZoom, zoomLevel } = useCustomerJourney();
      setZoom('year');
      expect(zoomLevel.value).toBe('year');
    });

    it('should change zoom to week', () => {
      const { setZoom, zoomLevel } = useCustomerJourney();
      setZoom('week');
      expect(zoomLevel.value).toBe('week');
    });

    it('should change zoom back to month', () => {
      const { setZoom, zoomLevel } = useCustomerJourney();
      setZoom('year');
      setZoom('month');
      expect(zoomLevel.value).toBe('month');
    });
  });

  // ============================================
  // typeColors
  // ============================================
  describe('typeColors', () => {
    it('should have colors for all event types', () => {
      const { typeColors } = useCustomerJourney();

      expect(typeColors.creation).toBeDefined();
      expect(typeColors.email).toBeDefined();
      expect(typeColors.call).toBeDefined();
      expect(typeColors.meeting).toBeDefined();
      expect(typeColors.deal_stage).toBeDefined();
      expect(typeColors.note).toBeDefined();
      expect(typeColors.task).toBeDefined();
      expect(typeColors.proposal).toBeDefined();
      expect(typeColors.invoice).toBeDefined();
    });
  });

  // ============================================
  // typeIcons
  // ============================================
  describe('typeIcons', () => {
    it('should have icons for all event types', () => {
      const { typeIcons } = useCustomerJourney();

      expect(typeIcons.creation).toBeDefined();
      expect(typeIcons.email).toContain('envelope');
      expect(typeIcons.call).toContain('phone');
      expect(typeIcons.meeting).toBeDefined();
    });
  });

  // ============================================
  // sentimentColors
  // ============================================
  describe('sentimentColors', () => {
    it('should have colors for all sentiment types', () => {
      const { sentimentColors } = useCustomerJourney();

      expect(sentimentColors.positive).toBeDefined();
      expect(sentimentColors.neutral).toBeDefined();
      expect(sentimentColors.negative).toBeDefined();
    });

    it('should use green for positive sentiment', () => {
      const { sentimentColors } = useCustomerJourney();
      expect(sentimentColors.positive).toContain('#10b981');
    });

    it('should use red for negative sentiment', () => {
      const { sentimentColors } = useCustomerJourney();
      expect(sentimentColors.negative).toContain('#ef4444');
    });
  });

  // ============================================
  // initial state
  // ============================================
  describe('initial state', () => {
    it('should initialize with null journey', () => {
      const { journey } = useCustomerJourney();
      expect(journey.value).toBeNull();
    });

    it('should initialize with no error', () => {
      const { error } = useCustomerJourney();
      expect(error.value).toBeNull();
    });

    it('should initialize with loading false', () => {
      const { loading } = useCustomerJourney();
      expect(loading.value).toBe(false);
    });
  });
});
