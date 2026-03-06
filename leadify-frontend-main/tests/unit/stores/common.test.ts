/**
 * useMain (common store) - Unit Tests
 * =====================================
 * Tests for stores/common.ts Pinia store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Track ElNotification calls via a local mock fn
const mockElNotification = vi.fn();

// Mock element-plus to intercept the import { ElNotification } in stores/common.ts
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockElNotification(...args)
}));

// Mock useApiFetch globally
globalThis.useApiFetch = vi.fn();

// Mock useI18n
globalThis.useI18n = () => ({ t: (key: string) => key, locale: ref('en') });

// Mock useAsyncGql (GraphQL composable used by uploadFile)
(globalThis as any).useAsyncGql = vi.fn();

import { useMain } from '@/stores/common';

describe('useMain', () => {
  let store: ReturnType<typeof useMain>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMain();
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.filereturned).toBe('');
      expect(store.contentImagesUrls).toEqual([]);
      expect(store.openedNav).toBe(true);
      expect(store.mobile).toBe(false);
      expect(store.fullNav).toBe(true);
      expect(store.hideNav).toBe(false);
      expect(store.permissions).toEqual([]);
      expect(store.isLight).toBe(false);
    });
  });

  // ============================================
  // Months Constants
  // ============================================
  describe('months', () => {
    it('should have 12 months', () => {
      expect(store.months).toHaveLength(12);
    });

    it('should have January as the first month with value 1', () => {
      expect(store.months[0]).toEqual({ label: 'January', value: 1 });
    });

    it('should have December as the last month with value 12', () => {
      expect(store.months[11]).toEqual({ label: 'December', value: 12 });
    });

    it('each month should have label and value properties', () => {
      store.months.forEach((month, index) => {
        expect(month).toHaveProperty('label');
        expect(month).toHaveProperty('value');
        expect(month.value).toBe(index + 1);
        expect(typeof month.label).toBe('string');
      });
    });

    it('months should be in correct order', () => {
      const expectedLabels = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const labels = store.months.map((m) => m.label);
      expect(labels).toEqual(expectedLabels);
    });
  });

  // ============================================
  // State Mutations
  // ============================================
  describe('state mutations', () => {
    it('should allow toggling openedNav', () => {
      store.openedNav = false;
      expect(store.openedNav).toBe(false);
    });

    it('should allow setting mobile mode', () => {
      store.mobile = true;
      expect(store.mobile).toBe(true);
    });

    it('should allow toggling fullNav', () => {
      store.fullNav = false;
      expect(store.fullNav).toBe(false);
    });

    it('should allow toggling hideNav', () => {
      store.hideNav = true;
      expect(store.hideNav).toBe(true);
    });

    it('should allow setting permissions', () => {
      store.permissions = ['read', 'write', 'admin'];
      expect(store.permissions).toEqual(['read', 'write', 'admin']);
    });

    it('should allow toggling isLight', () => {
      store.isLight = true;
      expect(store.isLight).toBe(true);
    });
  });

  // ============================================
  // Actions
  // ============================================
  describe('uploadFile', () => {
    it('should call useAsyncGql with correct parameters', async () => {
      const mockFile = new File(['test-content'], 'photo.png', { type: 'image/png' });

      const mockLink = 'https://bucket.example.com/uploads/HPT-123456.png?signature=abc';
      ((globalThis as any).useAsyncGql as any).mockResolvedValue({
        data: ref({
          generateUploadLink: {
            data: mockLink
          }
        })
      });

      (globalThis.$fetch as any).mockResolvedValue({});

      // Override useRuntimeConfig for this test
      const originalConfig = globalThis.useRuntimeConfig;
      globalThis.useRuntimeConfig = () => ({
        public: {
          API_BASE_URL: 'http://localhost:3001/api/v1/',
          BUCKET_URL: 'https://bucket.example.com'
        }
      });

      try {
        await store.uploadFile('blog_cover', mockFile);

        expect((globalThis as any).useAsyncGql).toHaveBeenCalledWith(
          'generateUploadLink',
          expect.objectContaining({
            model: 'BLOG_COVER',
            contentType: 'image/png',
            sizeInBytes: mockFile.size
          })
        );
      } finally {
        globalThis.useRuntimeConfig = originalConfig;
      }
    });

    it('should call $fetch with the upload link and file', async () => {
      const mockFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      const mockLink = 'https://bucket.example.com/uploads/HPT-999.pdf?sig=xyz';

      ((globalThis as any).useAsyncGql as any).mockResolvedValue({
        data: ref({
          generateUploadLink: { data: mockLink }
        })
      });

      (globalThis.$fetch as any).mockResolvedValue({});

      const originalConfig = globalThis.useRuntimeConfig;
      globalThis.useRuntimeConfig = () => ({
        public: {
          API_BASE_URL: 'http://localhost:3001/api/v1/',
          BUCKET_URL: 'https://bucket.example.com'
        }
      });

      try {
        await store.uploadFile('document', mockFile);

        expect(globalThis.$fetch).toHaveBeenCalledWith(
          mockLink,
          expect.objectContaining({
            method: 'PUT'
          })
        );
      } finally {
        globalThis.useRuntimeConfig = originalConfig;
      }
    });

    it('should show error notification and rethrow on upload failure', async () => {
      const mockFile = new File(['test'], 'broken.png', { type: 'image/png' });

      ((globalThis as any).useAsyncGql as any).mockRejectedValue(new Error('GraphQL error'));

      await expect(store.uploadFile('avatar', mockFile)).rejects.toThrow('GraphQL error');

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          type: 'error',
          message: 'GraphQL error'
        })
      );
    });

    it('should show generic error message for non-Error exceptions', async () => {
      const mockFile = new File(['test'], 'broken.png', { type: 'image/png' });

      ((globalThis as any).useAsyncGql as any).mockRejectedValue('string error');

      await expect(store.uploadFile('avatar', mockFile)).rejects.toBe('string error');

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          type: 'error',
          message: 'Upload failed'
        })
      );
    });
  });
});
