/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface DashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'pipeline' | 'activity' | 'leaderboard';
  title: string;
  config: Record<string, unknown>;
  width: number; // grid columns (1-12)
  height: number;
  position: { x: number; y: number };
}

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchDashboards(): Promise<Dashboard[]> {
  const { body, success } = await useApiFetch('dashboards');
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function fetchDashboard(id: number): Promise<Dashboard | null> {
  const { body, success } = await useApiFetch(`dashboards/${id}`);
  return success && body ? (body as Dashboard) : null;
}

export async function createDashboard(data: Partial<Dashboard>) {
  return useApiFetch('dashboards', 'POST', data as Record<string, unknown>);
}

export async function updateDashboard(id: number, data: Partial<Dashboard>) {
  return useApiFetch(`dashboards/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function deleteDashboard(id: number) {
  return useApiFetch(`dashboards/${id}`, 'DELETE');
}

export async function fetchWidgetData(widgetConfig: Record<string, unknown>): Promise<<unknown> {
  const { body, success } = await useApiFetch('dashboards/widget-data', 'POST', widgetConfig);
  return success && body ? body : null;
}

export async function fetchExecutiveSummary(): Promise<<unknown> {
  const { body, success } = await useApiFetch('dashboards/executive-summary');
  return success && body ? body : null;
}

export async function fetchPipelineData(dateRange?: { start: string; end: string }): Promise<<unknown> {
  const qs = dateRange ? `?startDate=${dateRange.start}&endDate=${dateRange.end}` : '';
  const { body, success } = await useApiFetch(`dashboards/pipeline${qs}`);
  return success && body ? body : null;
}

export async function fetchRevenueChart(period: string = 'monthly', dateRange?: { start: string; end: string }): Promise<<unknown> {
  const params = new URLSearchParams({ period });
  if (dateRange) {
    params.set('startDate', dateRange.start);
    params.set('endDate', dateRange.end);
  }
  const { body, success } = await useApiFetch(`dashboards/revenue?${params.toString()}`);
  return success && body ? body : null;
}

export async function fetchTeamPerformance(dateRange?: { start: string; end: string }): Promise<<unknown> {
  const qs = dateRange ? `?startDate=${dateRange.start}&endDate=${dateRange.end}` : '';
  const { body, success } = await useApiFetch(`dashboards/team-performance${qs}`);
  return success && body ? body : null;
}
