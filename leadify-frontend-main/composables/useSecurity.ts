import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface SessionInfo {
  id: number;
  userId: number;
  token: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  userId: number;
  ip: string;
  userAgent: string;
  location: string | null;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  failReason: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface IPWhitelistEntry {
  id: string;
  ip: string;
  label: string;
  createdBy: number;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SecurityDashboard {
  totalLoginsToday: number;
  failedAttemptsToday: number;
  blockedAttemptsToday: number;
  activeSessions: number;
  uniqueIPsToday: number;
  recentLogins: LoginHistoryEntry[];
}

export interface LoginHistoryFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedLoginHistory {
  docs: LoginHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ─── Composable ────────────────────────────────────────────────────────────────

export function useSecurity() {
  const sessions = ref<SessionInfo[]>([]);
  const loginHistory = ref<PaginatedLoginHistory | null>(null);
  const ipWhitelist = ref<IPWhitelistEntry[]>([]);
  const dashboard = ref<SecurityDashboard | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ─── Sessions ────────────────────────────────────────────────────────

  async function fetchSessions(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<SessionInfo[]>('security/session/sessions');
      if (response.success && response.body) {
        sessions.value = response.body;
      } else {
        error.value = response.message;
      }
    } catch (e: unknown) {
      error.value = e.message || 'Failed to fetch sessions';
    } finally {
      loading.value = false;
    }
  }

  async function terminateSession(sessionId: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch(`security/session/sessions/${sessionId}`, 'DELETE');
      if (response.success) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId);
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = e.message || 'Failed to terminate session';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function terminateAllSessions(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch('security/session/sessions', 'DELETE');
      if (response.success) {
        // Only keep the current session
        sessions.value = sessions.value.filter(s => s.isCurrent);
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = e.message || 'Failed to terminate sessions';
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ─── Login History ───────────────────────────────────────────────────

  async function fetchLoginHistory(filters: LoginHistoryFilters = {}): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      const qs = params.toString();
      const response = await useApiFetch<PaginatedLoginHistory>(`security/session/login-history${qs ? `?${qs}` : ''}`);
      if (response.success && response.body) {
        loginHistory.value = response.body;
      } else {
        error.value = response.message;
      }
    } catch (e: unknown) {
      error.value = e.message || 'Failed to fetch login history';
    } finally {
      loading.value = false;
    }
  }

  // ─── IP Whitelist ────────────────────────────────────────────────────

  async function fetchIPWhitelist(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<IPWhitelistEntry[]>('security/session/ip-whitelist');
      if (response.success && response.body) {
        ipWhitelist.value = response.body;
      } else {
        error.value = response.message;
      }
    } catch (e: unknown) {
      error.value = e.message || 'Failed to fetch IP whitelist';
    } finally {
      loading.value = false;
    }
  }

  async function addIP(ip: string, label: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<IPWhitelistEntry>('security/session/ip-whitelist', 'POST', { ip, label });
      if (response.success && response.body) {
        ipWhitelist.value.unshift(response.body);
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = e.message || 'Failed to add IP';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function removeIP(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch(`security/session/ip-whitelist/${id}`, 'DELETE');
      if (response.success) {
        ipWhitelist.value = ipWhitelist.value.filter(entry => entry.id !== id);
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = e.message || 'Failed to remove IP';
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ─── Dashboard ───────────────────────────────────────────────────────

  async function fetchDashboard(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<SecurityDashboard>('security/session/dashboard');
      if (response.success && response.body) {
        dashboard.value = response.body;
      } else {
        error.value = response.message;
      }
    } catch (e: unknown) {
      error.value = e.message || 'Failed to fetch dashboard';
    } finally {
      loading.value = false;
    }
  }

  // ─── GDPR Export ─────────────────────────────────────────────────────

  async function exportData(): Promise<Record<string, unknown> | null> {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<Record<string, unknown>>('security/session/export-data', 'POST');
      if (response.success && response.body) {
        return response.body;
      }
      error.value = response.message;
      return null;
    } catch (e: unknown) {
      error.value = e.message || 'Failed to export data';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    sessions,
    loginHistory,
    ipWhitelist,
    dashboard,
    loading,
    error,
    // Methods
    fetchSessions,
    terminateSession,
    terminateAllSessions,
    fetchLoginHistory,
    fetchIPWhitelist,
    addIP,
    removeIP,
    fetchDashboard,
    exportData
  };
}
