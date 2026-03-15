/**
 * state - Unit Tests
 * ====================
 * Tests for composables/state.ts
 *
 * The module provides:
 * - usetoken(): global state for auth token (deprecated, kept for backward compat)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useState to simulate Nuxt's useState composable
const stateStore = new Map<string, { value: unknown }>();

const mockUseState = vi.fn((key: string, init?: () => unknown) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, { value: init ? init() : undefined });
  }
  return stateStore.get(key)!;
});

(globalThis as Record<string, unknown>).useState = mockUseState;

import { usetoken } from '@/composables/state';

describe('state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateStore.clear();
  });

  // ============================================
  // usetoken
  // ============================================
  describe('usetoken', () => {
    it('should initialize token state to null', () => {
      const token = usetoken();
      expect(token.value).toBeNull();
    });

    it('should call useState with key "tokenlocal"', () => {
      usetoken();
      expect(mockUseState).toHaveBeenCalledWith('tokenlocal', expect.any(Function));
    });

    it('should allow setting a token value', () => {
      const token = usetoken();
      token.value = 'test-jwt-token-123';
      expect(token.value).toBe('test-jwt-token-123');
    });

    it('should allow resetting token to null', () => {
      const token = usetoken();
      token.value = 'some-token';
      token.value = null;
      expect(token.value).toBeNull();
    });

    it('should return the same state ref on multiple calls', () => {
      const token1 = usetoken();
      const token2 = usetoken();

      token1.value = 'shared-token';

      // Both should point to same state
      expect(token2.value).toBe('shared-token');
    });

    it('should accept string token values', () => {
      const token = usetoken();
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      token.value = testToken;

      expect(token.value).toBe(testToken);
    });

    it('should return state that can be typed as string or null', () => {
      const token = usetoken();

      // Should be null initially
      expect(token.value).toBeNull();

      // Should accept string
      token.value = 'valid-token';
      expect(typeof token.value).toBe('string');

      // Should accept null again
      token.value = null;
      expect(token.value).toBeNull();
    });

    it('should use the factory function to initialize state', () => {
      usetoken();

      // Verify the init function was called (useState is called with a factory)
      const [, initFn] = mockUseState.mock.calls[0];
      expect(typeof initFn).toBe('function');
      expect(initFn()).toBeNull();
    });
  });
});
