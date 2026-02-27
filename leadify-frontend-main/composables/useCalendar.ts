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
  status: string;
  userId: number;
  user?: { id: number; name: string; profilePicture?: string };
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

export async function fetchCalendarEvents(params?: Record<string, string>): Promise<CalendarEvent[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`calendar${query}`);
  return success && body ? (body as CalendarEvent[]) : [];
}

export async function createCalendarEvent(data: any) {
  return useApiFetch('calendar', 'POST', data);
}

export async function updateCalendarEvent(id: number, data: any) {
  return useApiFetch(`calendar/${id}`, 'PUT', data);
}

export async function deleteCalendarEvent(id: number) {
  return useApiFetch(`calendar/${id}`, 'DELETE');
}

export async function fetchUpcomingEvents(): Promise<CalendarEvent[]> {
  const { body, success } = await useApiFetch('calendar/upcoming');
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
