/* eslint-disable require-await */
import { useApiFetch } from './useApiFetch';

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
  entityType: string;
  isDefault: boolean;
  isWon: boolean;
  isLost: boolean;
}

export async function fetchPipelineStages(entityType?: string): Promise<PipelineStage[]> {
  const qs = entityType ? `?entityType=${entityType}` : '';
  const { body, success } = await useApiFetch(`pipeline-config${qs}`);
  if (success && body) {
    const data = body as unknown;
    const stages: PipelineStage[] = data.docs || data || [];
    return stages.sort((a, b) => a.order - b.order);
  }
  return [];
}

export async function createPipelineStage(data: Partial<PipelineStage>) {
  return useApiFetch('pipeline-config', 'POST', data as Record<string, unknown>);
}

export async function updatePipelineStage(id: string, data: Partial<PipelineStage>) {
  return useApiFetch(`pipeline-config/${id}`, 'PUT', data as Record<string, unknown>);
}

export async function deletePipelineStage(id: string) {
  return useApiFetch(`pipeline-config/${id}`, 'DELETE');
}

export async function reorderPipelineStages(entityType: string, stageIds: string[]) {
  return useApiFetch('pipeline-config/reorder', 'POST', { entityType, stageIds });
}
