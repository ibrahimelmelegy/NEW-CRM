/**
 * useReminders - Unit Tests
 * ==========================
 * Tests for composables/useReminders.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReminders, type Reminder } from '~/composables/useReminders';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

describe('useReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear reminders state between tests
    const { reminders } = useReminders();
    reminders.value = [];
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should start with empty reminders', () => {
      const { reminders, stats } = useReminders();

      expect(reminders.value).toEqual([]);
      expect(stats.value.total).toBe(0);
    });

    it('should have loading as false initially', () => {
      const { loading } = useReminders();

      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // Computed Properties
  // ============================================
  describe('computed: upcoming', () => {
    it('should return non-completed reminders sorted by dueDate', () => {
      const { reminders, upcoming } = useReminders();

      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

      reminders.value = [
        {
          id: 1,
          title: 'Later',
          description: '',
          type: 'follow_up',
          priority: 'medium',
          dueDate: nextWeek,
          completed: false,
          createdAt: '2024-01-01'
        },
        { id: 2, title: 'Sooner', description: '', type: 'payment', priority: 'high', dueDate: tomorrow, completed: false, createdAt: '2024-01-01' },
        { id: 3, title: 'Done', description: '', type: 'deadline', priority: 'low', dueDate: tomorrow, completed: true, createdAt: '2024-01-01' }
      ];

      expect(upcoming.value).toHaveLength(2);
      expect(upcoming.value[0].title).toBe('Sooner');
      expect(upcoming.value[1].title).toBe('Later');
    });
  });

  describe('computed: overdue', () => {
    it('should return past-due uncompleted reminders', () => {
      const { reminders, overdue } = useReminders();

      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();

      reminders.value = [
        {
          id: 1,
          title: 'Overdue',
          description: '',
          type: 'payment',
          priority: 'urgent',
          dueDate: yesterday,
          completed: false,
          createdAt: '2024-01-01'
        },
        { id: 2, title: 'Future', description: '', type: 'follow_up', priority: 'low', dueDate: tomorrow, completed: false, createdAt: '2024-01-01' }
      ];

      expect(overdue.value).toHaveLength(1);
      expect(overdue.value[0].title).toBe('Overdue');
    });
  });

  describe('computed: completed', () => {
    it('should return completed reminders sorted by completedAt desc', () => {
      const { reminders, completed } = useReminders();

      reminders.value = [
        {
          id: 1,
          title: 'Done first',
          description: '',
          type: 'custom',
          priority: 'low',
          dueDate: '2024-01-01',
          completed: true,
          completedAt: '2024-01-05',
          createdAt: '2024-01-01'
        },
        {
          id: 2,
          title: 'Done second',
          description: '',
          type: 'custom',
          priority: 'low',
          dueDate: '2024-01-02',
          completed: true,
          completedAt: '2024-01-10',
          createdAt: '2024-01-01'
        },
        {
          id: 3,
          title: 'Not done',
          description: '',
          type: 'follow_up',
          priority: 'medium',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      expect(completed.value).toHaveLength(2);
      expect(completed.value[0].title).toBe('Done second');
      expect(completed.value[1].title).toBe('Done first');
    });
  });

  describe('computed: stats', () => {
    it('should calculate all stat fields', () => {
      const { reminders, stats } = useReminders();

      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayDate = todayStr + 'T12:00:00.000Z';

      reminders.value = [
        {
          id: 1,
          title: 'Overdue',
          description: '',
          type: 'payment',
          priority: 'urgent',
          dueDate: yesterday,
          completed: false,
          createdAt: '2024-01-01'
        },
        {
          id: 2,
          title: 'Today',
          description: '',
          type: 'follow_up',
          priority: 'medium',
          dueDate: todayDate,
          completed: false,
          createdAt: '2024-01-01'
        },
        { id: 3, title: 'Future', description: '', type: 'deadline', priority: 'low', dueDate: tomorrow, completed: false, createdAt: '2024-01-01' },
        {
          id: 4,
          title: 'Completed',
          description: '',
          type: 'custom',
          priority: 'low',
          dueDate: yesterday,
          completed: true,
          completedAt: yesterday,
          createdAt: '2024-01-01'
        }
      ];

      expect(stats.value.total).toBe(4);
      expect(stats.value.completedCount).toBe(1);
      expect(stats.value.pending).toBe(3); // 3 non-completed
      expect(stats.value.urgentCount).toBe(1);
    });
  });

  // ============================================
  // fetchReminders
  // ============================================
  describe('fetchReminders', () => {
    it('should fetch and map reminders from calendar API', async () => {
      const calendarEvents = {
        docs: [
          {
            id: 1,
            title: 'Follow up with client',
            description: 'Call about proposal',
            color: '#3b82f6', // follow_up
            recurrence: 'medium',
            startDate: '2024-02-01',
            endDate: '2024-02-01',
            createdAt: '2024-01-15'
          }
        ]
      };
      mockApiFetch.mockResolvedValue({ body: calendarEvents, success: true });

      const { fetchReminders, reminders } = useReminders();

      await fetchReminders();

      expect(mockApiFetch).toHaveBeenCalledWith('calendar?eventType=REMINDER&limit=200');
      expect(reminders.value).toHaveLength(1);
      expect(reminders.value[0].title).toBe('Follow up with client');
      expect(reminders.value[0].type).toBe('follow_up');
    });

    it('should map color to type correctly', async () => {
      const colorTypeMapping = [
        { color: '#ef4444', expectedType: 'payment' },
        { color: '#f59e0b', expectedType: 'deadline' },
        { color: '#7c3aed', expectedType: 'meeting' },
        { color: '#3b82f6', expectedType: 'follow_up' },
        { color: '#123456', expectedType: 'custom' }
      ];

      for (const { color, expectedType } of colorTypeMapping) {
        mockApiFetch.mockResolvedValue({
          body: { docs: [{ id: 1, title: 'Test', color, startDate: '2024-01-01', createdAt: '2024-01-01' }] },
          success: true
        });

        const { fetchReminders, reminders } = useReminders();
        await fetchReminders();

        expect(reminders.value[0].type).toBe(expectedType);
      }
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiFetch.mockReturnValue(pendingPromise);

      const { fetchReminders, loading } = useReminders();

      const fetchPromise = fetchReminders();
      expect(loading.value).toBe(true);

      resolvePromise!({ body: { docs: [] }, success: true });
      await fetchPromise;

      expect(loading.value).toBe(false);
    });

    it('should set loading to false even on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { fetchReminders, loading } = useReminders();

      await fetchReminders().catch(() => {});

      expect(loading.value).toBe(false);
    });
  });

  // ============================================
  // addReminder
  // ============================================
  describe('addReminder', () => {
    it('should create a calendar event with correct data', async () => {
      // First mock for create, second for fetchReminders
      mockApiFetch.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({
        body: { docs: [{ id: 1, title: 'New Reminder', color: '#3b82f6', startDate: '2024-02-01', createdAt: '2024-01-15' }] },
        success: true
      });

      const { addReminder } = useReminders();

      await addReminder({
        title: 'New Reminder',
        description: 'Call client',
        type: 'follow_up',
        priority: 'medium',
        dueDate: '2024-02-01'
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        'calendar',
        'POST',
        expect.objectContaining({
          title: 'New Reminder',
          description: 'Call client',
          eventType: 'REMINDER',
          allDay: true,
          color: '#3b82f6', // follow_up color
          recurrence: 'medium'
        })
      );
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false });

      const { addReminder } = useReminders();

      const result = await addReminder({
        title: 'Failed Reminder',
        description: '',
        type: 'custom',
        priority: 'low',
        dueDate: '2024-02-01'
      });

      expect(result).toBeNull();
    });

    it('should map type to correct color', async () => {
      mockApiFetch.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ body: { docs: [] }, success: true });

      const { addReminder } = useReminders();

      await addReminder({
        title: 'Payment Reminder',
        description: 'Invoice due',
        type: 'payment',
        priority: 'high',
        dueDate: '2024-02-01'
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        'calendar',
        'POST',
        expect.objectContaining({
          color: '#ef4444' // payment color
        })
      );
    });
  });

  // ============================================
  // completeReminder
  // ============================================
  describe('completeReminder', () => {
    it('should mark reminder as completed locally', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { reminders, completeReminder } = useReminders();
      reminders.value = [
        {
          id: 1,
          title: 'Test',
          description: '',
          type: 'follow_up',
          priority: 'medium',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      await completeReminder(1);

      expect(reminders.value[0].completed).toBe(true);
      expect(reminders.value[0].completedAt).toBeDefined();
    });

    it('should call API for numeric ids', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { reminders, completeReminder } = useReminders();
      reminders.value = [
        {
          id: 42,
          title: 'Test',
          description: 'desc',
          type: 'payment',
          priority: 'high',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      await completeReminder(42);

      expect(mockApiFetch).toHaveBeenCalledWith(
        'calendar/42',
        'PUT',
        expect.objectContaining({
          description: '[COMPLETED] desc'
        })
      );
    });

    it('should not call API for string ids', async () => {
      const { reminders, completeReminder } = useReminders();
      reminders.value = [
        {
          id: 'local-1',
          title: 'Test',
          description: '',
          type: 'custom',
          priority: 'low',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      await completeReminder('local-1');

      expect(mockApiFetch).not.toHaveBeenCalled();
      expect(reminders.value[0].completed).toBe(true);
    });
  });

  // ============================================
  // removeReminder
  // ============================================
  describe('removeReminder', () => {
    it('should remove reminder from list', async () => {
      const { reminders, removeReminder } = useReminders();
      reminders.value = [
        {
          id: 1,
          title: 'ToRemove',
          description: '',
          type: 'custom',
          priority: 'low',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        },
        { id: 2, title: 'Keep', description: '', type: 'custom', priority: 'low', dueDate: '2024-02-01', completed: false, createdAt: '2024-01-01' }
      ];

      await removeReminder(1);

      expect(reminders.value).toHaveLength(1);
      expect(reminders.value[0].title).toBe('Keep');
    });

    it('should call API DELETE for numeric ids', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { reminders, removeReminder } = useReminders();
      reminders.value = [
        { id: 5, title: 'Test', description: '', type: 'custom', priority: 'low', dueDate: '2024-02-01', completed: false, createdAt: '2024-01-01' }
      ];

      await removeReminder(5);

      expect(mockApiFetch).toHaveBeenCalledWith('calendar/5', 'DELETE');
    });

    it('should not call API for string ids', async () => {
      const { reminders, removeReminder } = useReminders();
      reminders.value = [
        {
          id: 'local-1',
          title: 'Test',
          description: '',
          type: 'custom',
          priority: 'low',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      await removeReminder('local-1');

      expect(mockApiFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // updateReminder
  // ============================================
  describe('updateReminder', () => {
    it('should update reminder locally', async () => {
      const { reminders, updateReminder } = useReminders();
      reminders.value = [
        {
          id: 'local-1',
          title: 'Old',
          description: 'Old desc',
          type: 'custom',
          priority: 'low',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      await updateReminder('local-1', { title: 'Updated', priority: 'high' });

      expect(reminders.value[0].title).toBe('Updated');
      expect(reminders.value[0].priority).toBe('high');
    });

    it('should call API PUT for numeric ids', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { reminders, updateReminder } = useReminders();
      reminders.value = [
        {
          id: 10,
          title: 'Old',
          description: 'desc',
          type: 'follow_up',
          priority: 'medium',
          dueDate: '2024-02-01',
          completed: false,
          createdAt: '2024-01-01'
        }
      ];

      await updateReminder(10, { title: 'New Title', dueDate: '2024-03-01' });

      expect(mockApiFetch).toHaveBeenCalledWith(
        'calendar/10',
        'PUT',
        expect.objectContaining({
          title: 'New Title',
          startDate: '2024-03-01',
          endDate: '2024-03-01'
        })
      );
    });

    it('should map type to color when updating type', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { reminders, updateReminder } = useReminders();
      reminders.value = [
        { id: 10, title: 'Test', description: '', type: 'custom', priority: 'low', dueDate: '2024-02-01', completed: false, createdAt: '2024-01-01' }
      ];

      await updateReminder(10, { type: 'deadline' });

      expect(mockApiFetch).toHaveBeenCalledWith(
        'calendar/10',
        'PUT',
        expect.objectContaining({
          color: '#f59e0b' // deadline color
        })
      );
    });
  });

  // ============================================
  // Reminder interface
  // ============================================
  describe('Reminder interface', () => {
    it('should create valid Reminder object', () => {
      const reminder: Reminder = {
        id: 'rem-123',
        title: 'Follow up with Client A',
        description: 'Call about contract renewal',
        type: 'follow_up',
        priority: 'high',
        dueDate: '2024-02-15T10:00:00Z',
        completed: false,
        relatedTo: { type: 'client', id: 'client-1', label: 'Client A Corp' },
        createdAt: '2024-01-15T10:00:00Z'
      };

      expect(reminder.id).toBe('rem-123');
      expect(reminder.type).toBe('follow_up');
      expect(reminder.priority).toBe('high');
      expect(reminder.completed).toBe(false);
      expect(reminder.relatedTo?.label).toBe('Client A Corp');
    });

    it('should allow completed reminder with completedAt', () => {
      const reminder: Reminder = {
        id: 1,
        title: 'Done Task',
        description: '',
        type: 'payment',
        priority: 'urgent',
        dueDate: '2024-01-01',
        completed: true,
        completedAt: '2024-01-02T14:30:00Z',
        createdAt: '2023-12-25'
      };

      expect(reminder.completed).toBe(true);
      expect(reminder.completedAt).toBeDefined();
    });
  });
});
