/**
 * useHR - Unit Tests
 * ====================
 * Tests for composables/useHR.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  ATTENDANCE_STATUSES,
  LEAVE_TYPES,
  LEAVE_STATUSES,
  fetchAttendance,
  clockIn,
  clockOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  fetchLeaveRequestById,
  fetchLeaveRequests,
  createLeaveRequest,
  approveLeave,
  rejectLeave,
  cancelLeave,
  deleteLeaveRequest
} from '~/composables/useHR';

const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

describe('useHR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Constants
  // ============================================
  describe('constants', () => {
    it('should have 5 attendance statuses', () => {
      expect(ATTENDANCE_STATUSES).toHaveLength(5);
    });

    it('should have 6 leave types', () => {
      expect(LEAVE_TYPES).toHaveLength(6);
    });

    it('should have 4 leave statuses', () => {
      expect(LEAVE_STATUSES).toHaveLength(4);
    });

    it('should include PRESENT in attendance statuses', () => {
      expect(ATTENDANCE_STATUSES.find(s => s.value === 'PRESENT')).toBeDefined();
    });

    it('should include ANNUAL in leave types', () => {
      expect(LEAVE_TYPES.find(t => t.value === 'ANNUAL')).toBeDefined();
    });
  });

  // ============================================
  // Attendance
  // ============================================
  describe('fetchAttendance', () => {
    it('should fetch attendance records', async () => {
      const data = { docs: [{ id: 1, status: 'PRESENT' }], pagination: { page: 1, limit: 30, totalItems: 1, totalPages: 1 } };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const result = await fetchAttendance();

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance');
      expect(result.docs).toHaveLength(1);
    });

    it('should pass query params', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchAttendance({ userId: '1' });

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance?userId=1');
    });

    it('should return empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchAttendance();

      expect(result.docs).toEqual([]);
    });
  });

  describe('clockIn', () => {
    it('should POST to check-in endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await clockIn();

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance/check-in', 'POST');
    });
  });

  describe('clockOut', () => {
    it('should POST to check-out endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await clockOut();

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance/check-out', 'POST');
    });
  });

  describe('createAttendance', () => {
    it('should POST attendance data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createAttendance({ userId: 1, date: '2024-01-01', status: 'PRESENT' });

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance', 'POST', { userId: 1, date: '2024-01-01', status: 'PRESENT' });
    });
  });

  describe('updateAttendance', () => {
    it('should PUT attendance data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateAttendance(1, { status: 'LATE' });

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance/1', 'PUT', { status: 'LATE' });
    });
  });

  describe('deleteAttendance', () => {
    it('should DELETE attendance record', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteAttendance(1);

      expect(mockApiFetch).toHaveBeenCalledWith('hr/attendance/1', 'DELETE');
    });
  });

  // ============================================
  // Leave Requests
  // ============================================
  describe('fetchLeaveRequests', () => {
    it('should fetch leave requests', async () => {
      const data = { docs: [{ id: 1, leaveType: 'ANNUAL' }], pagination: {} };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const result = await fetchLeaveRequests();

      expect(mockApiFetch).toHaveBeenCalledWith('hr/leave-requests');
      expect(result.docs).toHaveLength(1);
    });

    it('should return empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchLeaveRequests();

      expect(result.docs).toEqual([]);
    });
  });

  describe('fetchLeaveRequestById', () => {
    it('should return leave request on success', async () => {
      const request = { id: 1, leaveType: 'SICK' };
      mockApiFetch.mockResolvedValue({ body: request, success: true });

      const result = await fetchLeaveRequestById(1);

      expect(result).toEqual(request);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchLeaveRequestById(999);

      expect(result).toBeNull();
    });
  });

  describe('createLeaveRequest', () => {
    it('should POST leave request data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createLeaveRequest({ leaveType: 'ANNUAL', startDate: '2024-01-01', endDate: '2024-01-05' });

      expect(mockApiFetch).toHaveBeenCalledWith('hr/leave-requests', 'POST', expect.objectContaining({ leaveType: 'ANNUAL' }));
    });
  });

  describe('approveLeave', () => {
    it('should PATCH approve endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await approveLeave(1);

      expect(mockApiFetch).toHaveBeenCalledWith('hr/leave-requests/1/approve', 'PATCH');
    });
  });

  describe('rejectLeave', () => {
    it('should PATCH reject endpoint with reason', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await rejectLeave(1, 'Too many requests');

      expect(mockApiFetch).toHaveBeenCalledWith('hr/leave-requests/1/reject', 'PATCH', { reason: 'Too many requests' });
    });
  });

  describe('cancelLeave', () => {
    it('should PATCH cancel endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await cancelLeave(1);

      expect(mockApiFetch).toHaveBeenCalledWith('hr/leave-requests/1/cancel', 'PATCH');
    });
  });

  describe('deleteLeaveRequest', () => {
    it('should DELETE leave request', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteLeaveRequest(1);

      expect(mockApiFetch).toHaveBeenCalledWith('hr/leave-requests/1', 'DELETE');
    });
  });
});
