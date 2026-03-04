/* eslint-disable require-await */
export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  notes?: string;
  user?: { id: number; name: string; profilePicture?: string };
}

export interface LeaveRequestItem {
  id: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  approvedBy?: number;
  rejectionReason?: string;
  user?: { id: number; name: string; profilePicture?: string };
  createdAt: string;
}

export const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: 'Present', type: 'success' },
  { value: 'ABSENT', label: 'Absent', type: 'danger' },
  { value: 'LATE', label: 'Late', type: 'warning' },
  { value: 'HALF_DAY', label: 'Half Day', type: '' },
  { value: 'ON_LEAVE', label: 'On Leave', type: 'info' }
];

export const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'EMERGENCY', label: 'Emergency' }
];

export const LEAVE_STATUSES = [
  { value: 'PENDING', label: 'Pending', type: 'warning' },
  { value: 'APPROVED', label: 'Approved', type: 'success' },
  { value: 'REJECTED', label: 'Rejected', type: 'danger' },
  { value: 'CANCELLED', label: 'Cancelled', type: 'info' }
];

export async function fetchAttendance(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`hr/attendance${query}`);
  if (success && body)
    return body as { docs: AttendanceRecord[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 30, totalItems: 0, totalPages: 0 } };
}

export async function clockIn() {
  return useApiFetch('hr/attendance/check-in', 'POST');
}

export async function clockOut() {
  return useApiFetch('hr/attendance/check-out', 'POST');
}

export async function createAttendance(data: Partial<AttendanceRecord>) {
  return useApiFetch('hr/attendance', 'POST', data);
}

export async function updateAttendance(id: number, data: Partial<AttendanceRecord>) {
  return useApiFetch(`hr/attendance/${id}`, 'PUT', data);
}

export async function deleteAttendance(id: number) {
  return useApiFetch(`hr/attendance/${id}`, 'DELETE');
}

export async function fetchLeaveRequestById(id: number | string): Promise<LeaveRequestItem | null> {
  const { body, success } = await useApiFetch(`hr/leave-requests/${id}`);
  return success && body ? (body as LeaveRequestItem) : null;
}

export async function fetchLeaveRequests(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`hr/leave-requests${query}`);
  if (success && body)
    return body as { docs: LeaveRequestItem[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function createLeaveRequest(data: Record<string, unknown>) {
  return useApiFetch('hr/leave-requests', 'POST', data);
}

export async function approveLeave(id: number) {
  return useApiFetch(`hr/leave-requests/${id}/approve`, 'PATCH');
}

export async function rejectLeave(id: number, reason: string) {
  return useApiFetch(`hr/leave-requests/${id}/reject`, 'PATCH', { reason });
}

export async function cancelLeave(id: number) {
  return useApiFetch(`hr/leave-requests/${id}/cancel`, 'PATCH');
}

export async function deleteLeaveRequest(id: number) {
  return useApiFetch(`hr/leave-requests/${id}`, 'DELETE');
}
