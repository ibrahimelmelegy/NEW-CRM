/**
 * useCallLog - Unit Tests
 * ========================
 * Tests for composables/useCallLog.ts
 *
 * The composable provides:
 * - fetchCalls(page): Fetch call logs from API
 * - fetchAnalytics(dateRange?): Fetch call analytics
 * - logCall(data): Create a new call log
 * - removeCall(id): Delete a call log
 * - calls (computed/sorted), stats (computed), analytics, loading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCallLog } from '~/composables/useCallLog';

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

describe('useCallLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module-level state by always returning empty on default
  });

  // ============================================
  // fetchCalls
  // ============================================
  describe('fetchCalls', () => {
    it('should call the correct API endpoint with page parameter', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [] } });

      const { fetchCalls } = useCallLog();
      await fetchCalls(2);

      expect(mockApiFetch).toHaveBeenCalledWith('communications/call-logs?page=2&limit=100');
    });

    it('should use page 1 by default', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: [] } });

      const { fetchCalls } = useCallLog();
      await fetchCalls();

      expect(mockApiFetch).toHaveBeenCalledWith('communications/call-logs?page=1&limit=100');
    });

    it('should map API response to CallEntry format', async () => {
      const mockDocs = [
        {
          id: 1,
          subject: 'John Doe',
          direction: 'OUTBOUND',
          duration: 120,
          body: 'Test notes',
          createdAt: '2024-01-15T10:00:00Z',
          callLog: {
            phoneNumber: '+1234567890',
            outcome: 'CONNECTED',
            disposition: 'INTERESTED',
            duration: 120
          }
        }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: mockDocs } });

      const { fetchCalls, calls } = useCallLog();
      await fetchCalls();

      expect(calls.value).toHaveLength(1);
      const call = calls.value[0];
      expect(call?.contactName).toBe('John Doe');
      expect(call?.direction).toBe('outbound');
      expect(call?.outcome).toBe('answered'); // CONNECTED maps to answered
      expect(call?.phone).toBe('+1234567890');
    });

    it('should manage loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { fetchCalls, loading } = useCallLog();

      expect(loading.value).toBe(false);
      const promise = fetchCalls();
      expect(loading.value).toBe(true);

      resolvePromise!({ success: true, body: { docs: [] } });
      await promise;
      expect(loading.value).toBe(false);
    });

    it('should map various outcome codes correctly', async () => {
      const mockDocs = [
        { id: 1, direction: 'INBOUND', duration: 60, createdAt: '2024-01-01', callLog: { outcome: 'NO_ANSWER' } },
        { id: 2, direction: 'OUTBOUND', duration: 90, createdAt: '2024-01-02', callLog: { outcome: 'VOICEMAIL' } },
        { id: 3, direction: 'INBOUND', duration: 30, createdAt: '2024-01-03', callLog: { outcome: 'BUSY' } }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: mockDocs } });

      const { fetchCalls, calls } = useCallLog();
      await fetchCalls();

      const results = calls.value;
      expect(results.find(c => c.id === 1)?.outcome).toBe('no_answer');
      expect(results.find(c => c.id === 2)?.outcome).toBe('voicemail');
      expect(results.find(c => c.id === 3)?.outcome).toBe('busy');
    });

    it('should sort calls by createdAt descending', async () => {
      const mockDocs = [
        { id: 1, direction: 'OUTBOUND', duration: 60, createdAt: '2024-01-01T10:00:00Z', callLog: {} },
        { id: 2, direction: 'OUTBOUND', duration: 60, createdAt: '2024-01-03T10:00:00Z', callLog: {} },
        { id: 3, direction: 'OUTBOUND', duration: 60, createdAt: '2024-01-02T10:00:00Z', callLog: {} }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: mockDocs } });

      const { fetchCalls, calls } = useCallLog();
      await fetchCalls();

      expect(calls.value[0]?.id).toBe(2); // Most recent first
      expect(calls.value[1]?.id).toBe(3);
      expect(calls.value[2]?.id).toBe(1);
    });
  });

  // ============================================
  // fetchAnalytics
  // ============================================
  describe('fetchAnalytics', () => {
    it('should call the correct endpoint without date range', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { totalCalls: 10 } });

      const { fetchAnalytics } = useCallLog();
      await fetchAnalytics();

      expect(mockApiFetch).toHaveBeenCalledWith('communications/call-analytics');
    });

    it('should include date range in query params', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: { totalCalls: 5 } });

      const { fetchAnalytics } = useCallLog();
      await fetchAnalytics({ start: '2024-01-01', end: '2024-01-31' });

      expect(mockApiFetch).toHaveBeenCalledWith('communications/call-analytics?start=2024-01-01&end=2024-01-31');
    });

    it('should set analytics value on success', async () => {
      const mockAnalytics = {
        totalCalls: 50,
        totalDuration: 3000,
        avgDuration: 60,
        durationDistribution: {},
        byOutcome: { CONNECTED: 30 },
        byDisposition: {},
        byHour: {},
        byDirection: { INBOUND: 20, OUTBOUND: 30 },
        dailyVolume: {}
      };
      mockApiFetch.mockResolvedValue({ success: true, body: mockAnalytics });

      const { fetchAnalytics, analytics } = useCallLog();
      await fetchAnalytics();

      expect(analytics.value).toEqual(mockAnalytics);
    });
  });

  // ============================================
  // logCall
  // ============================================
  describe('logCall', () => {
    it('should call the correct API endpoint with POST method', async () => {
      // First call for logCall, second for fetchCalls after success
      mockApiFetch.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: true, body: { docs: [] } });

      const { logCall } = useCallLog();
      await logCall({
        contactName: 'Jane Smith',
        phone: '+9876543210',
        direction: 'outbound',
        outcome: 'answered',
        duration: 300,
        notes: 'Good call'
      });

      expect(mockApiFetch).toHaveBeenCalledWith('communications/calls', 'POST', expect.objectContaining({
        phoneNumber: '+9876543210',
        direction: 'OUTBOUND',
        outcome: 'CONNECTED'
      }));
    });

    it('should return true on success', async () => {
      mockApiFetch.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: true, body: { docs: [] } });

      const { logCall } = useCallLog();
      const result = await logCall({
        contactName: 'Test',
        phone: '+111',
        direction: 'inbound',
        outcome: 'no_answer',
        duration: 0,
        notes: ''
      });

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Validation error' });

      const { logCall } = useCallLog();
      const result = await logCall({
        contactName: 'Test',
        phone: '+111',
        direction: 'outbound',
        outcome: 'voicemail',
        duration: 60,
        notes: ''
      });

      expect(result).toBe(false);
    });

    it('should map outcome values correctly to backend format', async () => {
      mockApiFetch.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: true, body: { docs: [] } });

      const { logCall } = useCallLog();
      await logCall({
        contactName: 'Test',
        phone: '+111',
        direction: 'outbound',
        outcome: 'voicemail',
        duration: 60,
        notes: ''
      });

      expect(mockApiFetch).toHaveBeenCalledWith('communications/calls', 'POST', expect.objectContaining({
        outcome: 'VOICEMAIL'
      }));
    });

    it('should include notes in the payload', async () => {
      mockApiFetch.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: true, body: { docs: [] } });

      const { logCall } = useCallLog();
      await logCall({
        contactName: 'Client',
        phone: '+999',
        direction: 'inbound',
        outcome: 'callback',
        duration: 45,
        notes: 'Client wants to schedule a follow-up'
      });

      expect(mockApiFetch).toHaveBeenCalledWith('communications/calls', 'POST', expect.objectContaining({
        body: 'Client wants to schedule a follow-up',
        notes: 'Client wants to schedule a follow-up'
      }));
    });
  });

  // ============================================
  // removeCall
  // ============================================
  describe('removeCall', () => {
    it('should call the correct DELETE endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { removeCall } = useCallLog();
      await removeCall(5);

      expect(mockApiFetch).toHaveBeenCalledWith('communications/activities/5', 'DELETE');
    });

    it('should not call DELETE for non-existent call gracefully', async () => {
      mockApiFetch.mockResolvedValue({ success: false });

      const { removeCall } = useCallLog();
      await removeCall(999); // Should not throw

      expect(mockApiFetch).toHaveBeenCalled();
    });
  });

  // ============================================
  // stats computed
  // ============================================
  describe('stats computed', () => {
    it('should calculate correct stats from calls', async () => {
      const mockDocs = [
        { id: 1, direction: 'INBOUND', duration: 60, createdAt: '2024-01-01', callLog: { outcome: 'CONNECTED' } },
        { id: 2, direction: 'OUTBOUND', duration: 120, createdAt: '2024-01-02', callLog: { outcome: 'NO_ANSWER' } },
        { id: 3, direction: 'OUTBOUND', duration: 90, createdAt: '2024-01-03', callLog: { outcome: 'CONNECTED' } }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: { docs: mockDocs } });

      const { fetchCalls, stats } = useCallLog();
      await fetchCalls();

      expect(stats.value.total).toBe(3);
      expect(stats.value.totalDuration).toBe(270); // 60+120+90
      expect(stats.value.answered).toBe(2);
      expect(stats.value.missed).toBe(1);
      expect(stats.value.inbound).toBe(1);
      expect(stats.value.outbound).toBe(2);
    });
  });
});
