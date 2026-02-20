import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ActivityType {
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
  TASK = 'TASK'
}

export enum ContactType {
  CLIENT = 'CLIENT',
  LEAD = 'LEAD',
  DEAL = 'DEAL'
}

export enum ActivityDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum CallOutcome {
  CONNECTED = 'CONNECTED',
  NO_ANSWER = 'NO_ANSWER',
  VOICEMAIL = 'VOICEMAIL',
  BUSY = 'BUSY',
  LEFT_MESSAGE = 'LEFT_MESSAGE'
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ActivityUser {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface CallLog {
  id: number;
  activityId: number;
  phoneNumber: string;
  duration: number;
  outcome: CallOutcome;
  recordingUrl?: string;
  notes?: string;
}

export interface CommunicationActivity {
  id: number;
  type: ActivityType;
  contactId: string;
  contactType: ContactType;
  userId: number;
  subject: string;
  body?: string;
  direction?: ActivityDirection;
  duration?: number;
  metadata?: Record<string, any>;
  tenantId?: string;
  user?: ActivityUser;
  callLog?: CallLog;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityStats {
  totalActivities: number;
  callsToday: number;
  emailsThisWeek: number;
  meetingsScheduled: number;
  notesCreated: number;
  tasksThisWeek: number;
  avgCallDuration: number;
  trend: number;
  byType: Record<string, number>;
}

export interface TimelinePagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// ─── Options for UI ───────────────────────────────────────────────────────────

export const activityTypeOptions = [
  { value: ActivityType.EMAIL, label: 'Email', icon: 'ph:envelope-bold', color: '#3b82f6' },
  { value: ActivityType.CALL, label: 'Call', icon: 'ph:phone-bold', color: '#10b981' },
  { value: ActivityType.NOTE, label: 'Note', icon: 'ph:notepad-bold', color: '#f59e0b' },
  { value: ActivityType.MEETING, label: 'Meeting', icon: 'ph:calendar-bold', color: '#8b5cf6' },
  { value: ActivityType.TASK, label: 'Task', icon: 'ph:check-circle-bold', color: '#ef4444' }
];

export const callOutcomeOptions = [
  { value: CallOutcome.CONNECTED, label: 'Connected', color: '#10b981' },
  { value: CallOutcome.NO_ANSWER, label: 'No Answer', color: '#f59e0b' },
  { value: CallOutcome.VOICEMAIL, label: 'Voicemail', color: '#6366f1' },
  { value: CallOutcome.BUSY, label: 'Busy', color: '#ef4444' },
  { value: CallOutcome.LEFT_MESSAGE, label: 'Left Message', color: '#8b5cf6' }
];

export const directionOptions = [
  { value: ActivityDirection.INBOUND, label: 'Inbound' },
  { value: ActivityDirection.OUTBOUND, label: 'Outbound' }
];

export const contactTypeOptions = [
  { value: ContactType.CLIENT, label: 'Client' },
  { value: ContactType.LEAD, label: 'Lead' },
  { value: ContactType.DEAL, label: 'Deal' }
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getActivityTypeOption(type: string) {
  return activityTypeOptions.find((o) => o.value === type) || activityTypeOptions[0];
}

export function getCallOutcomeOption(outcome: string) {
  return callOutcomeOptions.find((o) => o.value === outcome) || callOutcomeOptions[0];
}

export function formatCallDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useCommunication(contactId?: string, contactType?: string) {
  const activities = ref<CommunicationActivity[]>([]);
  const stats = ref<ActivityStats | null>(null);
  const loading = ref(false);
  const pagination = ref<TimelinePagination>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0
  });

  // Call timer state
  const callTimerRunning = ref(false);
  const callTimerSeconds = ref(0);
  let callTimerInterval: ReturnType<typeof setInterval> | null = null;

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages);

  // ─── Fetch Timeline ─────────────────────────────────────────────────────
  async function fetchTimeline(page: number = 1, append: boolean = false) {
    if (!contactId || !contactType) return;
    loading.value = true;
    try {
      const res = await useApiFetch(
        `communications/timeline/${contactType}/${contactId}?page=${page}&limit=${pagination.value.limit}`
      );
      if (res.success && res.body) {
        const data = res.body as any;
        if (append) {
          activities.value = [...activities.value, ...(data.docs || [])];
        } else {
          activities.value = data.docs || [];
        }
        if (data.pagination) {
          pagination.value = data.pagination;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  // ─── Load More ──────────────────────────────────────────────────────────
  async function loadMore() {
    if (hasMore.value && !loading.value) {
      await fetchTimeline(pagination.value.page + 1, true);
    }
  }

  // ─── Log Activity ──────────────────────────────────────────────────────
  async function logActivity(data: {
    type: ActivityType;
    contactId: string;
    contactType: ContactType;
    subject: string;
    body?: string;
    direction?: ActivityDirection;
    duration?: number;
    metadata?: Record<string, any>;
  }) {
    loading.value = true;
    try {
      const res = await useApiFetch('communications/activities', 'POST', data);
      if (res.success && res.body) {
        // Prepend new activity to the top of the list
        activities.value = [res.body as CommunicationActivity, ...activities.value];
        pagination.value.totalItems += 1;
      }
      return res;
    } finally {
      loading.value = false;
    }
  }

  // ─── Log Call ───────────────────────────────────────────────────────────
  async function logCall(data: {
    contactId: string;
    contactType: ContactType;
    subject: string;
    body?: string;
    direction?: ActivityDirection;
    phoneNumber: string;
    duration: number;
    outcome: CallOutcome;
    recordingUrl?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }) {
    loading.value = true;
    try {
      const res = await useApiFetch('communications/calls', 'POST', data);
      if (res.success && res.body) {
        const result = res.body as any;
        // Prepend the call activity to the list
        if (result.activity) {
          activities.value = [result.activity, ...activities.value];
          pagination.value.totalItems += 1;
        }
      }
      return res;
    } finally {
      loading.value = false;
    }
  }

  // ─── Update Activity ────────────────────────────────────────────────────
  async function updateActivity(
    id: number,
    data: { subject?: string; body?: string; direction?: string; duration?: number }
  ) {
    loading.value = true;
    try {
      const res = await useApiFetch(`communications/activities/${id}`, 'PUT', data);
      if (res.success && res.body) {
        const updated = res.body as CommunicationActivity;
        const idx = activities.value.findIndex((a) => a.id === id);
        if (idx !== -1) {
          activities.value[idx] = updated;
        }
      }
      return res;
    } finally {
      loading.value = false;
    }
  }

  // ─── Delete Activity ────────────────────────────────────────────────────
  async function deleteActivity(id: number) {
    loading.value = true;
    try {
      const res = await useApiFetch(`communications/activities/${id}`, 'DELETE');
      if (res.success) {
        activities.value = activities.value.filter((a) => a.id !== id);
        pagination.value.totalItems -= 1;
      }
      return res;
    } finally {
      loading.value = false;
    }
  }

  // ─── Fetch Stats ────────────────────────────────────────────────────────
  async function fetchStats(dateRange?: { start: string; end: string }) {
    loading.value = true;
    try {
      let url = 'communications/stats';
      if (dateRange) {
        url += `?start=${dateRange.start}&end=${dateRange.end}`;
      }
      const res = await useApiFetch(url);
      if (res.success && res.body) {
        stats.value = res.body as ActivityStats;
      }
      return res;
    } finally {
      loading.value = false;
    }
  }

  // ─── Fetch Recent ──────────────────────────────────────────────────────
  async function fetchRecent(limit: number = 20) {
    loading.value = true;
    try {
      const res = await useApiFetch(`communications/recent?limit=${limit}`);
      if (res.success && res.body) {
        activities.value = (res.body as CommunicationActivity[]) || [];
      }
      return res;
    } finally {
      loading.value = false;
    }
  }

  // ─── Call Timer ─────────────────────────────────────────────────────────
  function startCallTimer() {
    if (callTimerRunning.value) return;
    callTimerSeconds.value = 0;
    callTimerRunning.value = true;
    callTimerInterval = setInterval(() => {
      callTimerSeconds.value += 1;
    }, 1000);
  }

  function stopCallTimer(): number {
    callTimerRunning.value = false;
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }
    return callTimerSeconds.value;
  }

  function resetCallTimer() {
    stopCallTimer();
    callTimerSeconds.value = 0;
  }

  return {
    // State
    activities,
    stats,
    loading,
    pagination,
    hasMore,
    callTimerRunning,
    callTimerSeconds,

    // Methods
    fetchTimeline,
    loadMore,
    logActivity,
    logCall,
    updateActivity,
    deleteActivity,
    fetchStats,
    fetchRecent,
    startCallTimer,
    stopCallTimer,
    resetCallTimer
  };
}
