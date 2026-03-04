/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface SequenceStep {
  order: number;
  type: string;
  subject: string;
  body: string;
  delayDays: number;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  entityType: string;
  entityId: string;
  currentStep: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  nextRunAt?: string;
  createdAt?: string;
}

export interface SequenceStats {
  totalEnrolled: number;
  active: number;
  paused: number;
  completed: number;
  cancelled: number;
}

export async function fetchSequences(query?: Record<string, string>): Promise<{ docs: Sequence[]; pagination: any }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`sequences${qs}`);
  if (success && body) {
    return body as { docs: Sequence[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function createSequence(data: Partial<Sequence>) {
  return useApiFetch('sequences', 'POST', data as Record<string, any>);
}

export async function updateSequence(id: string, data: Partial<Sequence>) {
  return useApiFetch(`sequences/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteSequence(id: string) {
  return useApiFetch(`sequences/${id}`, 'DELETE');
}

export async function enrollEntity(sequenceId: string, entityType: string, entityId: string) {
  return useApiFetch(`sequences/${sequenceId}/enroll`, 'POST', { entityType, entityId });
}

export async function advanceStep(enrollmentId: string) {
  return useApiFetch(`sequences/enrollments/${enrollmentId}/advance`, 'PATCH');
}

export async function pauseEnrollment(enrollmentId: string) {
  return useApiFetch(`sequences/enrollments/${enrollmentId}/pause`, 'PATCH');
}

export async function resumeEnrollment(enrollmentId: string) {
  return useApiFetch(`sequences/enrollments/${enrollmentId}/resume`, 'PATCH');
}

export async function fetchEnrollments(sequenceId: string): Promise<SequenceEnrollment[]> {
  const { body, success } = await useApiFetch(`sequences/${sequenceId}/enrollments`);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function fetchSequenceStats(sequenceId: string): Promise<SequenceStats> {
  const { body, success } = await useApiFetch(`sequences/${sequenceId}/stats`);
  if (success && body) {
    return body as SequenceStats;
  }
  return { totalEnrolled: 0, active: 0, paused: 0, completed: 0, cancelled: 0 };
}
