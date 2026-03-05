import { ElNotification } from 'element-plus';

// --- Enums & Types ---

export enum InvoiceStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID'
}

export enum CreditNoteStatusEnum {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  APPLIED = 'APPLIED',
  VOIDED = 'VOIDED'
}

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'NET_15', label: 'Net 15 Days' },
  { value: 'NET_30', label: 'Net 30 Days' },
  { value: 'NET_60', label: 'Net 60 Days' },
  { value: 'NET_90', label: 'Net 90 Days' },
  { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
  { value: 'CUSTOM', label: 'Custom' }
];

export const INVOICE_STATUS_OPTIONS = [
  { value: InvoiceStatusEnum.DRAFT, label: 'Draft', type: 'info' },
  { value: InvoiceStatusEnum.SENT, label: 'Sent', type: '' },
  { value: InvoiceStatusEnum.PARTIALLY_PAID, label: 'Partially Paid', type: 'warning' },
  { value: InvoiceStatusEnum.PAID, label: 'Paid', type: 'success' },
  { value: InvoiceStatusEnum.OVERDUE, label: 'Overdue', type: 'danger' },
  { value: InvoiceStatusEnum.VOID, label: 'Void', type: 'info' }
];

export interface InvoiceLineItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

export interface CreditNote {
  id: string;
  invoiceId: number;
  creditNoteNumber: string;
  amount: number;
  reason?: string;
  status: string;
  date?: string;
  createdAt: string;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  creditTotal: number;
  paid: number;
  balanceDue: number;
}

export interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  amount: number;
  invoiceDate?: string;
  collected: boolean;
  collectedDate?: string;
  dealId: string;
  deal?: { id: string; name: string };
  lineItems: InvoiceLineItem[];
  creditNotes: CreditNote[];
  totals: InvoiceTotals;
  createdAt: string;
  updatedAt: string;
}

export interface AgingBucket {
  amount: number;
  count: number;
}

export interface AgingClientBreakdown {
  clientName: string;
  current: number;
  thirtyDays: number;
  sixtyDays: number;
  ninetyPlus: number;
  total: number;
}

export interface AgingReport {
  totalOutstanding: number;
  buckets: {
    current: AgingBucket;
    thirtyDays: AgingBucket;
    sixtyDays: AgingBucket;
    ninetyPlus: AgingBucket;
  };
  clientBreakdown: AgingClientBreakdown[];
}

// --- API Functions ---

export async function createInvoice(data: {
  dealId: string;
  invoiceDate?: string;
  notes?: string;
  paymentTerms?: string;
  dueDate?: string;
  lineItems?: Omit<InvoiceLineItem, 'lineTotal'>[];
}): Promise<InvoiceDetail | null> {
  const response = await useApiFetch('invoices/billing/create', 'POST', data as unknown);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Invoice created successfully' });
    return response.body as InvoiceDetail;
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
    return null;
  }
}

export async function getInvoiceDetail(id: number): Promise<InvoiceDetail | null> {
  const { body, success } = await useApiFetch(`invoices/billing/${id}`);
  if (success && body) return body as InvoiceDetail;
  return null;
}

export async function updateInvoice(
  id: number,
  data: {
    invoiceDate?: string;
    dealId?: string;
    lineItems?: Omit<InvoiceLineItem, 'lineTotal'>[];
  }
): Promise<InvoiceDetail | null> {
  const response = await useApiFetch(`invoices/billing/${id}`, 'PUT', data as unknown);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Invoice updated successfully' });
    return response.body as InvoiceDetail;
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
    return null;
  }
}

export async function markInvoiceSent(id: number): Promise<boolean> {
  const response = await useApiFetch(`invoices/billing/${id}/send`, 'PATCH', {});
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Invoice marked as sent' });
    return true;
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
    return false;
  }
}

export async function voidInvoice(id: number): Promise<boolean> {
  const response = await useApiFetch(`invoices/billing/${id}/void`, 'PATCH', {});
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Invoice voided successfully' });
    return true;
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
    return false;
  }
}

export async function getAgingReport(): Promise<AgingReport | null> {
  const { body, success } = await useApiFetch('invoices/billing/aging-report');
  if (success && body) return body as AgingReport;
  return null;
}

export async function createCreditNote(
  invoiceId: number,
  data: {
    amount: number;
    reason?: string;
    date?: string;
  }
): Promise<CreditNote | null> {
  const response = await useApiFetch(`invoices/billing/${invoiceId}/credit-note`, 'POST', data as unknown);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Credit note created successfully' });
    return response.body as CreditNote;
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
    return null;
  }
}

export async function createFromOrder(orderId: string): Promise<InvoiceDetail | null> {
  const response = await useApiFetch(`invoices/billing/from-order/${orderId}`, 'POST', {});
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Invoice created from sales order' });
    return response.body as InvoiceDetail;
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
    return null;
  }
}

// --- Utilities ---

export function getInvoiceStatusType(status: string): string {
  return INVOICE_STATUS_OPTIONS.find(s => s.value === status)?.type || 'info';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

export function calculateLineTotal(item: { quantity: number; unitPrice: number; taxRate: number; discountRate: number }): number {
  const subtotal = item.quantity * item.unitPrice;
  const discount = subtotal * (item.discountRate / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (item.taxRate / 100);
  return Math.round((taxable + tax) * 100) / 100;
}
