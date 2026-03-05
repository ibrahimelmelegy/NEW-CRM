/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface Territory {
  id: string;
  name: string;
  description?: string;
  type: string;
  parentId?: string;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string };
  boundaries?: Record<string, unknown>;
  isActive: boolean;
  children?: Territory[];
  createdAt?: string;
}

export async function fetchTerritories(query?: Record<string, string>): Promise<Territory[]> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`territories${qs}`);
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function fetchTerritoryTree(): Promise<Territory[]> {
  const { body, success } = await useApiFetch('territories/tree');
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function createTerritory(data: Partial<Territory>) {
  return useApiFetch('territories', 'POST', data as Record<string, unknown>);
}

export async function updateTerritory(id: string, data: Partial<Territory>) {
  return useApiFetch(`territories/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function deleteTerritory(id: string) {
  return useApiFetch(`territories/${id}`, 'DELETE');
}
