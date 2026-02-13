import { ElNotification } from 'element-plus';

export interface Contract {
  id: string;
  title: string;
  content: string;
  status: string;
  signerName: string;
  signerEmail: string;
  signatureData: string;
  signatureHash: string;
  signedAt: string | null;
  expiresAt: string | null;
  dealId: string | null;
  userId: number;
  deal?: { id: string; name: string };
  createdAt: string;
}

export const CONTRACT_STATUSES = [
  { value: 'DRAFT', label: 'Draft', type: 'info' },
  { value: 'SENT', label: 'Sent', type: 'warning' },
  { value: 'VIEWED', label: 'Viewed', type: '' },
  { value: 'SIGNED', label: 'Signed', type: 'success' },
  { value: 'EXPIRED', label: 'Expired', type: 'danger' },
  { value: 'CANCELLED', label: 'Cancelled', type: 'danger' }
];

export function getContractStatusType(status: string) {
  return CONTRACT_STATUSES.find(s => s.value === status)?.type || 'info';
}

export async function fetchContracts(): Promise<Contract[]> {
  const { body, success } = await useApiFetch('contracts');
  return success && body ? body : [];
}

export async function fetchContract(id: string): Promise<Contract | null> {
  const { body, success } = await useApiFetch(`contracts/${id}`);
  return success ? body : null;
}

export async function createContract(data: Partial<Contract>) {
  const response = await useApiFetch('contracts', 'POST', data as any);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Contract created' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function updateContract(id: string, data: Partial<Contract>) {
  const response = await useApiFetch(`contracts/${id}`, 'PUT', data as any);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Contract updated' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function deleteContract(id: string) {
  const response = await useApiFetch(`contracts/${id}`, 'DELETE');
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Contract deleted' });
  }
  return response;
}

export async function sendForSignature(id: string) {
  const response = await useApiFetch(`contracts/${id}/send`, 'POST', {});
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Contract sent for signature' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

// Public signing endpoints (no auth token needed, but uses same fetch)
export async function fetchContractByToken(token: string): Promise<Contract | null> {
  const { body, success } = await useApiFetch(`contracts/sign/${token}`);
  return success ? body : null;
}

export async function signContract(token: string, signatureData: string, signerName: string) {
  const response = await useApiFetch(`contracts/sign/${token}`, 'POST', { signatureData, signerName });
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Contract signed successfully' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}
