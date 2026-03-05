/* eslint-disable no-use-before-define */
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

export interface PortalTicketMessage {
  id: number;
  ticketId: string;
  message: string;
  senderType: 'client' | 'staff';
  portalUserId: string | null;
  portalUser?: { id: string; name: string; email: string } | null;
  staffUserId: number | null;
  createdAt: string;
}

export interface TicketWithMessages extends SupportTicket {
  messages: PortalTicketMessage[];
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

// ─── Admin: Portal User management ──────────────────────────────────────────

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

// ─── Admin: Ticket management ────────────────────────────────────────────────

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

// ─── Enhanced Portal Interfaces ──────────────────────────────────────────────

export interface PortalDashboardData {
  openInvoices: { count: number; total: number };
  activeProjects: { count: number; items: PortalProject[] };
  pendingSignatures: { count: number; items: PortalSignatureDoc[] };
  sharedDocuments: { count: number };
}

export interface PortalDashboardStats {
  outstandingInvoices: { count: number; total: number };
  openTickets: number;
  activeProjects: number;
  totalDeals: number;
}

export interface PortalProject {
  id: string;
  name: string;
  status: string;
  description?: string;
  category?: string;
  startDate: string | null;
  endDate: string | null;
  isCompleted: boolean;
  duration: number;
  progress: number;
  daysRemaining: number;
  milestones: PortalMilestone[];
  totalCost?: number;
  grandTotal?: number;
}

export interface PortalMilestone {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  date: string | null;
}

export interface PortalSignatureDoc {
  id: string;
  title: string;
  status: string;
  deal: { id: string; name: string } | null;
}

export interface PortalInvoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  invoiceDate: string | null;
  dueDate?: string | null;
  collected: boolean;
  collectedDate: string | null;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL';
  deal: { id: string; name: string } | null;
}

export interface PortalDocument {
  id: number;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  tags: string[];
  category: string;
  folder: { id: number; name: string; color: string } | null;
  uploadedAt: string;
}

export interface InvoiceListResult {
  invoices: PortalInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Enhanced portal composable for client portal features:
 * e-signatures, invoices, projects, shared documents, tickets, and dashboard stats
 */
export function useEnhancedPortal() {
  const { portalFetch } = usePortalAuth();

  const dashboard = ref<PortalDashboardData | null>(null);
  const dashboardStats = ref<PortalDashboardStats | null>(null);
  const invoices = ref<PortalInvoice[]>([]);
  const invoicePagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const projects = ref<PortalProject[]>([]);
  const documents = ref<PortalDocument[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDashboard() {
    loading.value = true;
    error.value = null;
    try {
      const res = await portalFetch<PortalDashboardData>('enhanced/dashboard');
      if (res.success && res.body) {
        dashboard.value = res.body;
      } else {
        error.value = res.message || 'Failed to fetch dashboard';
      }
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to fetch dashboard';
    } finally {
      loading.value = false;
    }
  }

  async function fetchDashboardStats() {
    try {
      const res = await portalFetch<PortalDashboardStats>('dashboard/stats');
      if (res.success && res.body) {
        dashboardStats.value = res.body;
      }
    } catch {
      // silently ignore stats errors
    }
  }

  async function fetchInvoices(page: number = 1, limit: number = 20) {
    loading.value = true;
    error.value = null;
    try {
      const res = await portalFetch<InvoiceListResult>(`enhanced/invoices?page=${page}&limit=${limit}`);
      if (res.success && res.body) {
        invoices.value = res.body.invoices;
        invoicePagination.value = {
          total: res.body.total,
          page: res.body.page,
          limit: res.body.limit,
          totalPages: res.body.totalPages
        };
      } else {
        error.value = res.message || 'Failed to fetch invoices';
      }
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to fetch invoices';
    } finally {
      loading.value = false;
    }
  }

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const res = await portalFetch<PortalProject[]>('enhanced/projects');
      if (res.success && res.body) {
        projects.value = res.body;
      } else {
        error.value = res.message || 'Failed to fetch projects';
      }
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to fetch projects';
    } finally {
      loading.value = false;
    }
  }

  async function fetchDocuments() {
    loading.value = true;
    error.value = null;
    try {
      const res = await portalFetch<PortalDocument[]>('documents/shared');
      if (res.success && res.body) {
        documents.value = res.body;
      } else {
        error.value = res.message || 'Failed to fetch documents';
      }
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to fetch documents';
    } finally {
      loading.value = false;
    }
  }

  async function signDocument(documentId: string, signatureData: string, signatureType: 'DRAWN' | 'TYPED', typedName?: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await portalFetch(`documents/${documentId}/sign`, 'POST', {
        signatureData,
        signatureType,
        typedName
      });
      if (res.success) {
        ElNotification({ type: 'success', title: 'Success', message: 'Document signed successfully' });
        return { success: true, data: res.body };
      } else {
        const msg = res.message || 'Failed to sign document';
        ElNotification({ type: 'error', title: 'Error', message: msg });
        error.value = msg;
        return { success: false, message: msg };
      }
    } catch (e: unknown) {
      const msg = (e as Error).message || 'Failed to sign document';
      error.value = msg;
      ElNotification({ type: 'error', title: 'Error', message: msg });
      return { success: false, message: msg };
    } finally {
      loading.value = false;
    }
  }

  async function getSignatures(documentId: string) {
    try {
      const res = await portalFetch(`signatures/${documentId}`);
      if (res.success && res.body) {
        return res.body;
      }
      return [];
    } catch {
      return [];
    }
  }

  // ─── Ticket Messaging ────────────────────────────────────────────────

  async function fetchTicketWithMessages(ticketId: string): Promise<TicketWithMessages | null> {
    try {
      const res = await portalFetch<TicketWithMessages>(`tickets/${ticketId}/messages`);
      if (res.success && res.body) {
        return res.body;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function sendPortalTicketMessage(ticketId: string, message: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await portalFetch(`tickets/${ticketId}/messages`, 'POST', { message });
      if (res.success) {
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to send message' };
    } catch (e: unknown) {
      return { success: false, message: (e as Error).message || 'Failed to send message' };
    }
  }

  // ─── Invoice PDF ─────────────────────────────────────────────────────

  async function fetchInvoicePdfData(invoiceId: number): Promise<PortalInvoice | null> {
    try {
      const res = await portalFetch<PortalInvoice>(`invoices/${invoiceId}/pdf`);
      if (res.success && res.body) {
        return res.body;
      }
      return null;
    } catch {
      return null;
    }
  }

  return {
    dashboard,
    dashboardStats,
    invoices,
    invoicePagination,
    projects,
    documents,
    loading,
    error,
    fetchDashboard,
    fetchDashboardStats,
    fetchInvoices,
    fetchProjects,
    fetchDocuments,
    signDocument,
    getSignatures,
    fetchTicketWithMessages,
    sendPortalTicketMessage,
    fetchInvoicePdfData
  };
}
