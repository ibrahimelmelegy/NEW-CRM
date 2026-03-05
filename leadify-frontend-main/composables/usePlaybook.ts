import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  resources?: string[];
}

export interface PlaybookStage {
  id: string;
  name: string;
  description: string;
  order: number;
  steps: PlaybookStep[];
  tips: string[];
}

export interface PlaybookData {
  id: string;
  name: string;
  description: string;
  stages: PlaybookStage[];
  isActive: boolean;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function usePlaybook() {
  const playbooks = ref<PlaybookData[]>([]);
  const selectedPlaybook = ref<PlaybookData | null>(null);
  const loading = ref(false);

  /**
   * Get progress from localStorage for a given playbook and optional deal.
   * Progress stored as: { [playbookId-dealId]: { [stepId]: boolean } }
   */
  function getProgress(playbookId: string, forDealId?: string): Record<string, boolean> {
    const key = `playbook_progress_${playbookId}_${forDealId || 'global'}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Toggle a step's completion status.
   */
  function toggleStep(playbookId: string, stepId: string, forDealId?: string) {
    const key = `playbook_progress_${playbookId}_${forDealId || 'global'}`;
    const progress = getProgress(playbookId, forDealId);
    progress[stepId] = !progress[stepId];
    localStorage.setItem(key, JSON.stringify(progress));
  }

  /**
   * Calculate completion percentage for a specific stage.
   */
  function getStageCompletion(playbookId: string, stage: PlaybookStage, forDealId?: string): number {
    if (!stage.steps || stage.steps.length === 0) return 0;
    const progress = getProgress(playbookId, forDealId);
    const completed = stage.steps.filter(step => progress[step.id]).length;
    return Math.round((completed / stage.steps.length) * 100);
  }

  /**
   * Calculate overall completion percentage across all stages.
   */
  function getOverallCompletion(playbookId: string, forDealId?: string): number {
    if (!selectedPlaybook.value || !selectedPlaybook.value.stages) return 0;
    const progress = getProgress(playbookId, forDealId);
    const allSteps = selectedPlaybook.value.stages.flatMap(s => s.steps);
    if (allSteps.length === 0) return 0;
    const completed = allSteps.filter(step => progress[step.id]).length;
    return Math.round((completed / allSteps.length) * 100);
  }

  /**
   * Reset progress for a given playbook and optional deal.
   */
  function resetProgress(playbookId: string, forDealId?: string) {
    const key = `playbook_progress_${playbookId}_${forDealId || 'global'}`;
    localStorage.removeItem(key);
  }

  /**
   * Fetch all playbooks from the API.
   */
  async function fetchPlaybooks() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('playbook');
      if (success && body) {
        playbooks.value = body as PlaybookData[];
        if (playbooks.value.length > 0 && !selectedPlaybook.value) {
          selectedPlaybook.value = playbooks.value[0] as unknown;
        }
      }
    } catch (e) {
      console.error('Failed to fetch playbooks', e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new playbook.
   */
  async function createPlaybook(data: Partial<PlaybookData>) {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('playbook', 'POST', data as Record<string, unknown>);
      if (success && body) {
        playbooks.value.push(body as PlaybookData);
      }
      return { body, success };
    } catch (e) {
      console.error('Failed to create playbook', e);
      return { body: null, success: false };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing playbook.
   */
  async function updatePlaybook(id: string, data: Partial<PlaybookData>) {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch(`playbook/${id}`, 'PUT', data as Record<string, unknown>);
      if (success && body) {
        const idx = playbooks.value.findIndex(p => p.id === id);
        if (idx !== -1) playbooks.value[idx] = body as PlaybookData;
        if (selectedPlaybook.value?.id === id) selectedPlaybook.value = body as PlaybookData;
      }
      return { body, success };
    } catch (e) {
      console.error('Failed to update playbook', e);
      return { body: null, success: false };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a playbook.
   */
  async function deletePlaybook(id: string) {
    loading.value = true;
    try {
      const { success } = await useApiFetch(`playbook/${id}`, 'DELETE');
      if (success) {
        playbooks.value = playbooks.value.filter(p => p.id !== id);
        if (selectedPlaybook.value?.id === id) {
          selectedPlaybook.value = playbooks.value[0] || null;
        }
      }
      return { success };
    } catch (e) {
      console.error('Failed to delete playbook', e);
      return { success: false };
    } finally {
      loading.value = false;
    }
  }

  return {
    playbooks,
    selectedPlaybook,
    loading,
    fetchPlaybooks,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    getProgress,
    toggleStep,
    getStageCompletion,
    getOverallCompletion,
    resetProgress
  };
}
