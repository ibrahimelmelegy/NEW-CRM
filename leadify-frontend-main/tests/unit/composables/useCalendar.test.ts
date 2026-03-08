/**
 * useCalendar - Unit Tests
 * =========================
 * Tests for composables/useCalendar.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EVENT_TYPES,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  getEventTypeColor,
  getEventTypeIcon,
  getCalendarPriorityColor,
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  fetchUpcomingEvents,
  fetchTodayAgenda,
  checkConflicts,
  fetchCalendarAnalytics,
  updateAttendeeRsvp,
  fetchEntityEvents,
  fetchSyncStatus,
  initiateGoogleAuth,
  initiateOutlookAuth,
  triggerSync,
  disconnectCalendarProvider,
  toggleCalendarAutoSync,
  pushEventToProvider,
  getProviderIcon,
  getProviderLabel,
  getProviderColor,
  formatSyncTime,
  type CalendarEvent,
  type _CalendarAttendee,
  type CalendarRecurrence,
  type CalendarSyncStatus,
  type SyncResult
} from '~/composables/useCalendar';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

describe('useCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Static Constants
  // ============================================
  describe('EVENT_TYPES', () => {
    it('should have 8 event types', () => {
      expect(EVENT_TYPES).toHaveLength(8);
    });

    it('should include MEETING type with color and icon', () => {
      const meeting = EVENT_TYPES.find(t => t.value === 'MEETING');
      expect(meeting).toBeDefined();
      expect(meeting?.label).toBe('Meeting');
      expect(meeting?.color).toBe('#7849ff');
      expect(meeting?.icon).toBe('ph:video-camera-bold');
    });

    it('should include CALL, TASK, REMINDER types', () => {
      const values = EVENT_TYPES.map(t => t.value);
      expect(values).toContain('CALL');
      expect(values).toContain('TASK');
      expect(values).toContain('REMINDER');
    });

    it('should include BOOKING, FOLLOW_UP, DEADLINE, OTHER', () => {
      const values = EVENT_TYPES.map(t => t.value);
      expect(values).toContain('BOOKING');
      expect(values).toContain('FOLLOW_UP');
      expect(values).toContain('DEADLINE');
      expect(values).toContain('OTHER');
    });

    it('should have color, icon, and label for each type', () => {
      EVENT_TYPES.forEach(t => {
        expect(t).toHaveProperty('value');
        expect(t).toHaveProperty('label');
        expect(t).toHaveProperty('color');
        expect(t).toHaveProperty('icon');
      });
    });
  });

  describe('PRIORITY_OPTIONS', () => {
    it('should have 4 priority options', () => {
      expect(PRIORITY_OPTIONS).toHaveLength(4);
    });

    it('should include LOW, MEDIUM, HIGH, URGENT', () => {
      const values = PRIORITY_OPTIONS.map(p => p.value);
      expect(values).toEqual(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
    });
  });

  describe('STATUS_OPTIONS', () => {
    it('should have 3 status options', () => {
      expect(STATUS_OPTIONS).toHaveLength(3);
    });

    it('should include SCHEDULED, COMPLETED, CANCELLED', () => {
      const values = STATUS_OPTIONS.map(s => s.value);
      expect(values).toEqual(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
    });
  });

  // ============================================
  // Helper Functions
  // ============================================
  describe('getEventTypeColor', () => {
    it('should return correct color for MEETING', () => {
      expect(getEventTypeColor('MEETING')).toBe('#7849ff');
    });

    it('should return correct color for CALL', () => {
      expect(getEventTypeColor('CALL')).toBe('#22c55e');
    });

    it('should return default grey for unknown type', () => {
      expect(getEventTypeColor('UNKNOWN')).toBe('#6b7280');
    });
  });

  describe('getEventTypeIcon', () => {
    it('should return correct icon for MEETING', () => {
      expect(getEventTypeIcon('MEETING')).toBe('ph:video-camera-bold');
    });

    it('should return correct icon for TASK', () => {
      expect(getEventTypeIcon('TASK')).toBe('ph:check-square-bold');
    });

    it('should return default icon for unknown type', () => {
      expect(getEventTypeIcon('UNKNOWN')).toBe('ph:dots-three-bold');
    });
  });

  describe('getCalendarPriorityColor', () => {
    it('should return correct color for HIGH', () => {
      expect(getCalendarPriorityColor('HIGH')).toBe('#f59e0b');
    });

    it('should return correct color for URGENT', () => {
      expect(getCalendarPriorityColor('URGENT')).toBe('#ef4444');
    });

    it('should return default grey for unknown priority', () => {
      expect(getCalendarPriorityColor('UNKNOWN')).toBe('#6b7280');
    });
  });

  // ============================================
  // Provider Helpers
  // ============================================
  describe('getProviderIcon', () => {
    it('should return Google Calendar icon', () => {
      expect(getProviderIcon('google')).toBe('logos:google-calendar');
    });

    it('should return Outlook icon', () => {
      expect(getProviderIcon('outlook')).toBe('logos:microsoft-icon');
    });

    it('should return default calendar icon', () => {
      expect(getProviderIcon('other')).toBe('ph:calendar-bold');
    });
  });

  describe('getProviderLabel', () => {
    it('should return Google Calendar label', () => {
      expect(getProviderLabel('google')).toBe('Google Calendar');
    });

    it('should return Outlook Calendar label', () => {
      expect(getProviderLabel('outlook')).toBe('Outlook Calendar');
    });

    it('should return Calendar for unknown provider', () => {
      expect(getProviderLabel('other')).toBe('Calendar');
    });
  });

  describe('getProviderColor', () => {
    it('should return Google color', () => {
      expect(getProviderColor('google')).toBe('#4285F4');
    });

    it('should return Outlook color', () => {
      expect(getProviderColor('outlook')).toBe('#0078D4');
    });

    it('should return default grey for unknown', () => {
      expect(getProviderColor('other')).toBe('#6b7280');
    });
  });

  describe('formatSyncTime', () => {
    it('should return "Never" for null', () => {
      expect(formatSyncTime(null)).toBe('Never');
    });

    it('should return "Just now" for recent timestamp', () => {
      const now = new Date().toISOString();
      expect(formatSyncTime(now)).toBe('Just now');
    });

    it('should return minutes ago for recent past', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(formatSyncTime(fiveMinAgo)).toBe('5m ago');
    });

    it('should return hours ago for same-day past', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(formatSyncTime(threeHoursAgo)).toBe('3h ago');
    });

    it('should return formatted date for older timestamps', () => {
      const oldDate = new Date(Date.now() - 48 * 3600000).toISOString();
      const result = formatSyncTime(oldDate);
      // Should be a formatted date string, not "Xh ago"
      expect(result).not.toContain('h ago');
      expect(result).not.toBe('Never');
    });
  });

  // ============================================
  // Event API Functions
  // ============================================
  describe('fetchCalendarEvents', () => {
    it('should fetch events without params', async () => {
      const events: CalendarEvent[] = [
        {
          id: 1,
          title: 'Team Meeting',
          startDate: '2024-01-15',
          endDate: '2024-01-15',
          allDay: false,
          eventType: 'MEETING',
          priority: 'MEDIUM',
          isPrivate: false,
          status: 'SCHEDULED',
          userId: 1
        }
      ];
      mockApiFetch.mockResolvedValue({ body: events, success: true });

      const result = await fetchCalendarEvents();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar');
      expect(result).toEqual(events);
    });

    it('should include query params', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchCalendarEvents({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('startDate=2024-01-01'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('endDate=2024-01-31'));
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCalendarEvents();

      expect(result).toEqual([]);
    });
  });

  describe('createCalendarEvent', () => {
    it('should POST event data', async () => {
      const eventData = { title: 'New Meeting', startDate: '2024-02-01', endDate: '2024-02-01' };
      mockApiFetch.mockResolvedValue({ success: true, body: { id: 1, ...eventData } });

      await createCalendarEvent(eventData);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar', 'POST', eventData);
    });
  });

  describe('updateCalendarEvent', () => {
    it('should PUT event data with id', async () => {
      const updates = { title: 'Updated Meeting' };
      mockApiFetch.mockResolvedValue({ success: true });

      await updateCalendarEvent(1, updates);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/1', 'PUT', updates);
    });
  });

  describe('deleteCalendarEvent', () => {
    it('should DELETE event by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteCalendarEvent(1);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/1', 'DELETE');
    });
  });

  describe('fetchUpcomingEvents', () => {
    it('should fetch upcoming events without limit', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchUpcomingEvents();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/upcoming');
    });

    it('should fetch upcoming events with limit', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchUpcomingEvents(5);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/upcoming?limit=5');
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchUpcomingEvents();

      expect(result).toEqual([]);
    });
  });

  describe('fetchTodayAgenda', () => {
    it('should fetch today events', async () => {
      const todayEvents = [{ id: 1, title: 'Morning standup' }];
      mockApiFetch.mockResolvedValue({ body: todayEvents, success: true });

      const result = await fetchTodayAgenda();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/today');
      expect(result).toEqual(todayEvents);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTodayAgenda();

      expect(result).toEqual([]);
    });
  });

  describe('checkConflicts', () => {
    it('should check for conflicts', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await checkConflicts('2024-01-15T09:00', '2024-01-15T10:00');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('calendar/conflicts'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('startDate='));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('endDate='));
    });

    it('should include excludeId when provided', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await checkConflicts('2024-01-15T09:00', '2024-01-15T10:00', 5);

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('excludeId=5'));
    });
  });

  describe('fetchCalendarAnalytics', () => {
    it('should fetch analytics without date range', async () => {
      const analytics = { totalEvents: 50, completedEvents: 30 };
      mockApiFetch.mockResolvedValue({ body: analytics, success: true });

      const result = await fetchCalendarAnalytics();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/analytics');
      expect(result).toEqual(analytics);
    });

    it('should fetch analytics with date range', async () => {
      mockApiFetch.mockResolvedValue({ body: {}, success: true });

      await fetchCalendarAnalytics('2024-01-01', '2024-01-31');

      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('startDate=2024-01-01'));
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('endDate=2024-01-31'));
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCalendarAnalytics();

      expect(result).toBeNull();
    });
  });

  describe('updateAttendeeRsvp', () => {
    it('should update RSVP status to ACCEPTED', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateAttendeeRsvp(1, 'ACCEPTED');

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/1/attendee', 'PUT', { status: 'ACCEPTED' });
    });

    it('should update RSVP status to DECLINED', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateAttendeeRsvp(1, 'DECLINED');

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/1/attendee', 'PUT', { status: 'DECLINED' });
    });
  });

  describe('fetchEntityEvents', () => {
    it('should fetch events by entity type and id', async () => {
      const events = [{ id: 1, title: 'Deal Meeting' }];
      mockApiFetch.mockResolvedValue({ body: events, success: true });

      const result = await fetchEntityEvents('DEAL', '123');

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/entity/DEAL/123');
      expect(result).toEqual(events);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEntityEvents('LEAD', '456');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // Sync API Functions
  // ============================================
  describe('fetchSyncStatus', () => {
    it('should return sync status', async () => {
      const status: CalendarSyncStatus = {
        google: {
          connected: true,
          email: 'test@gmail.com',
          lastSyncAt: '2024-01-15',
          syncStatus: 'synced',
          autoSync: true,
          syncedEventsCount: 50,
          lastError: null
        },
        outlook: {
          connected: false,
          email: null,
          lastSyncAt: null,
          syncStatus: 'disconnected',
          autoSync: false,
          syncedEventsCount: 0,
          lastError: null
        },
        googleConfigured: true,
        outlookConfigured: false
      };
      mockApiFetch.mockResolvedValue({ body: status, success: true });

      const result = await fetchSyncStatus();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/status');
      expect(result).toEqual(status);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchSyncStatus();

      expect(result).toBeNull();
    });
  });

  describe('initiateGoogleAuth', () => {
    it('should return auth URL', async () => {
      mockApiFetch.mockResolvedValue({ body: { url: 'https://google.com/auth' }, success: true });

      const result = await initiateGoogleAuth();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/google/auth');
      expect(result).toEqual({ url: 'https://google.com/auth' });
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await initiateGoogleAuth();

      expect(result).toBeNull();
    });
  });

  describe('initiateOutlookAuth', () => {
    it('should return auth URL', async () => {
      mockApiFetch.mockResolvedValue({ body: { url: 'https://outlook.com/auth' }, success: true });

      const result = await initiateOutlookAuth();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/outlook/auth');
      expect(result).toEqual({ url: 'https://outlook.com/auth' });
    });
  });

  describe('triggerSync', () => {
    it('should trigger sync without provider', async () => {
      const syncResult: SyncResult = { created: 5, updated: 2, deleted: 1, errors: [] };
      mockApiFetch.mockResolvedValue({ body: syncResult, success: true });

      const result = await triggerSync();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/now', 'POST', {});
      expect(result).toEqual(syncResult);
    });

    it('should trigger sync for specific provider', async () => {
      mockApiFetch.mockResolvedValue({ body: { created: 3, updated: 0, deleted: 0, errors: [] }, success: true });

      await triggerSync('google');

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/now', 'POST', { provider: 'google' });
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await triggerSync();

      expect(result).toBeNull();
    });
  });

  describe('disconnectCalendarProvider', () => {
    it('should disconnect google', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await disconnectCalendarProvider('google');

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/google/disconnect', 'POST');
    });

    it('should disconnect outlook', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await disconnectCalendarProvider('outlook');

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/outlook/disconnect', 'POST');
    });
  });

  describe('toggleCalendarAutoSync', () => {
    it('should enable auto sync', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await toggleCalendarAutoSync('google', true);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/google/auto-sync', 'PUT', { enabled: true });
    });

    it('should disable auto sync', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await toggleCalendarAutoSync('outlook', false);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/outlook/auto-sync', 'PUT', { enabled: false });
    });
  });

  describe('pushEventToProvider', () => {
    it('should push event to google', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await pushEventToProvider('google', 1);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/sync/google/push', 'POST', { eventId: 1 });
    });
  });

  // ============================================
  // Interface Type Checks
  // ============================================
  describe('CalendarEvent interface', () => {
    it('should create valid CalendarEvent object', () => {
      const event: CalendarEvent = {
        id: 1,
        title: 'Team Standup',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        startTime: '09:00',
        endTime: '09:30',
        allDay: false,
        eventType: 'MEETING',
        priority: 'MEDIUM',
        isPrivate: false,
        status: 'SCHEDULED',
        userId: 1,
        attendees: [{ name: 'John', status: 'ACCEPTED' }]
      };

      expect(event.id).toBe(1);
      expect(event.title).toBe('Team Standup');
      expect(event.attendees).toHaveLength(1);
    });
  });

  describe('CalendarRecurrence interface', () => {
    it('should create valid recurrence', () => {
      const recurrence: CalendarRecurrence = {
        pattern: 'WEEKLY',
        interval: 1,
        daysOfWeek: [1, 3, 5]
      };

      expect(recurrence.pattern).toBe('WEEKLY');
      expect(recurrence.interval).toBe(1);
      expect(recurrence.daysOfWeek).toEqual([1, 3, 5]);
    });
  });
});
