/* eslint-disable require-await */
export interface ReportBuilderConfig {
  entityType: string;
  columns: string[];
  filters: { field: string; operator: string; value: unknown }[];
  groupBy?: string;
  chartType?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface SavedReport {
  id: string;
  name: string;
  entityType: string;
  config: ReportBuilderConfig;
  createdAt: string;
}

export const ENTITY_COLUMNS: Record<string, string[]> = {
  LEAD: ['id', 'name', 'email', 'phone', 'companyName', 'leadSource', 'status', 'score', 'createdAt'],
  DEAL: ['id', 'name', 'stage', 'price', 'contractType', 'signatureDate', 'createdAt'],
  OPPORTUNITY: ['id', 'name', 'stage', 'estimatedValue', 'expectedCloseDate', 'priority', 'createdAt'],
  CLIENT: ['id', 'name', 'email', 'phone', 'companyName', 'createdAt']
};

export const FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In' }
];

export async function fetchSavedReports(): Promise<SavedReport[]> {
  const { body, success } = await useApiFetch('report-builder');
  if (success && Array.isArray(body)) return body;
  return [];
}

export async function createSavedReport(data: { name: string; entityType: string; config: ReportBuilderConfig }) {
  return useApiFetch('report-builder', 'POST', data as unknown);
}

export async function updateSavedReport(id: string, data: unknown) {
  return useApiFetch(`report-builder/${id}`, 'PUT', data);
}

export async function deleteSavedReport(id: string) {
  return useApiFetch(`report-builder/${id}`, 'DELETE');
}

export async function executeReport(config: ReportBuilderConfig) {
  const { body, success } = await useApiFetch('report-builder/execute', 'POST', config as unknown);
  if (success && Array.isArray(body)) return body;
  return [];
}

export async function exportReportBuilderCSV(config: ReportBuilderConfig) {
  const { body, success } = await useApiFetch('report-builder/export-csv', 'POST', config as unknown);
  return body;
}
