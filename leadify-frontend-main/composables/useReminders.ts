/**
 * Reminders & Follow-up System
 * Manage scheduled reminders with auto-notification triggers.
 */

import { ref, computed } from 'vue';

export interface Reminder {
  id: string;
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

const STORAGE_KEY = 'crm_reminders';

function load(): Reminder[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function save(items: Reminder[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const reminders = ref<Reminder[]>(load());

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

  function addReminder(data: Omit<Reminder, 'id' | 'completed' | 'createdAt'>): Reminder {
    const reminder: Reminder = {
      ...data,
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      createdAt: new Date().toISOString()
    };
    reminders.value.push(reminder);
    save(reminders.value);
    return reminder;
  }

  function completeReminder(id: string) {
    const r = reminders.value.find(x => x.id === id);
    if (r) {
      r.completed = true;
      r.completedAt = new Date().toISOString();
      save(reminders.value);
    }
  }

  function removeReminder(id: string) {
    reminders.value = reminders.value.filter(r => r.id !== id);
    save(reminders.value);
  }

  function updateReminder(id: string, updates: Partial<Reminder>) {
    const r = reminders.value.find(x => x.id === id);
    if (r) {
      Object.assign(r, updates);
      save(reminders.value);
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
    updateReminder
  };
}
