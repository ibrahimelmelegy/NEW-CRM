import { ElNotification } from 'element-plus';

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  executionCount: number;
  createdAt: string;
}

export const WORKFLOW_TRIGGERS = [
  { value: 'LEAD_CREATED', label: 'Lead Created' },
  { value: 'LEAD_UPDATED', label: 'Lead Updated' },
  { value: 'LEAD_STATUS_CHANGED', label: 'Lead Status Changed' },
  { value: 'DEAL_CREATED', label: 'Deal Created' },
  { value: 'DEAL_UPDATED', label: 'Deal Updated' },
  { value: 'DEAL_STAGE_CHANGED', label: 'Deal Stage Changed' },
  { value: 'OPPORTUNITY_CREATED', label: 'Opportunity Created' },
  { value: 'OPPORTUNITY_UPDATED', label: 'Opportunity Updated' },
  { value: 'CLIENT_CREATED', label: 'Client Created' },
  { value: 'INVOICE_OVERDUE', label: 'Invoice Overdue' }
];

export const CONDITION_OPERATORS = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'IN', label: 'In List' }
];

export const ACTION_TYPES = [
  { value: 'SEND_EMAIL', label: 'Send Email' },
  { value: 'CREATE_NOTIFICATION', label: 'Create Notification' },
  { value: 'UPDATE_FIELD', label: 'Update Field' },
  { value: 'ASSIGN_USER', label: 'Assign User' }
];

export async function fetchWorkflows(): Promise<Workflow[]> {
  const { body, success } = await useApiFetch('workflows');
  return success && body ? body : [];
}

export async function fetchWorkflow(id: string): Promise<Workflow | null> {
  const { body, success } = await useApiFetch(`workflows/${id}`);
  return success ? body : null;
}

export async function createWorkflow(data: Partial<Workflow>) {
  const response = await useApiFetch('workflows', 'POST', data as any);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Workflow created' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function updateWorkflow(id: string, data: Partial<Workflow>) {
  const response = await useApiFetch(`workflows/${id}`, 'PUT', data as any);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Workflow updated' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function deleteWorkflow(id: string) {
  const response = await useApiFetch(`workflows/${id}`, 'DELETE');
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Workflow deleted' });
  }
  return response;
}

export async function toggleWorkflow(id: string, isActive: boolean) {
  return useApiFetch(`workflows/${id}`, 'PUT', { isActive } as any);
}

export async function fetchWorkflowLogs(id: string) {
  const { body, success } = await useApiFetch(`workflows/${id}/logs`);
  return success && body ? body : [];
}
