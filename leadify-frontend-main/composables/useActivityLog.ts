/**
 * Activity Log / Timeline System — API-backed via Audit Trail
 * Track all user activities across the CRM.
 */

import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface ActivityEntry {
  id: string | number;
  action: 'created' | 'updated' | 'deleted' | 'archived' | 'converted' | 'sent' | 'called' | 'meeting' | 'note' | 'signed';
  entityType: 'document' | 'contact' | 'deal' | 'task' | 'invoice' | 'reminder';
  entityId?: string | number;
  entityLabel: string;
  description: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const activities = ref<ActivityEntry[]>([]);
const loading = ref(false);

const actionMap: Record<string, ActivityEntry['action']> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  ARCHIVE: 'archived',
  STATUS_CHANGE: 'updated',
  ASSIGNMENT: 'updated',
  RESTORE: 'created'
};

export function useActivityLog() {
  const sorted = computed(() => [...activities.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

  const recent = computed(() => sorted.value.slice(0, 50));

  async function fetchActivities(page = 1) {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch(`audit?page=${page}&limit=100`);
      if (success && body) {
        const data = body as unknown;
        const docs = data.docs || data || [];
        activities.value = docs.map((a) => ({
          id: a.id,
          action: actionMap[a.action] || 'updated',
          entityType: (a.entityType || '').toLowerCase(),
          entityId: a.entityId,
          entityLabel: a.entityLabel || `${a.entityType} #${a.entityId}`,
          description: a.description || `${a.action} ${a.entityType} #${a.entityId}`,
          user: a.user?.name || a.userName || undefined,
          timestamp: a.createdAt,
          metadata: a.changes || a.metadata
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchByEntity(entityType: string, entityId?: string | number) {
    const url = entityId ? `audit/${entityType}/${entityId}` : `audit?entityType=${entityType}&limit=100`;
    const { body, success } = await useApiFetch(url);
    if (success && body) {
      const data = body as unknown;
      const docs = data.docs || data || [];
      return docs.map((a) => ({
        id: a.id,
        action: actionMap[a.action] || 'updated',
        entityType: (a.entityType || '').toLowerCase(),
        entityId: a.entityId,
        entityLabel: a.entityLabel || `${a.entityType} #${a.entityId}`,
        description: a.description || `${a.action} ${a.entityType} #${a.entityId}`,
        user: a.user?.name || a.userName || undefined,
        timestamp: a.createdAt,
        metadata: a.changes || a.metadata
      })) as ActivityEntry[];
    }
    return [];
  }

  function log(entry: Omit<ActivityEntry, 'id' | 'timestamp'>) {
    // Push locally for instant UX — audit trail is created server-side automatically
    activities.value.unshift({
      ...entry,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    });
    if (activities.value.length > 500) activities.value = activities.value.slice(0, 500);
  }

  function getByEntity(entityType: string, entityId?: string | number): ActivityEntry[] {
    return sorted.value.filter(a => a.entityType === entityType && (entityId === undefined || a.entityId === entityId));
  }

  function getByContact(contactId: string | number): ActivityEntry[] {
    return sorted.value.filter(a => (a.entityType === 'contact' && a.entityId === contactId) || (a.metadata as unknown)?.contactId === contactId);
  }

  function clearAll() {
    activities.value = [];
  }

  const actionIcons: Record<string, string> = {
    created: 'ph:plus-circle',
    updated: 'ph:pencil',
    deleted: 'ph:trash',
    archived: 'ph:archive',
    converted: 'ph:arrows-clockwise',
    sent: 'ph:paper-plane-tilt',
    called: 'ph:phone',
    meeting: 'ph:calendar-check',
    note: 'ph:note-pencil',
    signed: 'ph:signature'
  };

  const actionColors: Record<string, string> = {
    created: '#22c55e',
    updated: '#3b82f6',
    deleted: '#ef4444',
    archived: '#f59e0b',
    converted: '#8b5cf6',
    sent: '#06b6d4',
    called: '#10b981',
    meeting: '#7c3aed',
    note: '#6b7280',
    signed: '#059669'
  };

  return {
    activities: sorted,
    recent,
    log,
    getByEntity,
    getByContact,
    clearAll,
    fetchActivities,
    fetchByEntity,
    actionIcons,
    actionColors,
    loading
  };
}
