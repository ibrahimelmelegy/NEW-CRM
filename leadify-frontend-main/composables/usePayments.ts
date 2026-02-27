import { ElNotification } from 'element-plus';

// --- Enums & Options ---

export enum PaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CHECK = 'CHECK',
  ONLINE = 'ONLINE'
}

// PaymentStatusEnum and paymentStatusOptions are exported from useSalesOrders.ts

export const paymentMethodOptions = [
  { label: 'Cash', value: PaymentMethodEnum.CASH },
  { label: 'Bank Transfer', value: PaymentMethodEnum.BANK_TRANSFER },
  { label: 'Credit Card', value: PaymentMethodEnum.CREDIT_CARD },
  { label: 'Check', value: PaymentMethodEnum.CHECK },
  { label: 'Online', value: PaymentMethodEnum.ONLINE }
];

export const paymentStatusColors: Record<string, string> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  VOIDED: 'info'
};

export const paymentMethodLabels: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  CHECK: 'Check',
  ONLINE: 'Online'
};

// --- Interfaces ---

export interface PaymentItem {
  id: string;
  paymentNumber: string;
  invoiceId?: number;
  clientId: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
  status: string;
  client?: {
    id: string;
    clientName: string;
    email?: string;
    phoneNumber?: string;
    companyName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionDashboard {
  totalReceivable: number;
  overdue: number;
  collectedMTD: number;
  collectionRate: number;
  topDebtors: Array<{
    id: string;
    clientName: string;
    email?: string;
    totalOwed: number;
  }>;
}

export interface ClientPaymentHistory {
  payments: PaymentItem[];
  summary: {
    totalPayments: number;
    totalPaid: number;
    lastPaymentDate: string | null;
  };
}

// --- API Functions ---

export async function recordPayment(data: {
  invoiceId?: number;
  clientId: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
}) {
  const res = await useApiFetch('payments', 'POST', data as any);
  if (res.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Payment recorded successfully' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: res.message || 'Failed to record payment' });
  }
  return res;
}

export async function getPayments(
  query: {
    page?: number;
    limit?: number;
    clientId?: string;
    method?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    searchKey?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.clientId) params.set('clientId', query.clientId);
  if (query.method) params.set('method', query.method);
  if (query.status) params.set('status', query.status);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.searchKey) params.set('searchKey', query.searchKey);

  const { body, success } = await useApiFetch(`payments?${params.toString()}`);
  if (success && body) return body as { docs: PaymentItem[]; pagination: any };
  return { docs: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
}

export async function getPaymentById(id: string): Promise<PaymentItem | null> {
  const { body, success } = await useApiFetch(`payments/${id}`);
  if (success && body) return body as PaymentItem;
  return null;
}

export async function voidPayment(id: string) {
  const res = await useApiFetch(`payments/${id}/void`, 'PATCH');
  if (res.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Payment voided successfully' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: res.message || 'Failed to void payment' });
  }
  return res;
}

export async function getCollectionDashboard(): Promise<CollectionDashboard> {
  const { body, success } = await useApiFetch('payments/dashboard');
  if (success && body) return body as CollectionDashboard;
  return {
    totalReceivable: 0,
    overdue: 0,
    collectedMTD: 0,
    collectionRate: 0,
    topDebtors: []
  };
}

export async function getClientPaymentHistory(clientId: string): Promise<ClientPaymentHistory> {
  const { body, success } = await useApiFetch(`payments/client/${clientId}`);
  if (success && body) return body as ClientPaymentHistory;
  return {
    payments: [],
    summary: { totalPayments: 0, totalPaid: 0, lastPaymentDate: null }
  };
}

export async function sendReminder(invoiceId: number, type: string, method: string) {
  const res = await useApiFetch(`payments/remind/${invoiceId}`, 'POST', { type, method } as any);
  if (res.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Reminder sent successfully' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: res.message || 'Failed to send reminder' });
  }
  return res;
}
