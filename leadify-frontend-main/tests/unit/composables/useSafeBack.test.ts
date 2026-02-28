/**
 * useSafeBack - Unit Tests
 * =========================
 * Tests for composables/useSafeBack.ts
 *
 * The composable returns a `goBack` function that:
 * - Calls `router.back()` when there is browser history (window.history.length > 1)
 * - Calls `router.push(fallbackPath)` when there is no history
 * - Falls back to '/' when no fallbackPath is provided
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the mock router so we can assert on it
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn()
};

// Override the global useRouter mock from setup.ts
(globalThis as any).useRouter = () => mockRouter;

import { useSafeBack } from '~/composables/useSafeBack';

describe('useSafeBack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Return Value
  // ============================================
  describe('return value', () => {
    it('should return an object with goBack function', () => {
      const result = useSafeBack();
      expect(result).toHaveProperty('goBack');
      expect(result.goBack).toBeTypeOf('function');
    });
  });

  // ============================================
  // With Browser History
  // ============================================
  describe('when browser history exists (history.length > 1)', () => {
    beforeEach(() => {
      // Simulate browser history with multiple entries
      Object.defineProperty(window, 'history', {
        value: { length: 3 },
        writable: true,
        configurable: true
      });
    });

    it('should call router.back() when history exists', () => {
      const { goBack } = useSafeBack();
      goBack();
      expect(mockRouter.back).toHaveBeenCalledOnce();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should call router.back() even if fallbackPath is provided', () => {
      const { goBack } = useSafeBack('/dashboard');
      goBack();
      expect(mockRouter.back).toHaveBeenCalledOnce();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Without Browser History
  // ============================================
  describe('when no browser history (history.length <= 1)', () => {
    beforeEach(() => {
      // Simulate no browser history (fresh tab / direct navigation)
      Object.defineProperty(window, 'history', {
        value: { length: 1 },
        writable: true,
        configurable: true
      });
    });

    it('should call router.push with fallbackPath', () => {
      const { goBack } = useSafeBack('/sales/leads');
      goBack();
      expect(mockRouter.push).toHaveBeenCalledWith('/sales/leads');
      expect(mockRouter.back).not.toHaveBeenCalled();
    });

    it('should call router.push with "/" when no fallbackPath is provided', () => {
      const { goBack } = useSafeBack();
      goBack();
      expect(mockRouter.push).toHaveBeenCalledWith('/');
      expect(mockRouter.back).not.toHaveBeenCalled();
    });

    it('should call router.push with "/" when fallbackPath is undefined', () => {
      const { goBack } = useSafeBack(undefined);
      goBack();
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('edge cases', () => {
    it('should handle empty string fallbackPath', () => {
      Object.defineProperty(window, 'history', {
        value: { length: 0 },
        writable: true,
        configurable: true
      });
      const { goBack } = useSafeBack('');
      goBack();
      // empty string is falsy, so it falls back to '/'
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('should handle history.length of exactly 1 (boundary)', () => {
      Object.defineProperty(window, 'history', {
        value: { length: 1 },
        writable: true,
        configurable: true
      });
      const { goBack } = useSafeBack('/fallback');
      goBack();
      // history.length <= 1 means no "back" available
      expect(mockRouter.push).toHaveBeenCalledWith('/fallback');
      expect(mockRouter.back).not.toHaveBeenCalled();
    });

    it('should handle history.length of exactly 2 (has history)', () => {
      Object.defineProperty(window, 'history', {
        value: { length: 2 },
        writable: true,
        configurable: true
      });
      const { goBack } = useSafeBack('/fallback');
      goBack();
      expect(mockRouter.back).toHaveBeenCalledOnce();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should be callable multiple times', () => {
      Object.defineProperty(window, 'history', {
        value: { length: 5 },
        writable: true,
        configurable: true
      });
      const { goBack } = useSafeBack('/dashboard');
      goBack();
      goBack();
      goBack();
      expect(mockRouter.back).toHaveBeenCalledTimes(3);
    });
  });
});
