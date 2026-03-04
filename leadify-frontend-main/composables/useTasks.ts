/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
  entityType?: string;
  entityId?: number;
  assigneeId?: number;
  assignee?: { id: number; name: string; email?: string; profilePicture?: string };
  createdBy?: number;
  creator?: { id: number; name: string; profilePicture?: string };
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export async function fetchTasks(query?: Record<string, string>): Promise<{ docs: Task[]; pagination: PaginationMeta }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`tasks${qs}`);
  if (success && body) {
    return body as { docs: Task[]; pagination: PaginationMeta };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchMyTasks(query?: Record<string, string>): Promise<{ docs: Task[]; pagination: PaginationMeta }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`tasks/my${qs}`);
  if (success && body) {
    return body as { docs: Task[]; pagination: PaginationMeta };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchTasksByEntity(entityType: string, entityId: string | number): Promise<Task[]> {
  const { body, success } = await useApiFetch(`tasks/entity/${entityType}/${entityId}`);
  if (success && body) {
    const data = body as { docs?: Task[] };
    return data.docs || (Array.isArray(data) ? data : []);
  }
  return [];
}

export async function createTask(data: Partial<Task>) {
  return useApiFetch('tasks', 'POST', data as Record<string, unknown>);
}

export async function updateTask(id: number, data: Partial<Task>) {
  return useApiFetch(`tasks/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function completeTask(id: number) {
  return useApiFetch(`tasks/${id}/complete`, 'PATCH');
}

export async function deleteTask(id: number) {
  return useApiFetch(`tasks/${id}`, 'DELETE');
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  cancelled: number;
  overdue: number;
}

export async function fetchTaskStats(): Promise<TaskStats | null> {
  const { body, success } = await useApiFetch('tasks/stats');
  return success && body ? (body as TaskStats) : null;
}
