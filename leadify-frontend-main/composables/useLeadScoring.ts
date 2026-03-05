/* eslint-disable no-use-before-define */
/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface ScoringRule {
  id: number;
  name: string;
  entityType: string;
  criteria: ScoringCriteria[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoringCriteria {
  field: string;
  operator: string;
  value: unknown;
  points: number;
}

export interface GradeThreshold {
  grade: string;
  label: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export async function fetchScoringRules(): Promise<ScoringRule[]> {
  const { body, success } = await useApiFetch('lead-scoring/rules');
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function createScoringRule(data: Partial<ScoringRule>) {
  return useApiFetch('lead-scoring/rules', 'POST', data as Record<string, unknown>);
}

export async function updateScoringRule(id: number, data: Partial<ScoringRule>) {
  return useApiFetch(`lead-scoring/rules/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function deleteScoringRule(id: number) {
  return useApiFetch(`lead-scoring/rules/${id}`, 'DELETE');
}

export async function calculateScore(entityType: string, entityId: number) {
  return useApiFetch(`lead-scoring/calculate/${entityType}/${entityId}`, 'POST');
}

export async function bulkCalculateScores(entityType: string) {
  return useApiFetch(`lead-scoring/calculate/${entityType}`, 'POST');
}

export async function getScore(entityType: string, entityId: number) {
  const { body, success } = await useApiFetch(`lead-scoring/scores/${entityType}/${entityId}`);
  return success ? body : null;
}

export async function getTopScored(entityType: string) {
  const { body, success } = await useApiFetch(`lead-scoring/top/${entityType}`);
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}

export async function getGradeThresholds(): Promise<GradeThreshold[]> {
  const { body, success } = await useApiFetch('lead-scoring/grades');
  if (success && body) {
    const data = body as unknown;
    return data.docs || data || [];
  }
  return [];
}
