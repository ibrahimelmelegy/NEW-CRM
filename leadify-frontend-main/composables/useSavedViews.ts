import { useApiFetch } from './useApiFetch';

export interface SavedView {
  id: number;
  name: string;
  entityType: string;
  filters: Record<string, any>;
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  color?: string;
  isDefault?: boolean;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchSavedViews(entityType: string): Promise<SavedView[]> {
  const { body, success } = await useApiFetch(`saved-views/${entityType}`);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function createSavedView(data: {
  name: string;
  entityType: string;
  filters: Record<string, any>;
  columns?: string[];
  sortBy?: string;
  sortOrder?: string;
  color?: string;
}): Promise<SavedView | null> {
  const { body, success } = await useApiFetch('saved-views', 'POST', data);
  return success && body ? (body as SavedView) : null;
}

export async function updateSavedView(
  id: number,
  data: Partial<SavedView>
): Promise<SavedView | null> {
  const { body, success } = await useApiFetch(`saved-views/${id}`, 'PUT', data as Record<string, any>);
  return success && body ? (body as SavedView) : null;
}

export async function deleteSavedView(id: number) {
  return useApiFetch(`saved-views/${id}`, 'DELETE');
}

export async function setDefaultView(id: number) {
  return useApiFetch(`saved-views/${id}/default`, 'PATCH');
}
