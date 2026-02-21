/**
 * useApiFetch - Unit Tests
 * ==========================
 * Tests for composables/useApiFetch.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApiFetch } from '@/composables/useApiFetch';

// Mock user
vi.mock('@/composables/useUser', () => ({
  user: ref({ id: 1, tenantId: 'tenant-123' })
}));

describe('useApiFetch.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset $fetch mock
    globalThis.$fetch = vi.fn();
  });

  // ============================================
  // Successful requests
  // ============================================
  describe('Successful API requests', () => {
    it('should handle new format response { success, body }', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: mockData,
        message: 'Success'
      });

      const result = await useApiFetch('users');

      expect(result.success).toBe(true);
      expect(result.body).toEqual(mockData);
      expect(result.message).toBe('Success');
      expect(result.code).toBe(200);
    });

    it('should handle legacy user format { user: {...} }', async () => {
      const mockUser = { id: 1, name: 'User', email: 'test@test.com' };
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        user: mockUser
      });

      const result = await useApiFetch('auth/me');

      expect(result.success).toBe(true);
      expect(result.body).toEqual(mockUser);
    });

    it('should handle legacy token format { token: "..." }', async () => {
      const mockToken = 'abc123token';
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        token: mockToken
      });

      const result = await useApiFetch('auth/login');

      expect(result.success).toBe(true);
      expect(result.body).toEqual({ token: mockToken });
    });

    it('should treat whole object as body for unrecognized format', async () => {
      const mockData = { customField: 'value', anotherField: 123 };
      vi.mocked(globalThis.$fetch).mockResolvedValue(mockData);

      const result = await useApiFetch('custom-endpoint');

      expect(result.success).toBe(true);
      expect(result.body).toEqual(mockData);
    });
  });

  // ============================================
  // HTTP Methods
  // ============================================
  describe('HTTP Methods', () => {
    it('should default to GET method', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users');

      expect(globalThis.$fetch).toHaveBeenCalledWith(expect.stringContaining('users'), expect.objectContaining({ method: 'GET' }));
    });

    it('should use POST method when specified', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users', 'POST', { name: 'New User' });

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: { name: 'New User' }
        })
      );
    });

    it('should use PUT method when specified', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users/1', 'PUT', { name: 'Updated' });

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: { name: 'Updated' }
        })
      );
    });

    it('should use DELETE method when specified', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users/1', 'DELETE');

      expect(globalThis.$fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should not include body for GET requests', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users', 'GET', { ignored: 'data' });

      expect(globalThis.$fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: null }));
    });
  });

  // ============================================
  // Headers
  // ============================================
  describe('Request Headers', () => {
    it('should include Content-Type and Accept headers by default', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users', 'POST', { name: 'Test' });

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json'
          })
        })
      );
    });

    it('should include Authorization header when access_token exists', async () => {
      // Setup mock cookie
      const originalUseCookie = globalThis.useCookie;
      globalThis.useCookie = vi.fn((name: string) => ({
        value: name === 'access_token' ? 'test-token-123' : null
      }));

      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users');

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123'
          })
        })
      );

      // Restore
      globalThis.useCookie = originalUseCookie;
    });

    it('should include X-Tenant-ID header when user has tenantId', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users');

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-ID': 'tenant-123'
          })
        })
      );
    });

    it('should not include Content-Type when isFd is true (FormData)', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('upload', 'POST', { file: 'data' }, false, true);

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': expect.anything()
          })
        })
      );
    });

    it('should not include Authorization for reset-password endpoint', async () => {
      const originalUseCookie = globalThis.useCookie;
      globalThis.useCookie = vi.fn((name: string) => ({
        value: name === 'access_token' ? 'test-token-123' : null
      }));

      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('auth/reset-password', 'POST', { password: 'new' });

      const callArgs = vi.mocked(globalThis.$fetch).mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('Authorization');

      globalThis.useCookie = originalUseCookie;
    });
  });

  // ============================================
  // Error Handling
  // ============================================
  describe('Error handling', () => {
    it('should handle API errors and return error response', async () => {
      const mockError = {
        response: {
          status: 422,
          _data: {
            message: 'Validation failed'
          }
        }
      };

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      const result = await useApiFetch('users', 'POST', { invalid: 'data' });

      expect(result.success).toBe(false);
      expect(result.body).toBe(null);
      expect(result.message).toBe('Validation failed');
      expect(result.code).toBe(422);
      expect(result.error).toBeDefined();
    });

    it('should extract status code correctly', async () => {
      const mockError = {
        response: {
          status: 403
        }
      };

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      const result = await useApiFetch('admin/users');

      expect(result.code).toBe(403);
    });

    it('should default to 500 when no status code is available', async () => {
      const mockError = new Error('Network error');

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      const result = await useApiFetch('users');

      expect(result.code).toBe(500);
      expect(result.success).toBe(false);
    });

    it('should use error message when no response message', async () => {
      const mockError = new Error('Connection timeout');

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      const result = await useApiFetch('users');

      expect(result.message).toBe('Connection timeout');
    });

    it('should not log error when silence is true', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Test error');

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      await useApiFetch('users', 'GET', {}, true); // silence = true

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should log error when silence is false', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = {
        response: {
          status: 404,
          _data: { message: 'Not found' }
        }
      };

      vi.mocked(globalThis.$fetch).mockRejectedValue(mockError);

      await useApiFetch('users/999', 'GET', {}, false); // silence = false

      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error (404):', 'Not found');

      consoleErrorSpy.mockRestore();
    });
  });

  // ============================================
  // URL Construction
  // ============================================
  describe('URL construction', () => {
    it('should prepend API_BASE_URL to endpoint', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users');

      expect(globalThis.$fetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/users', expect.any(Object));
    });

    it('should handle endpoints with query parameters', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({
        success: true,
        body: {}
      });

      await useApiFetch('users?page=1&limit=10');

      expect(globalThis.$fetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/users?page=1&limit=10', expect.any(Object));
    });
  });
});
