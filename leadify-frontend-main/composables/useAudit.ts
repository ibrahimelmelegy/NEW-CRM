import { useApiFetch } from './useApiFetch';

export interface AuditEntry {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'STATUS_CHANGE';
  entityType: string;
  entityId: number | string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  userId: number;
  user?: { id: number; name: string; email?: string; profilePicture?: string };
  createdAt: string;
}

export async function fetchAuditTrail(
  entityType: string,
  entityId: string | number,
  page: number = 1,
  limit: number = 20
): Promise<{ docs: AuditEntry[]; pagination: any }> {
  const { body, success } = await useApiFetch(
    `audit/${entityType}/${entityId}?page=${page}&limit=${limit}`
  );
  if (success && body) {
    return body as { docs: AuditEntry[]; pagination: any };
  }
  return {
    docs: [],
    pagination: { page: 1, limit, totalItems: 0, totalPages: 0 }
  };
}

export async function fetchFieldHistory(
  entityType: string,
  entityId: string | number,
  fieldName: string
): Promise<AuditEntry[]> {
  const { body, success } = await useApiFetch(
    `audit/${entityType}/${entityId}/field/${fieldName}`
  );
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}
