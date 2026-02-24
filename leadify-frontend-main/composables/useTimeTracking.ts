export interface TimeEntry {
  id: string;
  userId: number;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  user?: { id: number; name: string; profilePicture?: string };
}

export async function startTimer(data: { entityType?: string; entityId?: string; entityName?: string; description?: string }) {
  return useApiFetch('time-tracking/start', 'POST', data as any);
}

export async function stopTimer() {
  return useApiFetch('time-tracking/stop', 'POST');
}

export async function getRunningTimer(): Promise<TimeEntry | null> {
  const { body, success } = await useApiFetch('time-tracking/running');
  if (success && body) return body as TimeEntry;
  return null;
}

export async function fetchTimeEntries(query: { startDate?: string; endDate?: string; entityType?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.entityType) params.set('entityType', query.entityType);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const { body, success } = await useApiFetch(`time-tracking/entries?${params.toString()}`);
  if (success && body) return body as { entries: TimeEntry[]; total: number; page: number; limit: number };
  return { entries: [], total: 0, page: 1, limit: 50 };
}

export async function createManualEntry(data: any) {
  return useApiFetch('time-tracking/entries', 'POST', data);
}

export async function updateTimeEntry(id: string, data: any) {
  return useApiFetch(`time-tracking/entries/${id}`, 'PUT', data);
}

export async function deleteTimeEntry(id: string) {
  return useApiFetch(`time-tracking/entries/${id}`, 'DELETE');
}

export async function getWeeklySummary(weekStart: string) {
  const { body, success } = await useApiFetch(`time-tracking/weekly?weekStart=${weekStart}`);
  if (success && body) return body as { entries: TimeEntry[]; dailyTotals: Record<string, number>; totalSeconds: number };
  return { entries: [], dailyTotals: {}, totalSeconds: 0 };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
