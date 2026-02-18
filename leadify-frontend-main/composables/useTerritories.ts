import { useApiFetch } from './useApiFetch';

export interface Territory {
  id: string;
  name: string;
  description?: string;
  type: string;
  parentId?: string;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string };
  boundaries?: Record<string, any>;
  isActive: boolean;
  children?: Territory[];
  createdAt?: string;
}

export async function fetchTerritories(query?: Record<string, string>): Promise<Territory[]> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`territory${qs}`);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function fetchTerritoryTree(): Promise<Territory[]> {
  const { body, success } = await useApiFetch('territory/tree');
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function createTerritory(data: Partial<Territory>) {
  return useApiFetch('territory', 'POST', data as Record<string, any>);
}

export async function updateTerritory(id: string, data: Partial<Territory>) {
  return useApiFetch(`territory/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteTerritory(id: string) {
  return useApiFetch(`territory/${id}`, 'DELETE');
}
