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
  if (success && body) return body as { docs: InvoiceItem[]; pagination: any };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchInvoiceById(id: number): Promise<InvoiceItem | null> {
  const { body, success } = await useApiFetch(`invoices/${id}`);
  if (success && body) return body as InvoiceItem;
  return null;
}

export async function markCollected(id: number, collectedDate?: string) {
  return useApiFetch(`invoices/${id}/collect`, 'PUT', { collectedDate } as any);
}

export async function markUncollected(id: number) {
  return useApiFetch(`invoices/${id}/uncollect`, 'PUT');
}

export async function fetchInvoiceSummary(): Promise<InvoiceSummary> {
  const { body, success } = await useApiFetch('invoices/summary');
  if (success && body) return body as InvoiceSummary;
  return { totalInvoices: 0, totalAmount: 0, collectedAmount: 0, pendingAmount: 0, collectedCount: 0, pendingCount: 0 };
}
