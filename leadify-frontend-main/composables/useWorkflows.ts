import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import logger from '~/utils/logger';

// ── Types ──

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
  value: unknown;
}

export interface WorkflowAction {
  type: string;
  [key: string]: unknown;
}

export interface WorkflowRule {
  id: number;
  name: string;
  description?: string;
  entityType: string;
  triggerType: string;
  triggerField?: string;
  triggerValue?: string;
  conditions?: WorkflowCondition[];
  conditionLogic: 'AND' | 'OR';
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  executionCount: number;
  lastExecutedAt?: string;
  createdBy?: number;
  creator?: { id: number; name: string; email: string };
  graphData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: number;
  workflowRuleId: number;
  entityType: string;
  entityId: string;
  triggerType: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  actionsExecuted?: Array<{
    actionType: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    result?: unknown;
    error?: string;
  }>;
  executionTimeMs?: number;
  userId?: number;
  createdAt: string;
  workflowRule?: { id: number; name: string; entityType: string };
}

export interface PaginatedResponse<T> {
  docs: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ── Constants for UI ──

export const ENTITY_TYPES = [
  { value: 'lead', label: 'Lead' },
  { value: 'deal', label: 'Deal' },
  { value: 'client', label: 'Client' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'contract', label: 'Contract' },
  { value: 'task', label: 'Task' }
] as const;

export const TRIGGER_TYPES = [
  { value: 'ON_CREATE', label: 'On Create' },
  { value: 'ON_UPDATE', label: 'On Update' },
  { value: 'ON_DELETE', label: 'On Delete' },
  { value: 'ON_FIELD_CHANGE', label: 'On Field Change' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'MANUAL', label: 'Manual' }
] as const;

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' }
] as const;

export const ACTION_TYPES = [
  { value: 'UPDATE_FIELD', label: 'Update Field', icon: 'ph:pencil-simple-bold' },
  { value: 'CREATE_RECORD', label: 'Create Record', icon: 'ph:plus-circle-bold' },
  { value: 'SEND_EMAIL', label: 'Send Email', icon: 'ph:envelope-bold' },
  { value: 'SEND_NOTIFICATION', label: 'Send Notification', icon: 'ph:bell-bold' },
  { value: 'CREATE_TASK', label: 'Create Task', icon: 'ph:check-square-bold' },
  { value: 'WEBHOOK', label: 'Webhook', icon: 'ph:webhooks-logo-bold' },
  { value: 'ASSIGN_TO', label: 'Assign User', icon: 'ph:user-plus-bold' },
  { value: 'DELAY', label: 'Delay', icon: 'ph:clock-bold' }
] as const;

// ── Composable ──

