import { ElNotification } from 'element-plus';

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  clientId: string;
  client?: { id: string; clientName: string };
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  response: string | null;
  respondedAt: string | null;
  portalUserId: string;
  portalUser?: { id: string; name: string; email: string };
  createdAt: string;
}

export const TICKET_STATUSES = [
  { value: 'OPEN', label: 'Open', type: 'danger' },
  { value: 'IN_PROGRESS', label: 'In Progress', type: 'warning' },
  { value: 'RESOLVED', label: 'Resolved', type: 'success' },
  { value: 'CLOSED', label: 'Closed', type: 'info' }
];

export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low', type: 'info' },
  { value: 'MEDIUM', label: 'Medium', type: '' },
  { value: 'HIGH', label: 'High', type: 'warning' },
  { value: 'URGENT', label: 'Urgent', type: 'danger' }
];

// Admin: Portal User management
export async function fetchPortalUsers(): Promise<PortalUser[]> {
  const { body, success } = await useApiFetch('portal/admin/users');
  return success && body ? body : [];
}

export async function createPortalUser(data: { email: string; password: string; name: string; clientId: string }) {
  const response = await useApiFetch('portal/admin/users', 'POST', data);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Portal user created' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function togglePortalUser(id: string, isActive: boolean) {
  const response = await useApiFetch(`portal/admin/users/${id}`, 'PATCH', { isActive });
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: `User ${isActive ? 'activated' : 'deactivated'}` });
  }
  return response;
}

// Admin: Ticket management
export async function fetchAllTickets(): Promise<SupportTicket[]> {
  const { body, success } = await useApiFetch('portal/admin/tickets');
  return success && body ? body : [];
}

export async function respondToTicket(id: string, responseText: string, status?: string) {
  const response = await useApiFetch(`portal/admin/tickets/${id}/respond`, 'PUT', { response: responseText, status });
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Response sent' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}
