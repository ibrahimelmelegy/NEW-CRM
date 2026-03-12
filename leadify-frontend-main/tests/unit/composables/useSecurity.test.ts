/**
 * useSecurity - Unit Tests
 * ==========================
 * Tests for composables/useSecurity.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSecurity } from '~/composables/useSecurity';

const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

describe('useSecurity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchSessions
  // ============================================
  describe('fetchSessions', () => {
    it('should fetch and store sessions', async () => {
      const sessions = [{ id: 1, userId: 1, token: 'abc', expiresAt: '2025-01-01', isCurrent: true }];
      mockApiFetch.mockResolvedValue({ body: sessions, success: true });

      const sec = useSecurity();
      await sec.fetchSessions();

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/sessions');
      expect(sec.sessions.value).toEqual(sessions);
      expect(sec.loading.value).toBe(false);
    });

    it('should set error on failure response', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false, message: 'Unauthorized' });

      const sec = useSecurity();
      await sec.fetchSessions();

      expect(sec.error.value).toBe('Unauthorized');
    });

    it('should set error on thrown exception', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const sec = useSecurity();
      await sec.fetchSessions();

      expect(sec.error.value).toBe('Network error');
    });
  });

  // ============================================
  // terminateSession
  // ============================================
  describe('terminateSession', () => {
    it('should terminate a session and remove from list', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const sec = useSecurity();
      sec.sessions.value = [
        { id: 1, userId: 1, token: 'a', expiresAt: '2025-01-01', isCurrent: true },
        { id: 2, userId: 1, token: 'b', expiresAt: '2025-01-01', isCurrent: false }
      ];

      const result = await sec.terminateSession(2);

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/sessions/2', 'DELETE');
      expect(result).toBe(true);
      expect(sec.sessions.value).toHaveLength(1);
      expect(sec.sessions.value[0]!.id).toBe(1);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      const sec = useSecurity();
      const result = await sec.terminateSession(999);

      expect(result).toBe(false);
      expect(sec.error.value).toBe('Not found');
    });
  });

  // ============================================
  // terminateAllSessions
  // ============================================
  describe('terminateAllSessions', () => {
    it('should terminate all sessions except current', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const sec = useSecurity();
      sec.sessions.value = [
        { id: 1, userId: 1, token: 'a', expiresAt: '2025-01-01', isCurrent: true },
        { id: 2, userId: 1, token: 'b', expiresAt: '2025-01-01', isCurrent: false },
        { id: 3, userId: 1, token: 'c', expiresAt: '2025-01-01', isCurrent: false }
      ];

      const result = await sec.terminateAllSessions();

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/sessions', 'DELETE');
      expect(result).toBe(true);
      expect(sec.sessions.value).toHaveLength(1);
      expect(sec.sessions.value[0]!.isCurrent).toBe(true);
    });
  });

  // ============================================
  // fetchLoginHistory
  // ============================================
  describe('fetchLoginHistory', () => {
    it('should fetch login history without filters', async () => {
      const data = { docs: [{ id: '1', ip: '127.0.0.1' }], pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const sec = useSecurity();
      await sec.fetchLoginHistory();

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/login-history');
      expect(sec.loginHistory.value).toEqual(data);
    });

    it('should include filter params in query', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      const sec = useSecurity();
      await sec.fetchLoginHistory({ status: 'FAILED', page: 2 });

      const calledUrl = mockApiFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('status=FAILED');
      expect(calledUrl).toContain('page=2');
    });

    it('should set error on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false, message: 'Error' });

      const sec = useSecurity();
      await sec.fetchLoginHistory();

      expect(sec.error.value).toBe('Error');
    });
  });

  // ============================================
  // IP Whitelist
  // ============================================
  describe('fetchIPWhitelist', () => {
    it('should fetch IP whitelist', async () => {
      const entries = [{ id: '1', ip: '10.0.0.1', label: 'Office', isActive: true }];
      mockApiFetch.mockResolvedValue({ body: entries, success: true });

      const sec = useSecurity();
      await sec.fetchIPWhitelist();

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/ip-whitelist');
      expect(sec.ipWhitelist.value).toEqual(entries);
    });
  });

  describe('addIP', () => {
    it('should add IP and return true', async () => {
      const newEntry = { id: '2', ip: '192.168.1.1', label: 'Home' };
      mockApiFetch.mockResolvedValue({ body: newEntry, success: true });

      const sec = useSecurity();
      sec.ipWhitelist.value = [];
      const result = await sec.addIP('192.168.1.1', 'Home');

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/ip-whitelist', 'POST', { ip: '192.168.1.1', label: 'Home' });
      expect(result).toBe(true);
      expect(sec.ipWhitelist.value).toHaveLength(1);
    });

    it('should return false on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false, message: 'Invalid IP' });

      const sec = useSecurity();
      const result = await sec.addIP('invalid', 'Bad');

      expect(result).toBe(false);
    });
  });

  describe('removeIP', () => {
    it('should remove IP and return true', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const sec = useSecurity();
      sec.ipWhitelist.value = [{ id: '1', ip: '10.0.0.1', label: 'Office', createdBy: 1, tenantId: null, isActive: true, createdAt: '' }];
      const result = await sec.removeIP('1');

      expect(result).toBe(true);
      expect(sec.ipWhitelist.value).toHaveLength(0);
    });
  });

  // ============================================
  // Dashboard
  // ============================================
  describe('fetchDashboard', () => {
    it('should fetch security dashboard', async () => {
      const data = { totalLoginsToday: 10, failedAttemptsToday: 2, blockedAttemptsToday: 0, activeSessions: 5, uniqueIPsToday: 3, recentLogins: [] };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const sec = useSecurity();
      await sec.fetchDashboard();

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/dashboard');
      expect(sec.dashboard.value).toEqual(data);
    });
  });

  // ============================================
  // exportData
  // ============================================
  describe('exportData', () => {
    it('should return exported data on success', async () => {
      const data = { user: { name: 'Test' }, logins: [] };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const sec = useSecurity();
      const result = await sec.exportData();

      expect(mockApiFetch).toHaveBeenCalledWith('security/session/export-data', 'POST');
      expect(result).toEqual(data);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false, message: 'Forbidden' });

      const sec = useSecurity();
      const result = await sec.exportData();

      expect(result).toBeNull();
    });
  });
});
