/* eslint-disable no-use-before-define */
/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface DuplicateSet {
  id: number;
  entityType: string;
  status: 'DETECTED' | 'CONFIRMED' | 'DISMISSED' | 'MERGED';
  matchScore: number;
  matchedFields: string[];
  records: DuplicateRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DuplicateRecord {
  id: number;
  entityId: number;
  data: Record<string, unknown>;
}

export async function fetchDuplicateSets(query?: Record<string, string>): Promise<{ docs: DuplicateSet[]; pagination: unknown }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`duplicates${qs}`);
  if (success && body) {
    return body as { docs: DuplicateSet[]; pagination: unknown };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function checkDuplicates(entityType: string, data: Record<string, unknown>) {
  return useApiFetch(`duplicates/check/${entityType}`, 'POST', data);
}

export async function scanForDuplicates(entityType: string) {
  return useApiFetch(`duplicates/scan/${entityType}`, 'POST');
}

export async function confirmDuplicate(id: number) {
  return useApiFetch(`duplicates/${id}/confirm`, 'PATCH');
}

export async function dismissDuplicate(id: number) {
  return useApiFetch(`duplicates/${id}/dismiss`, 'PATCH');
}

export async function mergeDuplicates(id: number, data: Record<string, unknown>) {
  return useApiFetch(`duplicates/${id}/merge`, 'POST', data);
}
