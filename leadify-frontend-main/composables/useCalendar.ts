export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color?: string;
  eventType: string;
  location?: string;
  recurrence?: string;
  userId: number;
  user?: { id: number; name: string; profilePicture?: string };
}

export const EVENT_TYPES = [
  { value: 'MEETING', label: 'Meeting', color: '#7849ff' },
  { value: 'CALL', label: 'Call', color: '#22c55e' },
  { value: 'TASK', label: 'Task', color: '#f97316' },
  { value: 'REMINDER', label: 'Reminder', color: '#ef4444' },
  { value: 'OTHER', label: 'Other', color: '#6b7280' }
];

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
