/**
 * useAuthStore - Unit Tests
 * ==========================
 * Tests for stores/auth.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useAuthStore } from '@/stores/auth';

// Track ElNotification calls via a local mock fn
const mockElNotification = vi.fn();

// Mock element-plus to intercept the import { ElNotification } in stores/auth.ts
vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockElNotification(...args)
}));

// Mock the user ref from composables/useUser
vi.mock('@/composables/useUser', () => ({
  user: ref({})
}));

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

describe('useAuthStore', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAuthStore();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.loadingChangePassword).toBe(false);
      expect(store.permissions).toEqual([]);
      expect(store.lang).toBe('en');
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('setLocale', () => {
    it('should set the locale to the provided language', () => {
      store.setLocale('ar');
      expect(store.lang).toBe('ar');
    });

    it('should switch back to English', () => {
      store.setLocale('ar');
      store.setLocale('en');
      expect(store.lang).toBe('en');
    });
  });

  describe('changePassword', () => {
    const validInput = {
      oldPassword: 'OldPass123',
      password: 'NewPass456',
      confirmPassword: 'NewPass456'
    };

    it('should set loadingChangePassword to true during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (globalThis.useApiFetch as unknown).mockReturnValue(pendingPromise);

      const resultPromise = store.changePassword(validInput);

      // While the request is in-flight, loading should be true
      expect(store.loadingChangePassword).toBe(true);

      resolvePromise!({ success: true, message: 'OK' });
      await resultPromise;

      expect(store.loadingChangePassword).toBe(false);
    });

    it('should call API with correct parameters', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: true,
        message: 'Password changed'
      });

      await store.changePassword(validInput);

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('auth/change-password', 'POST', {
        oldPassword: 'OldPass123',
        newPassword: 'NewPass456',
        confirmPassword: 'NewPass456'
      });
    });

    it('should return success result and show success notification', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: true,
        message: 'Password changed successfully'
      });

      const result = await store.changePassword(validInput);

      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully'
      });
      expect(store.loadingChangePassword).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Success'
        })
      );
    });

    it('should return failure result and show error notification on API failure', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: false,
        message: 'Old password is incorrect'
      });

      const result = await store.changePassword(validInput);

      expect(result).toEqual({
        success: false,
        message: 'Old password is incorrect'
      });
      expect(store.loadingChangePassword).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'Old password is incorrect'
        })
      );
    });

    it('should handle thrown exception gracefully', async () => {
      (globalThis.useApiFetch as unknown).mockRejectedValue(new Error('Network error'));

      const result = await store.changePassword(validInput);

      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
      expect(store.loadingChangePassword).toBe(false);
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'Network error'
        })
      );
    });

    it('should use fallback message when API response has no message', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({
        success: false
      });

      const result = await store.changePassword(validInput);

      expect(result).toEqual({
        success: false,
        message: ''
      });
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to change password'
        })
      );
    });
  });

  describe('logout', () => {
    it('should call the logout API endpoint', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({ success: true });

      await store.logout();

      expect(globalThis.useApiFetch).toHaveBeenCalledWith('auth/logout', 'POST', {}, true);
    });

    it('should navigate to login page after logout', async () => {
      (globalThis.useApiFetch as unknown).mockResolvedValue({ success: true });

      await store.logout();

      expect(navigateTo).toHaveBeenCalledWith('/login');
    });
  });
});
