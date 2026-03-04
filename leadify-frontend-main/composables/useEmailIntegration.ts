/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface EmailAccount {
  id: string;
  userId: string;
  provider: string;
  email: string;
  isActive: boolean;
  lastSyncAt?: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  messageId?: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  body: string;
  isRead: boolean;
  folder: string;
  entityType?: string;
  entityId?: string;
  sentAt: string;
  createdAt?: string;
}

export async function fetchEmailAccounts(): Promise<EmailAccount[]> {
  const { body, success } = await useApiFetch('email/accounts', 'GET', {}, true);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function connectEmailAccount(data: Record<string, any>) {
  return useApiFetch('email/accounts', 'POST', data);
}

export async function disconnectEmailAccount(id: string) {
  return useApiFetch(`email/accounts/${id}`, 'DELETE');
}

export async function fetchEmailMessages(query?: Record<string, string>): Promise<{ docs: EmailMessage[]; pagination: any }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`email/messages${qs}`, 'GET', {}, true);
  if (success && body) {
    return body as { docs: EmailMessage[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function sendEmail(accountId: string, data: Record<string, any>) {
  return useApiFetch('email/messages/send', 'POST', { accountId, ...data });
}

export async function fetchEmailTracking(messageId: string) {
  const { body, success } = await useApiFetch(`email/tracking/${messageId}`);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}
