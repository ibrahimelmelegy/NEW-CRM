/* eslint-disable require-await */
import { ElNotification } from 'element-plus';
import logger from '~/utils/logger'

export interface InvoiceItem {
  id: number;
  invoiceNumber: string;
  amount: number;
  invoiceDate?: string;
  collected: boolean;
  collectedDate?: string;
  dealId: string;
  deal?: { id: string; name: string };
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  collectedCount: number;
  pendingCount: number;
}

export async function fetchInvoices(query: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);

  const { body, success } = await useApiFetch(`invoices?${params.toString()}`);
  if (success && body) return body as { docs: InvoiceItem[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchInvoiceById(id: number): Promise<InvoiceItem | null> {
  const { body, success } = await useApiFetch(`invoices/${id}`);
  if (success && body) return body as InvoiceItem;
  return null;
}

export async function markCollected(id: number, collectedDate?: string) {
  return useApiFetch(`invoices/${id}/collect`, 'PUT', { collectedDate } as Record<string, unknown>);
}

export async function markUncollected(id: number) {
  return useApiFetch(`invoices/${id}/uncollect`, 'PUT');
}

export async function fetchInvoiceSummary(): Promise<InvoiceSummary> {
  const { body, success } = await useApiFetch('invoices/summary');
  if (success && body) return body as InvoiceSummary;
  return { totalInvoices: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, collectedCount: 0, pendingCount: 0 };
}

/**
 * Download invoice as PDF from server-side generation endpoint.
 * Triggers a browser download of the generated file.
 * @param id - Invoice ID
 * @param invoiceNumber - Optional invoice number for the filename
 */
export async function downloadInvoicePdf(id: number, invoiceNumber?: string): Promise<boolean> {
  try {
    const config = useRuntimeConfig();

    const response = await $fetch(`${config.public.API_BASE_URL}invoices/${id}/pdf`, {
      method: 'GET',
      credentials: 'include',
      responseType: 'blob'
    });

    const blob = response as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    logger.error('Failed to download invoice PDF:', error);
    const t = useNuxtApp().$i18n.t;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.downloadFailed') });
    return false;
  }
}
