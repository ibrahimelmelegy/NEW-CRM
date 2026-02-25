/**
 * Activity Log / Timeline System
 * Track all user activities across the CRM.
 */

import { ref, computed } from 'vue';

export interface ActivityEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'archived' | 'converted' | 'sent' | 'called' | 'meeting' | 'note' | 'signed';
  entityType: 'document' | 'contact' | 'deal' | 'task' | 'invoice' | 'reminder';
  entityId?: string | number;
  entityLabel: string;
  description: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'crm_activity_log';

function load(): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function save(items: ActivityEntry[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const activities = ref<ActivityEntry[]>(load());

export function useActivityLog() {
  const sorted = computed(() => [...activities.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

  const recent = computed(() => sorted.value.slice(0, 50));

  function log(entry: Omit<ActivityEntry, 'id' | 'timestamp'>) {
    activities.value.unshift({
      ...entry,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    });
    if (activities.value.length > 500) activities.value = activities.value.slice(0, 500);
    save(activities.value);
  }

  function getByEntity(entityType: string, entityId?: string | number): ActivityEntry[] {
    return sorted.value.filter(a => a.entityType === entityType && (entityId === undefined || a.entityId === entityId));
  }

  function getByContact(contactId: string | number): ActivityEntry[] {
    return sorted.value.filter(a => (a.entityType === 'contact' && a.entityId === contactId) || (a.metadata as any)?.contactId === contactId);
  }

  function clearAll() {
    activities.value = [];
    save(activities.value);
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
    actionIcons,
    actionColors
  };
}
