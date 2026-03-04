/**
 * useErrorHandler - Unit Tests
 * ==============================
 * Tests for composables/useErrorHandler.ts
 *
 * Exports:
 * - useErrorHandler() => { handleApiError, handleWarning, handleSuccess }
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useErrorHandler } from '~/composables/useErrorHandler';

// Mock ElNotification
const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

// Mock useI18n
(globalThis as any).useI18n = () => ({
  t: (key: string) => key,
  locale: { value: 'en' }
});

// Must mock element-plus before importing
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args)
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // handleApiError
  // ============================================
  describe('handleApiError', () => {
    it('should return error result with message from Error instance', () => {
      const { handleApiError } = useErrorHandler();
      const result = handleApiError(new Error('Network failed'), 'fetchUsers');

      expect(result).toEqual({ error: true, message: 'Network failed' });
    });

    it('should use generic message for non-Error values', () => {
      const { handleApiError } = useErrorHandler();
      const result = handleApiError('some string error', 'fetchData');

      expect(result).toEqual({ error: true, message: 'common.generic' });
    });

    it('should show error notification with correct params', () => {
      const { handleApiError } = useErrorHandler();
      handleApiError(new Error('Server error'), 'createLead');

      expect(mockNotification).toHaveBeenCalledWith({
        title: 'common.error',
        message: 'Server error',
        type: 'error'
      });
    });

    it('should log error to console with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { handleApiError } = useErrorHandler();
      const err = new Error('test');
      handleApiError(err, 'myContext');

      expect(consoleSpy).toHaveBeenCalledWith('[myContext]', err);
      consoleSpy.mockRestore();
    });

    it('should handle null error gracefully', () => {
      const { handleApiError } = useErrorHandler();
      const result = handleApiError(null, 'test');

      expect(result.error).toBe(true);
      expect(result.message).toBe('common.generic');
    });
  });

  // ============================================
  // handleWarning
  // ============================================
  describe('handleWarning', () => {
    it('should show warning notification', () => {
      const { handleWarning } = useErrorHandler();
      handleWarning('Data may be stale', 'cacheCheck');

      expect(mockNotification).toHaveBeenCalledWith({
        title: 'common.warning',
        message: 'Data may be stale',
        type: 'warning'
      });
    });

    it('should log warning to console with context', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { handleWarning } = useErrorHandler();
      handleWarning('slow response', 'api');

      expect(consoleSpy).toHaveBeenCalledWith('[api]', 'slow response');
      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // handleSuccess
  // ============================================
  describe('handleSuccess', () => {
    it('should show success notification', () => {
      const { handleSuccess } = useErrorHandler();
      handleSuccess('Record created');

      expect(mockNotification).toHaveBeenCalledWith({
        title: 'common.success',
        message: 'Record created',
        type: 'success'
      });
    });

    it('should show notification with custom message', () => {
      const { handleSuccess } = useErrorHandler();
      handleSuccess('Lead updated successfully');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lead updated successfully',
          type: 'success'
        })
      );
    });
  });
});
