/**
 * useWorkflows - Unit Tests
 * ===========================
 * Tests for composables/useWorkflows.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  ENTITY_TYPES,
  TRIGGER_TYPES,
  CONDITION_OPERATORS,
  ACTION_TYPES,
  useWorkflows
} from '~/composables/useWorkflows';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

const mockT = (key: string) => key;
(globalThis as any).useI18n = () => ({ t: mockT });

vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args),
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}));

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Constants
  // ============================================
  describe('constants', () => {
    it('should have 7 entity types', () => {
      expect(ENTITY_TYPES).toHaveLength(7);
    });

    it('should have 6 trigger types', () => {
      expect(TRIGGER_TYPES).toHaveLength(6);
    });

    it('should have 9 condition operators', () => {
      expect(CONDITION_OPERATORS).toHaveLength(9);
    });

    it('should have 8 action types', () => {
      expect(ACTION_TYPES).toHaveLength(8);
    });

    it('should include ON_CREATE trigger', () => {
      expect(TRIGGER_TYPES.find((t: any) => t.value === 'ON_CREATE')).toBeDefined();
    });

    it('should include lead entity type', () => {
      expect(ENTITY_TYPES.find((e: any) => e.value === 'lead')).toBeDefined();
    });
  });

  // ============================================
  // useWorkflows composable
  // ============================================
  describe('composable', () => {
    it('should return reactive state and functions', () => {
      const wf = useWorkflows();
      expect(wf).toHaveProperty('workflows');
      expect(wf).toHaveProperty('loading');
      expect(wf).toHaveProperty('fetchWorkflows');
      expect(wf).toHaveProperty('fetchWorkflowById');
      expect(wf).toHaveProperty('createWorkflow');
      expect(wf).toHaveProperty('updateWorkflow');
      expect(wf).toHaveProperty('deleteWorkflow');
      expect(wf).toHaveProperty('toggleWorkflow');
    });

    it('should have loading default to false', () => {
      const wf = useWorkflows();
      expect(wf.loading.value).toBe(false);
    });
  });
});
