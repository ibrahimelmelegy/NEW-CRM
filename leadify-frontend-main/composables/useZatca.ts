import { useApiFetch } from './useApiFetch';

// ZATCA Invoice Types
export type ZatcaInvoiceType = 'STANDARD' | 'SIMPLIFIED' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
export type ZatcaInvoiceStatus = 'DRAFT' | 'PENDING' | 'REPORTED' | 'CLEARED' | 'REJECTED';

export interface ZatcaLineItem {
  id?: number;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface ZatcaInvoice {
  id: number;
  invoiceNumber: string;
  invoiceType: ZatcaInvoiceType;
  invoiceTypeCode: string;
  uuid: string;
  issueDate: string;
  supplyDate?: string;
  currency: string;

  // Seller info
  sellerName: string;
  sellerVatNumber: string;
  sellerAddress: string;
  sellerCity: string;
  sellerDistrict?: string;
  sellerPostalCode: string;
  sellerCountry: string;
  sellerCRNumber?: string;

  // Buyer info
  buyerName: string;
  buyerVatNumber?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerPostalCode?: string;
  buyerCountry?: string;

  // Amounts
  subtotal: number;
  discount: number;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;

  // Line items
  lineItems: ZatcaLineItem[];

  // ZATCA submission
  status: ZatcaInvoiceStatus;
  submittedAt?: string;
  clearedAt?: string;
  zatcaResponse?: string;
  zatcaWarnings?: string[];
  zatcaErrors?: string[];
  invoiceHash?: string;
  qrCode?: string;
  xmlContent?: string;

  // Metadata
  notes?: string;
  dealId?: number;
  invoiceId?: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZatcaPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// Status badge config
export const zatcaStatusMap: Record<ZatcaInvoiceStatus, { type: string; color: string }> = {
  DRAFT: { type: 'info', color: '#909399' },
  PENDING: { type: 'warning', color: '#e6a23c' },
  REPORTED: { type: '', color: '#409eff' },
  CLEARED: { type: 'success', color: '#67c23a' },
  REJECTED: { type: 'danger', color: '#f56c6c' }
};

export const zatcaInvoiceTypes = [
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Simplified', value: 'SIMPLIFIED' },
  { label: 'Debit Note', value: 'DEBIT_NOTE' },
  { label: 'Credit Note', value: 'CREDIT_NOTE' }
];

export const zatcaStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Reported', value: 'REPORTED' },
  { label: 'Cleared', value: 'CLEARED' },
  { label: 'Rejected', value: 'REJECTED' }
];

export async function fetchZatcaInvoices(query?: Record<string, string>): Promise<{ docs: ZatcaInvoice[]; pagination: ZatcaPagination }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`zatca/invoices${qs}`);
  if (success && body) return body as { docs: ZatcaInvoice[]; pagination: ZatcaPagination };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchZatcaInvoice(id: number | string): Promise<ZatcaInvoice | null> {
  const { body, success } = await useApiFetch(`zatca/invoices/${id}`);
  return success && body ? (body as ZatcaInvoice) : null;
}

export async function createZatcaInvoice(data: Partial<ZatcaInvoice>): Promise<any> {
  return useApiFetch('zatca/invoices', 'POST', data as Record<string, any>);
}

export async function updateZatcaInvoice(id: number | string, data: Partial<ZatcaInvoice>): Promise<any> {
  return useApiFetch(`zatca/invoices/${id}`, 'PUT', data as Record<string, any>);
}

export async function submitToZatca(id: number | string): Promise<any> {
  return useApiFetch(`zatca/invoices/${id}/submit`, 'POST');
}

export async function validateZatcaInvoice(data: Partial<ZatcaInvoice>): Promise<any> {
  return useApiFetch('zatca/validate', 'POST', data as Record<string, any>);
}

export async function downloadZatcaXml(id: number | string): Promise<any> {
  const { body, success } = await useApiFetch(`zatca/invoices/${id}/xml`);
  if (success && body) {
    // body should contain the XML string or a download URL
    const xml = typeof body === 'string' ? body : (body as any).xml || '';
    if (xml) {
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zatca-invoice-${id}.xml`;
      link.click();
      URL.revokeObjectURL(url);
    }
    return body;
  }
  return null;
}

export async function fetchZatcaSummary(): Promise<{
  total: number;
  pending: number;
  cleared: number;
  rejected: number;
}> {
  // Summary endpoint doesn't exist yet - compute from invoices list
  try {
    const { docs } = await fetchZatcaInvoices({ limit: '1000' });
    return {
      total: docs.length,
      pending: docs.filter(d => d.status === 'PENDING').length,
      cleared: docs.filter(d => d.status === 'CLEARED').length,
      rejected: docs.filter(d => d.status === 'REJECTED').length
    };
  } catch {
    return { total: 0, pending: 0, cleared: 0, rejected: 0 };
  }
}
