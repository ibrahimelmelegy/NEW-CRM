/**
 * Reminders & Follow-up System — API-backed via Calendar Events
 * Manage scheduled reminders with auto-notification triggers.
 */

import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface Reminder {
  id: string | number;
  title: string;
  description: string;
  type: 'follow_up' | 'payment' | 'deadline' | 'meeting' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  relatedTo?: { type: string; id: string | number; label: string };
  createdAt: string;
}

const reminders = ref<Reminder[]>([]);
const loading = ref(false);

export function useReminders() {
  const upcoming = computed(() =>
    reminders.value.filter(r => !r.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  );

  const overdue = computed(() => {
    const now = new Date().toISOString();
    return upcoming.value.filter(r => r.dueDate < now);
  });

  const today = computed(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return upcoming.value.filter(r => r.dueDate.startsWith(todayStr));
  });

  const completed = computed(() =>
    reminders.value
      .filter(r => r.completed)
      .sort((a, b) => new Date(b.completedAt || b.dueDate).getTime() - new Date(a.completedAt || a.dueDate).getTime())
  );

  const stats = computed(() => ({
    total: reminders.value.length,
    pending: upcoming.value.length,
    overdue: overdue.value.length,
    todayCount: today.value.length,
    completedCount: completed.value.length,
    urgentCount: upcoming.value.filter(r => r.priority === 'urgent').length
  }));

  async function fetchReminders() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('calendar?eventType=REMINDER&limit=200');
      if (success && body) {
        const data = body as any;
        const docs = data.docs || data || [];
        reminders.value = docs.map((e: any) => ({
          id: e.id,
          title: e.title || '',
          description: e.description || '',
          type:
            e.color === '#ef4444'
              ? 'payment'
              : e.color === '#f59e0b'
                ? 'deadline'
                : e.color === '#7c3aed'
                  ? 'meeting'
                  : e.color === '#3b82f6'
                    ? 'follow_up'
                    : 'custom',
          priority: e.recurrence === 'urgent' ? 'urgent' : e.recurrence === 'high' ? 'high' : e.recurrence === 'low' ? 'low' : 'medium',
          dueDate: e.startDate || e.createdAt,
          completed: e.endDate && new Date(e.endDate) < new Date(e.startDate),
          completedAt: e.endDate && new Date(e.endDate) < new Date(e.startDate) ? e.endDate : undefined,
          relatedTo: e.location ? { type: 'custom', id: '', label: e.location } : undefined,
          createdAt: e.createdAt
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  const typeColorMap: Record<string, string> = {
    follow_up: '#3b82f6',
    payment: '#ef4444',
    deadline: '#f59e0b',
    meeting: '#7c3aed',
    custom: '#6b7280'
  };

  async function addReminder(data: Omit<Reminder, 'id' | 'completed' | 'createdAt'>): Promise<Reminder | null> {
    const { body, success } = await useApiFetch('calendar', 'POST', {
      title: data.title,
      description: data.description,
      startDate: data.dueDate,
      endDate: data.dueDate,
      allDay: true,
      eventType: 'REMINDER',
      color: typeColorMap[data.type] || '#6b7280',
      recurrence: data.priority,
      location: data.relatedTo?.label || ''
    });
    if (success) {
      await fetchReminders();
      return reminders.value[0] || null;
    }
    return null;
  }

  async function completeReminder(id: string | number) {
    const r = reminders.value.find(x => x.id === id);
    if (r) {
      r.completed = true;
      r.completedAt = new Date().toISOString();
      if (typeof id === 'number') {
        // Mark as completed by setting endDate before startDate
        await useApiFetch(`calendar/${id}`, 'PUT', {
          endDate: new Date(0).toISOString(),
          description: `[COMPLETED] ${r.description}`
        });
      }
    }
  }

  async function removeReminder(id: string | number) {
    reminders.value = reminders.value.filter(r => r.id !== id);
    if (typeof id === 'number') {
      await useApiFetch(`calendar/${id}`, 'DELETE');
    }
  }

  async function updateReminder(id: string | number, updates: Partial<Reminder>) {
    const r = reminders.value.find(x => x.id === id);
    if (r) {
      Object.assign(r, updates);
      if (typeof id === 'number') {
        const payload: Record<string, any> = {};
        if (updates.title) payload.title = updates.title;
        if (updates.description) payload.description = updates.description;
        if (updates.dueDate) {
          payload.startDate = updates.dueDate;
          payload.endDate = updates.dueDate;
        }
        if (updates.type) payload.color = typeColorMap[updates.type] || '#6b7280';
        if (updates.priority) payload.recurrence = updates.priority;
        await useApiFetch(`calendar/${id}`, 'PUT', payload);
      }
    }
  }

  return {
    reminders,
    upcoming,
    overdue,
    today,
    completed,
    stats,
    addReminder,
    completeReminder,
    removeReminder,
    updateReminder,
    fetchReminders,
    loading
  };
}