export function useWorkflows() {
  const workflows = ref<WorkflowRule[]>([]);
  const currentWorkflow = ref<WorkflowRule | null>(null);
  const executions = ref<WorkflowExecution[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
  const executionPagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

  // ── List workflows ──
  async function fetchWorkflows(params?: Record<string, string>) {
    loading.value = true;
    try {
      const query = new URLSearchParams({ page: String(pagination.value.page), limit: String(pagination.value.limit), ...params }).toString();
      const res = await useApiFetch(`workflows?${query}`);
      if (res.success && res.body) {
        const data = res.body as PaginatedResponse<WorkflowRule>;
        workflows.value = data.docs || [];
        if (data.pagination) {
          pagination.value = data.pagination;
        }
      }
    } catch (err) {
      logger.error('Failed to fetch workflows:', err);
    } finally {
      loading.value = false;
    }
  }

  // ── Get single workflow ──
  async function fetchWorkflowById(id: number) {
    loading.value = true;
    try {
      const res = await useApiFetch(`workflows/rules/${id}`);
      if (res.success && res.body) {
        currentWorkflow.value = res.body as WorkflowRule;
        return currentWorkflow.value;
      }
      return null;
    } catch (err) {
      logger.error('Failed to fetch workflow:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // ── Create workflow ──
  async function createWorkflow(data: Partial<WorkflowRule>) {
    saving.value = true;
    try {
      const res = await useApiFetch('workflows/rules', 'POST', data as Record<string, unknown>);
      if (res.success) {
        ElNotification({ type: 'success', title: 'Success', message: 'Workflow created successfully' });
        return res.body as WorkflowRule;
      } else {
        ElNotification({ type: 'error', title: 'Error', message: res.message || 'Failed to create workflow' });
        return null;
      }
    } finally {
      saving.value = false;
    }
  }

  // ── Update workflow ──
  async function updateWorkflow(id: number, data: Partial<WorkflowRule>) {
    saving.value = true;
    try {
      const res = await useApiFetch(`workflows/rules/${id}`, 'PUT', data as Record<string, unknown>);
      if (res.success) {
        ElNotification({ type: 'success', title: 'Success', message: 'Workflow updated successfully' });
        return res.body as WorkflowRule;
      } else {
        ElNotification({ type: 'error', title: 'Error', message: res.message || 'Failed to update workflow' });
        return null;
      }
    } finally {
      saving.value = false;
    }
  }

  // ── Delete workflow ──
  async function deleteWorkflow(id: number) {
    try {
      const res = await useApiFetch(`workflows/rules/${id}`, 'DELETE');
      if (res.success) {
        ElNotification({ type: 'success', title: 'Success', message: 'Workflow deleted' });
        workflows.value = workflows.value.filter(w => w.id !== id);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to delete workflow:', err);
      return false;
    }
  }

  // ── Toggle active/inactive ──
  async function toggleWorkflow(id: number, isActive: boolean) {
    try {
      const res = await useApiFetch(`workflows/rules/${id}/toggle`, 'PATCH', { isActive } as Record<string, unknown>);
      if (res.success) {
        const wf = workflows.value.find(w => w.id === id);
        if (wf) wf.isActive = isActive;
        ElNotification({ type: 'success', title: 'Success', message: `Workflow ${isActive ? 'activated' : 'paused'}` });
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to toggle workflow:', err);
      return false;
    }
  }

  // ── Test workflow with sample data ──
  async function testWorkflow(id: number, sampleData: Record<string, unknown>) {
    try {
      const res = await useApiFetch(`workflows/rules/${id}/test`, 'POST', sampleData);
      if (res.success) {
        return res.body;
      }
      return null;
    } catch (err) {
      logger.error('Failed to test workflow:', err);
      return null;
    }
  }

  // ── Manual execute ──
  async function executeWorkflow(id: number) {
    try {
      const res = await useApiFetch(`workflows/rules/${id}/execute`, 'POST', {});
      if (res.success) {
        ElNotification({ type: 'success', title: 'Executed', message: 'Workflow executed successfully' });
        return res.body;
      } else {
        ElNotification({ type: 'error', title: 'Error', message: res.message || 'Execution failed' });
        return null;
      }
    } catch (err) {
      logger.error('Failed to execute workflow:', err);
      return null;
    }
  }

  // ── Get execution logs for a specific rule ──
  async function fetchExecutions(ruleId: number, params?: Record<string, string>) {
    loading.value = true;
    try {
      const query = new URLSearchParams({
        page: String(executionPagination.value.page),
        limit: String(executionPagination.value.limit),
        ...params
      }).toString();
      const res = await useApiFetch(`workflows/rules/${ruleId}/executions?${query}`);
      if (res.success && res.body) {
        const data = res.body as PaginatedResponse<WorkflowExecution>;
        executions.value = data.docs || [];
        if (data.pagination) {
          executionPagination.value = data.pagination;
        }
      }
    } catch (err) {
      logger.error('Failed to fetch executions:', err);
    } finally {
      loading.value = false;
    }
  }

  // ── Get all executions (global) ──
  async function fetchAllExecutions(params?: Record<string, string>) {
    loading.value = true;
    try {
      const query = new URLSearchParams({
        page: String(executionPagination.value.page),
        limit: String(executionPagination.value.limit),
        ...params
      }).toString();
      const res = await useApiFetch(`workflows/executions?${query}`);
      if (res.success && res.body) {
        const data = res.body as PaginatedResponse<WorkflowExecution>;
        executions.value = data.docs || [];
        if (data.pagination) {
          executionPagination.value = data.pagination;
        }
      }
    } catch (err) {
      logger.error('Failed to fetch all executions:', err);
    } finally {
      loading.value = false;
    }
  }

  // ── Get execution detail ──
  async function fetchExecutionDetail(runId: number) {
    try {
      const res = await useApiFetch(`workflows/executions/${runId}`);
      if (res.success) {
        return res.body as WorkflowExecution;
      }
      return null;
    } catch (err) {
      logger.error('Failed to fetch execution detail:', err);
      return null;
    }
  }

  // ── Get workflow templates ──
  async function fetchTemplates() {
    try {
      const res = await useApiFetch('workflows/templates');
      if (res.success && res.body) {
        return res.body as unknown[];
      }
      return [];
    } catch (err) {
      logger.error('Failed to fetch templates:', err);
      return [];
    }
  }

  return {
    // State
    workflows,
    currentWorkflow,
    executions,
    loading,
    saving,
    pagination,
    executionPagination,

    // Actions
    fetchWorkflows,
    fetchWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    testWorkflow,
    executeWorkflow,
    fetchExecutions,
    fetchAllExecutions,
    fetchExecutionDetail,
    fetchTemplates
  };
}
