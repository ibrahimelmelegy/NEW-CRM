import { useApiFetch } from './useApiFetch';

export interface ReportField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
}

export interface Report {
  id: number;
  name: string;
  description?: string;
  entityType: string;
  fields: string[];
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  isPublic?: boolean;
  createdBy?: number;
  creator?: { id: number; name: string; profilePicture?: string };
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchReports(entityType?: string): Promise<Report[]> {
  const qs = entityType ? `?entityType=${entityType}` : '';
  const { body, success } = await useApiFetch(`reports${qs}`);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function fetchReport(id: number): Promise<Report | null> {
  const { body, success } = await useApiFetch(`reports/${id}`);
  return success && body ? (body as Report) : null;
}

export async function createReport(data: Partial<Report>) {
  return useApiFetch('reports', 'POST', data as Record<string, any>);
}

export async function updateReport(id: number, data: Partial<Report>) {
  return useApiFetch(`reports/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteReport(id: number) {
  return useApiFetch(`reports/${id}`, 'DELETE');
}

export async function executeReport(
  id: number,
  filters?: Record<string, any>
): Promise<any> {
  const payload = filters ? { filters } : {};
  const { body, success } = await useApiFetch(`reports/${id}/execute`, 'POST', payload);
  return success && body ? body : null;
}

export async function exportReport(id: number, format: 'csv' | 'xlsx' | 'pdf') {
  return useApiFetch(`reports/${id}/export?format=${format}`);
}

export async function fetchAvailableFields(entityType: string): Promise<ReportField[]> {
  const { body, success } = await useApiFetch(`reports/fields/${entityType}`);
  if (success && body) {
    return body as ReportField[];
  }
  return [];
}
