/**
 * useCommunication - Unit Tests
 * ==============================
 * Tests for composables/useCommunication.ts
 *
 * The composable provides:
 * - fetchTimeline, loadMore
 * - logActivity, logCall
 * - updateActivity, deleteActivity
 * - fetchStats, fetchRecent
 * - startCallTimer, stopCallTimer, resetCallTimer
 * - Helper functions: getActivityTypeOption, getCallOutcomeOption, formatCallDuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useCommunication,
  ActivityType,
  ContactType,
  ActivityDirection,
  CallOutcome,
  getActivityTypeOption,
  getCallOutcomeOption,
  formatCallDuration,
  activityTypeOptions,
  callOutcomeOptions
} from '@/composables/useCommunication';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useCommunication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================
  // fetchTimeline
  // ============================================
  describe('fetchTimeline', () => {
    it('should not fetch if contactId or contactType is not provided', async () => {
      const { fetchTimeline } = useCommunication();
      await fetchTimeline();

      expect(mockUseApiFetch).not.toHaveBeenCalled();
    });

    it('should fetch timeline activities for a contact', async () => {
      const mockData = {
        docs: [
          {
            id: 1,
            type: ActivityType.EMAIL,
            contactId: '10',
            contactType: ContactType.LEAD,
            subject: 'Hello',
            userId: 1,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          }
        ],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 }
      };
      mockUseApiFetch.mockResolvedValue({ body: mockData, success: true });

      const { fetchTimeline, activities } = useCommunication('10', 'LEAD');
      await fetchTimeline();

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/timeline/LEAD/10?page=1&limit=20');
      expect(activities.value).toHaveLength(1);
    });

    it('should append activities when append flag is true', async () => {
      const existingActivity = {
        id: 1,
        type: ActivityType.CALL,
        contactId: '10',
        contactType: ContactType.LEAD,
        subject: 'Call 1',
        userId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      const newActivity = {
        id: 2,
        type: ActivityType.EMAIL,
        contactId: '10',
        contactType: ContactType.LEAD,
        subject: 'Email 1',
        userId: 1,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      };

      mockUseApiFetch.mockResolvedValue({
        body: { docs: [newActivity], pagination: { page: 2, limit: 20, totalItems: 2, totalPages: 2 } },
        success: true
      });

      const { fetchTimeline, activities } = useCommunication('10', 'LEAD');
      activities.value = [existingActivity];
      await fetchTimeline(2, true);

      expect(activities.value).toHaveLength(2);
    });

    it('should manage loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockUseApiFetch.mockReturnValueOnce(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      const { fetchTimeline, loading } = useCommunication('10', 'LEAD');

      expect(loading.value).toBe(false);
      const promise = fetchTimeline();
      expect(loading.value).toBe(true);

      resolvePromise!({ body: { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } }, success: true });
      await promise;
      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // logActivity
  // ============================================
  describe('logActivity', () => {
    it('should post activity and prepend to list', async () => {
      const newActivity = {
        id: 10,
        type: ActivityType.NOTE,
        contactId: '5',
        contactType: ContactType.CLIENT,
        subject: 'Spoke with client',
        userId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      mockUseApiFetch.mockResolvedValue({ body: newActivity, success: true });

      const { logActivity, activities } = useCommunication('5', 'CLIENT');
      await logActivity({
        type: ActivityType.NOTE,
        contactId: '5',
        contactType: ContactType.CLIENT,
        subject: 'Spoke with client'
      });

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/activities', 'POST', expect.any(Object));
      expect(activities.value[0]).toEqual(newActivity);
    });

    it('should increment total items count on success', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: {
          id: 1,
          type: ActivityType.EMAIL,
          contactId: '1',
          contactType: ContactType.LEAD,
          subject: 'Test',
          userId: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        success: true
      });

      const { logActivity, pagination } = useCommunication('1', 'LEAD');
      pagination.value.totalItems = 5;
      await logActivity({ type: ActivityType.EMAIL, contactId: '1', contactType: ContactType.LEAD, subject: 'Test' });

      expect(pagination.value.totalItems).toBe(6);
    });
  });

  // ============================================
  // deleteActivity
  // ============================================
  describe('deleteActivity', () => {
    it('should remove activity from list on success', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      const { deleteActivity, activities, pagination } = useCommunication('5', 'CLIENT');
      activities.value = [
        {
          id: 1,
          type: ActivityType.EMAIL,
          contactId: '5',
          contactType: ContactType.CLIENT,
          subject: 'Test',
          userId: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        {
          id: 2,
          type: ActivityType.CALL,
          contactId: '5',
          contactType: ContactType.CLIENT,
          subject: 'Call',
          userId: 1,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02'
        }
      ];
      pagination.value.totalItems = 2;

      await deleteActivity(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/activities/1', 'DELETE');
      expect(activities.value).toHaveLength(1);
      expect(activities.value[0]?.id).toBe(2);
      expect(pagination.value.totalItems).toBe(1);
    });

    it('should not remove from list if API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ success: false, body: null });

      const { deleteActivity, activities } = useCommunication('5', 'CLIENT');
      activities.value = [
        {
          id: 1,
          type: ActivityType.EMAIL,
          contactId: '5',
          contactType: ContactType.CLIENT,
          subject: 'Test',
          userId: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];

      await deleteActivity(1);

      expect(activities.value).toHaveLength(1);
    });
  });

  // ============================================
  // fetchStats
  // ============================================
  describe('fetchStats', () => {
    it('should fetch stats without date range', async () => {
      const mockStats = {
        totalActivities: 100,
        callsToday: 5,
        emailsThisWeek: 20,
        meetingsScheduled: 3,
        notesCreated: 15,
        tasksThisWeek: 8,
        avgCallDuration: 180,
        trend: 12,
        byType: {}
      };
      mockUseApiFetch.mockResolvedValue({ body: mockStats, success: true });

      const { fetchStats, stats } = useCommunication();
      await fetchStats();

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/stats');
      expect(stats.value).toEqual(mockStats);
    });

    it('should include date range in URL', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const { fetchStats } = useCommunication();
      await fetchStats({ start: '2024-01-01', end: '2024-01-31' });

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/stats?start=2024-01-01&end=2024-01-31');
    });
  });

  // ============================================
  // fetchRecent
  // ============================================
  describe('fetchRecent', () => {
    it('should fetch recent activities with default limit', async () => {
      const mockActivities = [
        {
          id: 1,
          type: ActivityType.EMAIL,
          contactId: '1',
          contactType: ContactType.LEAD,
          subject: 'Recent',
          userId: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockActivities, success: true });

      const { fetchRecent, activities } = useCommunication();
      await fetchRecent();

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/recent?limit=20');
      expect(activities.value).toHaveLength(1);
    });

    it('should use custom limit', async () => {
      mockUseApiFetch.mockResolvedValue({ body: [], success: true });

      const { fetchRecent } = useCommunication();
      await fetchRecent(50);

      expect(mockUseApiFetch).toHaveBeenCalledWith('communications/recent?limit=50');
    });
  });

  // ============================================
  // Call Timer
  // ============================================
  describe('call timer', () => {
    it('should start the timer and increment seconds', () => {
      const { startCallTimer, callTimerSeconds, callTimerRunning } = useCommunication();

      startCallTimer();
      expect(callTimerRunning.value).toBe(true);
      expect(callTimerSeconds.value).toBe(0);

      vi.advanceTimersByTime(3000);
      expect(callTimerSeconds.value).toBe(3);
    });

    it('should stop the timer and return elapsed seconds', () => {
      const { startCallTimer, stopCallTimer, callTimerRunning } = useCommunication();

      startCallTimer();
      vi.advanceTimersByTime(5000);
      const duration = stopCallTimer();

      expect(duration).toBe(5);
      expect(callTimerRunning.value).toBe(false);
    });

    it('should not start if already running', () => {
      const { startCallTimer, callTimerSeconds } = useCommunication();

      startCallTimer();
      vi.advanceTimersByTime(2000);
      startCallTimer(); // Should not reset
      vi.advanceTimersByTime(2000);

      expect(callTimerSeconds.value).toBe(4);
    });

    it('should reset timer to zero', () => {
      const { startCallTimer, resetCallTimer, callTimerSeconds, callTimerRunning } = useCommunication();

      startCallTimer();
      vi.advanceTimersByTime(3000);
      resetCallTimer();

      expect(callTimerSeconds.value).toBe(0);
      expect(callTimerRunning.value).toBe(false);
    });
  });

  // ============================================
  // Helper functions
  // ============================================
  describe('formatCallDuration', () => {
    it('should format seconds into m:ss', () => {
      expect(formatCallDuration(90)).toBe('1:30');
      expect(formatCallDuration(60)).toBe('1:00');
      expect(formatCallDuration(5)).toBe('0:05');
    });

    it('should return 0:00 for zero or negative', () => {
      expect(formatCallDuration(0)).toBe('0:00');
      expect(formatCallDuration(-5)).toBe('0:00');
    });
  });

  describe('getActivityTypeOption', () => {
    it('should return the correct option for a valid type', () => {
      const opt = getActivityTypeOption(ActivityType.EMAIL);
      expect(opt?.value).toBe(ActivityType.EMAIL);
      expect(opt?.label).toBe('Email');
    });

    it('should return the first option for unknown type', () => {
      const opt = getActivityTypeOption('UNKNOWN');
      expect(opt).toEqual(activityTypeOptions[0]);
    });
  });

  describe('getCallOutcomeOption', () => {
    it('should return the correct option for a valid outcome', () => {
      const opt = getCallOutcomeOption(CallOutcome.CONNECTED);
      expect(opt?.value).toBe(CallOutcome.CONNECTED);
      expect(opt?.label).toBe('Connected');
    });

    it('should return the first option for unknown outcome', () => {
      const opt = getCallOutcomeOption('UNKNOWN');
      expect(opt).toEqual(callOutcomeOptions[0]);
    });
  });

  // ============================================
  // hasMore computed
  // ============================================
  describe('hasMore', () => {
    it('should be true when there are more pages', () => {
      const { hasMore, pagination } = useCommunication();
      pagination.value.page = 1;
      pagination.value.totalPages = 3;

      expect(hasMore.value).toBe(true);
    });

    it('should be false on the last page', () => {
      const { hasMore, pagination } = useCommunication();
      pagination.value.page = 3;
      pagination.value.totalPages = 3;

      expect(hasMore.value).toBe(false);
    });
  });
});
