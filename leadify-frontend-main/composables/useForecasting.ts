/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface ForecastPeriod {
  id: string;
  userId: string;
  user?: { id: string; name: string };
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  target: number;
  predicted: number;
  actual: number;
  closedWon: number;
  closedLost: number;
  pipeline: number;
}

export async function fetchForecasts(query?: Record<string, string>): Promise<{ docs: ForecastPeriod[]; pagination: unknown }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`forecasting${qs}`);
  if (success && body) {
    return body as { docs: ForecastPeriod[]; pagination: unknown };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchForecastByPeriod(period: string, startDate: string, endDate: string): Promise<ForecastPeriod[]> {
  const qs = `?period=${period}&startDate=${startDate}&endDate=${endDate}`;
  const { body, success } = await useApiFetch(`forecasting/period${qs}`);
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function fetchForecastByUser(userId: string): Promise<ForecastPeriod[]> {
  const { body, success } = await useApiFetch(`forecasting/user/${userId}`);
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function createForecast(data: Partial<ForecastPeriod>) {
  return useApiFetch('forecasting', 'POST', data as Record<string, unknown>);
}

export async function updateForecast(id: string, data: Partial<ForecastPeriod>) {
  return useApiFetch(`forecasting/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function calculateFromPipeline(userId: string, period: string) {
  return useApiFetch('forecasting/calculate', 'POST', { userId, period });
}

export async function fetchHistoricalComparison(period: string, startDate: string, endDate: string) {
  const qs = `?period=${period}&startDate=${startDate}&endDate=${endDate}`;
  return useApiFetch(`forecasting/historical-comparison${qs}`);
}

export async function runScenario(winRateAdjustment: number, dealValueAdjustment: number) {
  return useApiFetch('forecasting/scenario', 'POST', { winRateAdjustment, dealValueAdjustment });
}

export async function fetchTeamBreakdown(period: string, startDate: string, endDate: string) {
  const qs = `?period=${period}&startDate=${startDate}&endDate=${endDate}`;
  return useApiFetch(`forecasting/team-breakdown${qs}`);
}
