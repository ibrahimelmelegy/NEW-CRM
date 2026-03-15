/**
 * usePlaybook - Unit Tests
 * ==========================
 * Tests for composables/usePlaybook.ts
 *
 * The composable provides:
 * - fetchPlaybooks(): Fetch all playbooks from API
 * - createPlaybook(data): Create a new playbook
 * - updatePlaybook(id, data): Update an existing playbook
 * - deletePlaybook(id): Delete a playbook
 * - getProgress(playbookId, forDealId?): Get step progress from localStorage
 * - toggleStep(playbookId, stepId, forDealId?): Toggle a step completion
 * - getStageCompletion(playbookId, stage, forDealId?): Get stage completion %
 * - getOverallCompletion(playbookId, forDealId?): Get overall completion %
 * - resetProgress(playbookId, forDealId?): Clear progress from localStorage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlaybook, type PlaybookData, type PlaybookStage } from '~/composables/usePlaybook';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockApiFetch(...args)
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('usePlaybook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ============================================
  // fetchPlaybooks
  // ============================================
  describe('fetchPlaybooks', () => {
    it('should call the correct API endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true, body: [] });

      const { fetchPlaybooks } = usePlaybook();
      await fetchPlaybooks();

      expect(mockApiFetch).toHaveBeenCalledWith('playbook');
    });

    it('should populate playbooks on success', async () => {
      const mockPlaybooks: PlaybookData[] = [
        { id: 'pb-1', name: 'Sales Playbook', description: 'Standard sales process', stages: [], isActive: true },
        { id: 'pb-2', name: 'Onboarding Playbook', description: 'Client onboarding', stages: [], isActive: true }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: mockPlaybooks });

      const { fetchPlaybooks, playbooks } = usePlaybook();
      await fetchPlaybooks();

      expect(playbooks.value).toHaveLength(2);
      expect(playbooks.value[0]?.name).toBe('Sales Playbook');
    });

    it('should set the first playbook as selectedPlaybook when none is selected', async () => {
      const mockPlaybooks: PlaybookData[] = [
        { id: 'pb-1', name: 'First Playbook', description: 'desc', stages: [], isActive: true }
      ];
      mockApiFetch.mockResolvedValue({ success: true, body: mockPlaybooks });

      const { fetchPlaybooks, selectedPlaybook } = usePlaybook();
      expect(selectedPlaybook.value).toBeNull();

      await fetchPlaybooks();

      expect(selectedPlaybook.value?.id).toBe('pb-1');
    });

    it('should manage loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockApiFetch.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));

      const { fetchPlaybooks, loading } = usePlaybook();

      expect(loading.value).toBe(false);
      const promise = fetchPlaybooks();
      expect(loading.value).toBe(true);

      resolvePromise!({ success: true, body: [] });
      await promise;
      expect(loading.value).toBe(false);
    });

    it('should handle fetch failure gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const { fetchPlaybooks, playbooks, loading } = usePlaybook();
      await fetchPlaybooks();

      expect(loading.value).toBe(false);
      // Playbooks should remain unchanged
      expect(playbooks.value).toBeDefined();
    });
  });

  // ============================================
  // createPlaybook
  // ============================================
  describe('createPlaybook', () => {
    it('should call the correct API endpoint with POST method', async () => {
      const newPlaybook = { name: 'New Playbook', description: 'Description', stages: [], isActive: true };
      mockApiFetch.mockResolvedValue({ success: true, body: { id: 'pb-new', ...newPlaybook } });

      const { createPlaybook } = usePlaybook();
      await createPlaybook(newPlaybook);

      expect(mockApiFetch).toHaveBeenCalledWith('playbook', 'POST', expect.objectContaining({ name: 'New Playbook' }));
    });

    it('should add new playbook to playbooks list on success', async () => {
      const newPlaybook = { name: 'New Playbook', description: 'Description', stages: [], isActive: true };
      const createdPlaybook = { id: 'pb-new', ...newPlaybook };
      mockApiFetch.mockResolvedValue({ success: true, body: createdPlaybook });

      const { createPlaybook, playbooks } = usePlaybook();
      await createPlaybook(newPlaybook);

      expect(playbooks.value).toHaveLength(1);
      expect(playbooks.value[0]?.id).toBe('pb-new');
    });

    it('should return success response object', async () => {
      const newPlaybook = { name: 'Test', description: '', stages: [], isActive: true };
      const createdPlaybook = { id: 'pb-1', ...newPlaybook };
      mockApiFetch.mockResolvedValue({ success: true, body: createdPlaybook });

      const { createPlaybook } = usePlaybook();
      const result = await createPlaybook(newPlaybook);

      expect(result.success).toBe(true);
      expect(result.body).toEqual(createdPlaybook);
    });

    it('should return failure response when API fails', async () => {
      mockApiFetch.mockResolvedValue({ success: false, body: null });

      const { createPlaybook } = usePlaybook();
      const result = await createPlaybook({ name: 'Bad' });

      expect(result.success).toBe(false);
    });

    it('should handle thrown errors and return failure', async () => {
      mockApiFetch.mockRejectedValue(new Error('Server error'));

      const { createPlaybook } = usePlaybook();
      const result = await createPlaybook({ name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.body).toBeNull();
    });
  });

  // ============================================
  // updatePlaybook
  // ============================================
  describe('updatePlaybook', () => {
    it('should call the correct API endpoint with PUT method', async () => {
      const updatedPlaybook = { id: 'pb-1', name: 'Updated Playbook', description: 'Updated', stages: [], isActive: true };
      mockApiFetch.mockResolvedValue({ success: true, body: updatedPlaybook });

      const { updatePlaybook } = usePlaybook();
      await updatePlaybook('pb-1', { name: 'Updated Playbook' });

      expect(mockApiFetch).toHaveBeenCalledWith('playbook/pb-1', 'PUT', expect.objectContaining({ name: 'Updated Playbook' }));
    });

    it('should update playbook in the list on success', async () => {
      const initial = { id: 'pb-1', name: 'Old Name', description: '', stages: [], isActive: true };
      const updated = { ...initial, name: 'New Name' };

      mockApiFetch
        .mockResolvedValueOnce({ success: true, body: [initial] }) // fetchPlaybooks
        .mockResolvedValueOnce({ success: true, body: updated }); // updatePlaybook

      const { fetchPlaybooks, updatePlaybook, playbooks } = usePlaybook();
      await fetchPlaybooks();

      await updatePlaybook('pb-1', { name: 'New Name' });

      expect(playbooks.value[0]?.name).toBe('New Name');
    });

    it('should update selectedPlaybook if it matches the updated id', async () => {
      const initial = { id: 'pb-1', name: 'Old', description: '', stages: [], isActive: true };
      const updated = { ...initial, name: 'Updated' };

      mockApiFetch
        .mockResolvedValueOnce({ success: true, body: [initial] })
        .mockResolvedValueOnce({ success: true, body: updated });

      const { fetchPlaybooks, updatePlaybook, selectedPlaybook } = usePlaybook();
      await fetchPlaybooks();

      expect(selectedPlaybook.value?.name).toBe('Old');
      await updatePlaybook('pb-1', { name: 'Updated' });
      expect(selectedPlaybook.value?.name).toBe('Updated');
    });
  });

  // ============================================
  // deletePlaybook
  // ============================================
  describe('deletePlaybook', () => {
    it('should call the correct DELETE endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { deletePlaybook } = usePlaybook();
      await deletePlaybook('pb-1');

      expect(mockApiFetch).toHaveBeenCalledWith('playbook/pb-1', 'DELETE');
    });

    it('should remove playbook from list on success', async () => {
      const playbooks_data = [
        { id: 'pb-1', name: 'Playbook 1', description: '', stages: [], isActive: true },
        { id: 'pb-2', name: 'Playbook 2', description: '', stages: [], isActive: true }
      ];

      mockApiFetch
        .mockResolvedValueOnce({ success: true, body: playbooks_data })
        .mockResolvedValueOnce({ success: true });

      const { fetchPlaybooks, deletePlaybook, playbooks } = usePlaybook();
      await fetchPlaybooks();

      await deletePlaybook('pb-1');

      expect(playbooks.value).toHaveLength(1);
      expect(playbooks.value[0]?.id).toBe('pb-2');
    });

    it('should return success flag', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      const { deletePlaybook } = usePlaybook();
      const result = await deletePlaybook('pb-1');

      expect(result.success).toBe(true);
    });

    it('should handle deletion failure gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Delete failed'));

      const { deletePlaybook } = usePlaybook();
      const result = await deletePlaybook('pb-1');

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // getProgress / toggleStep / resetProgress
  // ============================================
  describe('getProgress', () => {
    it('should return empty object when no progress saved', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { getProgress } = usePlaybook();
      const result = getProgress('pb-1');

      expect(result).toEqual({});
    });

    it('should return saved progress from localStorage', () => {
      const savedProgress = { 'step-1': true, 'step-2': false };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedProgress));

      const { getProgress } = usePlaybook();
      const result = getProgress('pb-1', 'deal-1');

      expect(result).toEqual(savedProgress);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('playbook_progress_pb-1_deal-1');
    });

    it('should use "global" key when no dealId provided', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { getProgress } = usePlaybook();
      getProgress('pb-1');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('playbook_progress_pb-1_global');
    });

    it('should return empty object on JSON parse error', () => {
      localStorageMock.getItem.mockReturnValue('invalid json{');

      const { getProgress } = usePlaybook();
      const result = getProgress('pb-1');

      expect(result).toEqual({});
    });
  });

  describe('toggleStep', () => {
    it('should toggle a step from false to true', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ 'step-1': false }));

      const { toggleStep } = usePlaybook();
      toggleStep('pb-1', 'step-1');

      const savedValue = JSON.parse(localStorageMock.setItem.mock.calls[0]?.[1] || '{}');
      expect(savedValue['step-1']).toBe(true);
    });

    it('should toggle a step from true to false', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ 'step-1': true }));

      const { toggleStep } = usePlaybook();
      toggleStep('pb-1', 'step-1');

      const savedValue = JSON.parse(localStorageMock.setItem.mock.calls[0]?.[1] || '{}');
      expect(savedValue['step-1']).toBe(false);
    });

    it('should save progress to correct localStorage key', () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const { toggleStep } = usePlaybook();
      toggleStep('pb-1', 'step-1', 'deal-5');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('playbook_progress_pb-1_deal-5', expect.any(String));
    });
  });

  describe('getStageCompletion', () => {
    it('should return 0 when stage has no steps', () => {
      const stage: PlaybookStage = { id: 's1', name: 'Stage 1', description: '', order: 1, steps: [], tips: [] };

      const { getStageCompletion } = usePlaybook();
      const result = getStageCompletion('pb-1', stage);

      expect(result).toBe(0);
    });

    it('should return 100 when all steps are completed', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ 'step-1': true, 'step-2': true }));

      const stage: PlaybookStage = {
        id: 's1',
        name: 'Stage 1',
        description: '',
        order: 1,
        steps: [
          { id: 'step-1', title: 'Step 1', description: '', estimatedMinutes: 10 },
          { id: 'step-2', title: 'Step 2', description: '', estimatedMinutes: 15 }
        ],
        tips: []
      };

      const { getStageCompletion } = usePlaybook();
      const result = getStageCompletion('pb-1', stage);

      expect(result).toBe(100);
    });

    it('should return 50 when half of steps are completed', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ 'step-1': true, 'step-2': false }));

      const stage: PlaybookStage = {
        id: 's1',
        name: 'Stage 1',
        description: '',
        order: 1,
        steps: [
          { id: 'step-1', title: 'Step 1', description: '', estimatedMinutes: 10 },
          { id: 'step-2', title: 'Step 2', description: '', estimatedMinutes: 15 }
        ],
        tips: []
      };

      const { getStageCompletion } = usePlaybook();
      const result = getStageCompletion('pb-1', stage);

      expect(result).toBe(50);
    });
  });

  describe('resetProgress', () => {
    it('should remove progress from localStorage', () => {
      const { resetProgress } = usePlaybook();
      resetProgress('pb-1', 'deal-1');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('playbook_progress_pb-1_deal-1');
    });

    it('should use "global" key when no dealId provided', () => {
      const { resetProgress } = usePlaybook();
      resetProgress('pb-1');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('playbook_progress_pb-1_global');
    });
  });
});
