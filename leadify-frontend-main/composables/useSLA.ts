/* eslint-disable no-use-before-define */
/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface SLAPolicy {
  id: number;
  name: string;
  entityType: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  conditions?: Record<string, any>;
  escalationRules?: EscalationRule[];
  businessHoursOnly: boolean;
  businessHours?: Record<string, any>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EscalationRule {
  level: number;
  afterMinutes: number;
  notifyUserId?: number;
  notifyRole?: string;
  action?: string;
}

export interface SLAMetrics {
  onTimeRate: number;
  breachedCount: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  totalTracked: number;
}

export async function fetchSLAPolicies(query?: Record<string, string>): Promise<{ docs: SLAPolicy[]; pagination: any }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`sla/policies${qs}`);
  if (success && body) {
    return body as { docs: SLAPolicy[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function createSLAPolicy(data: Partial<SLAPolicy>) {
  return useApiFetch('sla/policies', 'POST', data as Record<string, any>);
}

export async function updateSLAPolicy(id: number, data: Partial<SLAPolicy>) {
  return useApiFetch(`sla/policies/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteSLAPolicy(id: number) {
  return useApiFetch(`sla/policies/${id}`, 'DELETE');
}

export async function getSLAStatus(entityType: string, entityId: number) {
  const { body, success } = await useApiFetch(`sla/status/${entityType}/${entityId}`);
  return success ? body : null;
}

export async function getSLAMetrics(entityType: string, query?: Record<string, string>): Promise<SLAMetrics | null> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`sla/metrics/${entityType}${qs}`);
  return success ? (body as SLAMetrics) : null;
}

export async function checkBreaches() {
  return useApiFetch('sla/check-breaches', 'POST');
}

export async function pauseSLA(entityType: string, entityId: number) {
  return useApiFetch(`sla/${entityType}/${entityId}/pause`, 'PATCH');
}

export async function resumeSLA(entityType: string, entityId: number) {
  return useApiFetch(`sla/${entityType}/${entityId}/resume`, 'PATCH');
}
