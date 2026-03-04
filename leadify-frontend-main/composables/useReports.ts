/* eslint-disable require-await */
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
  filters?: Record<string, unknown>;
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
    const data = body as { docs?: Report[] } | Report[];
    if (Array.isArray(data)) return data;
    return data.docs || [];
  }
  return [];
}

export async function fetchReport(id: number): Promise<Report | null> {
  const { body, success } = await useApiFetch(`reports/${id}`);
  return success && body ? (body as Report) : null;
}

export async function createReport(data: Partial<Report>) {
  return useApiFetch('reports', 'POST', data as Record<string, unknown>);
}

export async function updateReport(id: number, data: Partial<Report>) {
  return useApiFetch(`reports/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function deleteReport(id: number) {
  return useApiFetch(`reports/${id}`, 'DELETE');
}

export async function executeSavedReport(id: number, filters?: Record<string, unknown>): Promise<unknown> {
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

export interface ReportConfig {
  entityType: 'LEAD' | 'DEAL' | 'OPPORTUNITY' | 'CLIENT';
  columns?: string[];
  filters?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
    value: string | number | boolean | string[] | number[];
  }>;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface ReportAnalytics {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  timeline: Array<{ month: string; count: number }>;
  valueMetrics: {
    totalValue: number;
    avgValue: number;
    maxValue: number;
  } | null;
}

export async function executeReportConfig(config: ReportConfig) {
  return useApiFetch('report-builder/execute', 'POST', config as unknown as Record<string, unknown>);
}

export async function exportReportCSV(config: ReportConfig): Promise<Blob> {
  const response = await fetch(`${useRuntimeConfig().public.apiBaseUrl}/report-builder/export-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(config)
  });

  if (!response.ok) throw new Error('CSV export failed');
  return response.blob();
}

export async function exportReportExcel(config: ReportConfig): Promise<Blob> {
  const response = await fetch(`${useRuntimeConfig().public.apiBaseUrl}/report-builder/export-excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(config)
  });

  if (!response.ok) throw new Error('Excel export failed');
  return response.blob();
}

export async function fetchReportAnalytics(entityType: string, startDate?: string, endDate?: string): Promise<ReportAnalytics | null> {
  const params = new URLSearchParams({ entityType });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const { body, success } = await useApiFetch(`report-builder/analytics?${params.toString()}`);
  if (success && body) {
    return body as ReportAnalytics;
  }
  return null;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
