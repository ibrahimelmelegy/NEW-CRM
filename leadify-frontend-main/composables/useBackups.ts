import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface BackupRecord {
  id: number;
  filename: string;
  filePath: string;
  fileSize: number;
  backupType: 'full' | 'incremental' | 'manual';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  createdBy: number | null;
  metadata: {
    tables?: string[];
    rowCounts?: Record<string, number>;
    pgVersion?: string;
    dumpFormat?: string;
  } | null;
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackup: BackupRecord | null;
  lastSuccessfulBackup: BackupRecord | null;
  autoBackupActive: boolean;
}

export interface BackupPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface BackupListResponse {
  docs: BackupRecord[];
  pagination: BackupPagination;
}

// ─── Composable ────────────────────────────────────────────────────────────────

export function useBackups() {
  const backups = ref<BackupRecord[]>([]);
  const pagination = ref<BackupPagination>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0
  });
  const stats = ref<BackupStats | null>(null);
  const loading = ref(false);
  const actionLoading = ref(false);
  const error = ref<string | null>(null);

  // ─── Fetch Backups List ────────────────────────────────────────────

  async function fetchBackups(page: number = 1, limit: number = 20, status?: string, type?: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (status) params.append('status', status);
      if (type) params.append('type', type);

      const response = await useApiFetch<BackupListResponse>(`backups?${params.toString()}`);
      if (response.success && response.body) {
        backups.value = response.body.docs;
        pagination.value = response.body.pagination;
      } else {
        error.value = response.message;
      }
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to fetch backups';
    } finally {
      loading.value = false;
    }
  }

  // ─── Fetch Stats ───────────────────────────────────────────────────

  async function fetchStats(): Promise<void> {
    try {
      const response = await useApiFetch<BackupStats>('backups/stats');
      if (response.success && response.body) {
        stats.value = response.body;
      }
    } catch {
      // Stats fetch failed silently
    }
  }

  // ─── Create Backup ─────────────────────────────────────────────────

  async function createBackup(type: string = 'manual'): Promise<BackupRecord | null> {
    actionLoading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<BackupRecord>('backups', 'POST', { type });
      if (response.success && response.body) {
        // Prepend the new backup to the list
        backups.value.unshift(response.body);
        return response.body;
      }
      error.value = response.message;
      return null;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to create backup';
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  // ─── Restore Backup ────────────────────────────────────────────────

  async function restoreBackup(id: number): Promise<boolean> {
    actionLoading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<{ success: boolean; message: string }>(`backups/${id}/restore`, 'POST');
      if (response.success) {
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to restore backup';
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  // ─── Delete Backup ─────────────────────────────────────────────────

  async function deleteBackup(id: number): Promise<boolean> {
    actionLoading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch(`backups/${id}`, 'DELETE');
      if (response.success) {
        backups.value = backups.value.filter(b => b.id !== id);
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to delete backup';
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  // ─── Download Backup ───────────────────────────────────────────────

  function downloadBackup(id: number): void {
    const config = useRuntimeConfig();
    const url = `${config.public.API_BASE_URL}backups/${id}/download`;
    window.open(url, '_blank');
  }

  // ─── Cleanup Old Backups ───────────────────────────────────────────

  async function cleanupBackups(retentionDays: number = 30): Promise<{ deleted: number; freedBytes: number } | null> {
    actionLoading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<{ deleted: number; freedBytes: number }>('backups/cleanup', 'POST', { retentionDays });
      if (response.success && response.body) {
        // Refresh the list after cleanup
        await fetchBackups(pagination.value.page, pagination.value.limit);
        return response.body;
      }
      error.value = response.message;
      return null;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to cleanup backups';
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  // ─── Update Auto-Backup Schedule ──────────────────────────────────

  async function updateSchedule(enabled: boolean, cronExpression?: string): Promise<boolean> {
    actionLoading.value = true;
    error.value = null;
    try {
      const response = await useApiFetch<{ autoBackupActive: boolean }>('backups/schedule', 'POST', { enabled, cronExpression });
      if (response.success && response.body) {
        if (stats.value) {
          stats.value.autoBackupActive = response.body.autoBackupActive;
        }
        return true;
      }
      error.value = response.message;
      return false;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to update schedule';
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    // State
    backups,
    pagination,
    stats,
    loading,
    actionLoading,
    error,
    // Methods
    fetchBackups,
    fetchStats,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    cleanupBackups,
    updateSchedule
  };
}
