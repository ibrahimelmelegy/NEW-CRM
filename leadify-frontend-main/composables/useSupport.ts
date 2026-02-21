import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TicketSource {
  EMAIL = 'EMAIL',
  PORTAL = 'PORTAL',
  PHONE = 'PHONE',
  CHAT = 'CHAT'
}

export enum SenderType {
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER'
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: TicketCategory[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: SenderType;
  body: string;
  isInternal: boolean;
  attachments?: Array<{ name: string; url: string }>;
  createdAt: string;
}

export interface TicketAssignee {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface TicketClient {
  id: string;
  clientName: string;
  email?: string;
  phoneNumber?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: string;
  assignedTo?: string;
  clientId?: string;
  slaDeadline?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  csatRating?: number;
  csatComment?: string;
  tags?: string[];
  source: TicketSource;
  tenantId?: string;
  messages?: TicketMessage[];
  assignee?: TicketAssignee;
  client?: TicketClient;
  category?: TicketCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category?: string;
}

export interface TicketMetrics {
  openCount: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  avgCSAT: number;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
}

// ─── Status / Priority Labels ─────────────────────────────────────────────────

export const ticketStatusOptions = [
  { value: TicketStatus.OPEN, label: 'Open', color: '#409eff' },
  { value: TicketStatus.IN_PROGRESS, label: 'In Progress', color: '#e6a23c' },
  { value: TicketStatus.WAITING_CUSTOMER, label: 'Waiting Customer', color: '#909399' },
  { value: TicketStatus.RESOLVED, label: 'Resolved', color: '#67c23a' },
  { value: TicketStatus.CLOSED, label: 'Closed', color: '#303133' }
];

export const ticketPriorityOptions = [
  { value: TicketPriority.LOW, label: 'Low', color: '#909399' },
  { value: TicketPriority.MEDIUM, label: 'Medium', color: '#409eff' },
  { value: TicketPriority.HIGH, label: 'High', color: '#e6a23c' },
  { value: TicketPriority.URGENT, label: 'Urgent', color: '#f56c6c' }
];

export const ticketSourceOptions = [
  { value: TicketSource.EMAIL, label: 'Email' },
  { value: TicketSource.PORTAL, label: 'Portal' },
  { value: TicketSource.PHONE, label: 'Phone' },
  { value: TicketSource.CHAT, label: 'Chat' }
];

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getStatusOption(status: string) {
  return ticketStatusOptions.find(s => s.value === status) || ticketStatusOptions[0];
}

export function getPriorityOption(priority: string) {
  return ticketPriorityOptions.find(p => p.value === priority) || ticketPriorityOptions[1];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchTickets(query: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, String(val));
    }
  });
  const qs = params.toString();
  return useApiFetch(`support/tickets${qs ? `?${qs}` : ''}`);
}

export async function fetchTicketById(id: string) {
  return useApiFetch(`support/tickets/${id}`);
}

export async function createTicket(data: Record<string, any>) {
  return useApiFetch('support/tickets', 'POST', data);
}

export async function assignTicket(id: string, userId: string) {
  return useApiFetch(`support/tickets/${id}/assign`, 'PATCH', { userId });
}

export async function resolveTicket(id: string) {
  return useApiFetch(`support/tickets/${id}/resolve`, 'PATCH');
}

export async function closeTicket(id: string) {
  return useApiFetch(`support/tickets/${id}/close`, 'PATCH');
}

export async function addTicketMessage(id: string, data: Record<string, any>) {
  return useApiFetch(`support/tickets/${id}/messages`, 'POST', data);
}

export async function submitCSAT(id: string, rating: number, comment?: string) {
  return useApiFetch(`support/tickets/${id}/csat`, 'POST', { rating, comment });
}

export async function fetchSupportDashboard() {
  return useApiFetch('support/dashboard');
}

// ─── Canned Responses ─────────────────────────────────────────────────────────

export async function fetchCannedResponses(query: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, String(val));
    }
  });
  const qs = params.toString();
  return useApiFetch(`support/canned-responses${qs ? `?${qs}` : ''}`);
}

export async function createCannedResponse(data: Record<string, any>) {
  return useApiFetch('support/canned-responses', 'POST', data);
}

export async function updateCannedResponse(id: string, data: Record<string, any>) {
  return useApiFetch(`support/canned-responses/${id}`, 'PUT', data);
}

export async function deleteCannedResponse(id: string) {
  return useApiFetch(`support/canned-responses/${id}`, 'DELETE');
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function fetchCategories() {
  return useApiFetch('support/categories');
}

export async function createCategory(data: Record<string, any>) {
  return useApiFetch('support/categories', 'POST', data);
}

export async function updateCategory(id: string, data: Record<string, any>) {
  return useApiFetch(`support/categories/${id}`, 'PUT', data);
}

export async function deleteCategory(id: string) {
  return useApiFetch(`support/categories/${id}`, 'DELETE');
}
