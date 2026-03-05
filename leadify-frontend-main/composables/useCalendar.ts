/* eslint-disable require-await */
export interface CalendarAttendee {
  userId?: number;
  name: string;
  email?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface CalendarRecurrence {
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  color?: string;
  eventType: string;
  priority: string;
  location?: string;
  meetingLink?: string;
  attendees?: CalendarAttendee[];
  recurrence?: CalendarRecurrence | null;
  isPrivate: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  reminder?: number;
  reminders?: Array<{ minutes: number; type: string }>;
  status: string;
  userId: number;
  user?: { id: number; name: string; profilePicture?: string };
  externalId?: string;
  externalProvider?: 'google' | 'outlook' | null;
  lastSyncedAt?: string;
}

export interface CalendarSyncStatus {
  google: {
    connected: boolean;
    email: string | null;
    lastSyncAt: string | null;
    syncStatus: string;
    autoSync: boolean;
    syncedEventsCount: number;
    lastError: string | null;
  };
  outlook: {
    connected: boolean;
    email: string | null;
    lastSyncAt: string | null;
    syncStatus: string;
    autoSync: boolean;
    syncedEventsCount: number;
    lastError: string | null;
  };
  googleConfigured: boolean;
  outlookConfigured: boolean;
}

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export const EVENT_TYPES = [
  { value: 'MEETING', label: 'Meeting', color: '#7849ff', icon: 'ph:video-camera-bold' },
  { value: 'CALL', label: 'Call', color: '#22c55e', icon: 'ph:phone-bold' },
  { value: 'TASK', label: 'Task', color: '#f97316', icon: 'ph:check-square-bold' },
  { value: 'REMINDER', label: 'Reminder', color: '#ef4444', icon: 'ph:bell-bold' },
  { value: 'BOOKING', label: 'Booking', color: '#14b8a6', icon: 'ph:calendar-check-bold' },
  { value: 'FOLLOW_UP', label: 'Follow-up', color: '#8b5cf6', icon: 'ph:arrow-bend-up-right-bold' },
  { value: 'DEADLINE', label: 'Deadline', color: '#dc2626', icon: 'ph:flag-bold' },
  { value: 'OTHER', label: 'Other', color: '#6b7280', icon: 'ph:dots-three-bold' }
];

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: '#6b7280' },
  { value: 'MEDIUM', label: 'Medium', color: '#3b82f6' },
  { value: 'HIGH', label: 'High', color: '#f59e0b' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444' }
];

export const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export function getEventTypeColor(eventType: string): string {
  return EVENT_TYPES.find(t => t.value === eventType)?.color || '#6b7280';
}

export function getEventTypeIcon(eventType: string): string {
  return EVENT_TYPES.find(t => t.value === eventType)?.icon || 'ph:dots-three-bold';
}

export function getCalendarPriorityColor(priority: string): string {
  return PRIORITY_OPTIONS.find(p => p.value === priority)?.color || '#6b7280';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function fetchCalendarEvents(params?: Record<string, string>): Promise<CalendarEvent[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`calendar${query}`);
  return success && body ? (body as CalendarEvent[]) : [];
}

export async function createCalendarEvent(data: unknown) {
  return useApiFetch('calendar', 'POST', data);
}

export async function updateCalendarEvent(id: number, data: unknown) {
  return useApiFetch(`calendar/${id}`, 'PUT', data);
}

export async function deleteCalendarEvent(id: number) {
  return useApiFetch(`calendar/${id}`, 'DELETE');
}

export async function fetchUpcomingEvents(limit?: number): Promise<CalendarEvent[]> {
  const query = limit ? `?limit=${limit}` : '';
  const { body, success } = await useApiFetch(`calendar/upcoming${query}`);
  return success && body ? (body as CalendarEvent[]) : [];
}

export async function fetchTodayAgenda(): Promise<CalendarEvent[]> {
  const { body, success } = await useApiFetch('calendar/today');
  return success && body ? (body as CalendarEvent[]) : [];
}

export async function checkConflicts(startDate: string, endDate: string, excludeId?: number) {
  const params = new URLSearchParams({ startDate, endDate });
  if (excludeId) params.set('excludeId', String(excludeId));
  const { body, success } = await useApiFetch(`calendar/conflicts?${params}`);
  return success && body ? (body as CalendarEvent[]) : [];
}

export async function fetchCalendarAnalytics(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  const { body, success } = await useApiFetch(`calendar/analytics${qs ? '?' + qs : ''}`);
  return success && body ? body : null;
}

export async function updateAttendeeRsvp(eventId: number, status: 'ACCEPTED' | 'DECLINED') {
  return useApiFetch(`calendar/${eventId}/attendee`, 'PUT', { status });
}

export async function fetchEntityEvents(entityType: string, entityId: string): Promise<CalendarEvent[]> {
  const { body, success } = await useApiFetch(`calendar/entity/${entityType}/${entityId}`);
  return success && body ? (body as CalendarEvent[]) : [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function fetchSyncStatus(): Promise<CalendarSyncStatus | null> {
  const { body, success } = await useApiFetch('calendar/sync/status');
  return success && body ? (body as CalendarSyncStatus) : null;
}

export async function initiateGoogleAuth(): Promise<{ url: string; mock?: boolean } | null> {
  const { body, success } = await useApiFetch('calendar/sync/google/auth');
  return success && body ? (body as { url: string; mock?: boolean }) : null;
}

export async function initiateOutlookAuth(): Promise<{ url: string; mock?: boolean } | null> {
  const { body, success } = await useApiFetch('calendar/sync/outlook/auth');
  return success && body ? (body as { url: string; mock?: boolean }) : null;
}

export async function triggerSync(provider?: 'google' | 'outlook'): Promise<SyncResult | null> {
  const payload = provider ? { provider } : {};
  const { body, success } = await useApiFetch('calendar/sync/now', 'POST', payload);
  return success && body ? (body as SyncResult) : null;
}

export async function disconnectCalendarProvider(provider: 'google' | 'outlook') {
  return useApiFetch(`calendar/sync/${provider}/disconnect`, 'POST');
}

export async function toggleCalendarAutoSync(provider: 'google' | 'outlook', enabled: boolean) {
  return useApiFetch(`calendar/sync/${provider}/auto-sync`, 'PUT', { enabled });
}

export async function pushEventToProvider(provider: 'google' | 'outlook', eventId: number) {
  return useApiFetch(`calendar/sync/${provider}/push`, 'POST', { eventId });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function getProviderIcon(provider: string): string {
  if (provider === 'google') return 'logos:google-calendar';
  if (provider === 'outlook') return 'logos:microsoft-icon';
  return 'ph:calendar-bold';
}

export function getProviderLabel(provider: string): string {
  if (provider === 'google') return 'Google Calendar';
  if (provider === 'outlook') return 'Outlook Calendar';
  return 'Calendar';
}

export function getProviderColor(provider: string): string {
  if (provider === 'google') return '#4285F4';
  if (provider === 'outlook') return '#0078D4';
  return '#6b7280';
}

export function formatSyncTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
