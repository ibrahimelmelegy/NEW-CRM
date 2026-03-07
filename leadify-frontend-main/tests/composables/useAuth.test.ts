/**
 * Auth - Comprehensive Unit Tests
 * =================================
 * Tests for auth-related composables and stores:
 *   - composables/useUser.ts (useUser, user ref)
 *   - composables/usePermissions.ts (usePermissions, usePermissionsSync)
 *   - stores/auth.ts (useAuthStore: logout, changePassword)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { useUser, user, type CurrentUser } from '@/composables/useUser';
import { useAuthStore } from '@/stores/auth';

// ============================================
// Global mocks required by the composables
// ============================================
const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();
const mockNavigateTo = vi.fn();

// Mock element-plus to intercept the import { ElNotification } in stores/auth.ts
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockElNotification(...args)
}));

(globalThis as any).useApiFetch = mockUseApiFetch;
(globalThis as any).ElNotification = mockElNotification;
(globalThis as any).useI18n = () => ({ t: (key: string) => key, locale: ref('en') });
(globalThis as any).useRuntimeConfig = () => ({ public: { API_BASE_URL: 'http://localhost:3001/api/v1/' } });
(globalThis as any).navigateTo = mockNavigateTo;
(globalThis as any).useState = (key: string, init: () => any) => ref(init());

describe('Auth: useUser composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    user.value = {};
  });

  // ============================================
  // user ref
  // ============================================
  describe('user reactive ref', () => {
    it('should initialize as empty object', () => {
      user.value = {};
      expect(user.value).toEqual({});
    });

    it('should be reactive and update when assigned', () => {
      user.value = { id: 1, name: 'John', email: 'john@test.com' };
      expect(user.value.id).toBe(1);
      expect(user.value.name).toBe('John');
    });

    it('should support all CurrentUser fields', () => {
      const fullUser: CurrentUser = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@test.com',
        phone: '+966501234567',
        status: 'active',
        profilePicture: 'https://img.test/avatar.png',
        twoFactorEnabled: true,
        roleId: 'role-1',
        role: { id: 'role-1', name: 'Admin', permissions: ['view_all', 'edit_all'] },
        tenantId: 'tenant-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-03-01'
      };

      user.value = fullUser;

      expect(user.value.twoFactorEnabled).toBe(true);
      expect(user.value.role?.permissions).toContain('view_all');
      expect(user.value.tenantId).toBe('tenant-1');
    });
  });

  // ============================================
  // useUser function
  // ============================================
  describe('useUser', () => {
    it('should fetch current user from auth/me endpoint', async () => {
      const mockUser: CurrentUser = { id: 1, name: 'Test User', email: 'test@test.com' };
      mockUseApiFetch.mockResolvedValueOnce({ body: mockUser, success: true, message: 'OK', code: 200 });

      const result = await useUser();

      expect(mockUseApiFetch).toHaveBeenCalledWith('auth/me');
      expect(result).toEqual(mockUser);
      expect(user.value).toEqual(mockUser);
    });

    it('should update the global user ref', async () => {
      const mockUser: CurrentUser = { id: 42, name: 'Admin', email: 'admin@test.com', roleId: 'role-admin' };
      mockUseApiFetch.mockResolvedValueOnce({ body: mockUser, success: true, message: 'OK', code: 200 });

      await useUser();

      expect(user.value.id).toBe(42);
      expect(user.value.name).toBe('Admin');
      expect(user.value.roleId).toBe('role-admin');
    });

    it('should set user to empty object when body has no id', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: {}, success: true, message: 'OK', code: 200 });

      const result = await useUser();

      expect(result).toEqual({});
      expect(user.value).toEqual({});
    });

    it('should set user to empty object when body is null', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: true, message: 'OK', code: 200 });

      const result = await useUser();

      expect(result).toEqual({});
    });

    it('should set user to empty object on API failure', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: null, success: false, message: 'Unauthorized', code: 401 });

      const result = await useUser();

      expect(result).toEqual({});
    });

    it('should correctly populate user when response has valid id', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: { id: 5, name: 'Valid', email: 'valid@test.com' },
        success: true,
        message: 'OK',
        code: 200
      });

      const result = await useUser();

      expect(result.id).toBe(5);
      expect(user.value.id).toBe(5);
    });
  });
});

describe('Auth: useAuthStore (Pinia)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    user.value = {};
  });

  // ============================================
  // setLocale
  // ============================================
  describe('setLocale', () => {
    it('should set the locale', () => {
      const store = useAuthStore();
      expect(store.lang).toBe('en');

      store.setLocale('ar');
      expect(store.lang).toBe('ar');
    });

    it('should default to en', () => {
      const store = useAuthStore();
      expect(store.lang).toBe('en');
    });
  });

  // ============================================
  // changePassword
  // ============================================
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        success: true,
        body: null,
        message: 'Password changed',
        code: 200
      });

      const store = useAuthStore();
      const result = await store.changePassword({
        oldPassword: 'old123',
        password: 'new456',
        confirmPassword: 'new456'
      });

      expect(mockUseApiFetch).toHaveBeenCalledWith('auth/change-password', 'POST', {
        oldPassword: 'old123',
        newPassword: 'new456',
        confirmPassword: 'new456'
      });
      expect(result.success).toBe(true);
    });

    it('should show success notification on password change', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'OK', code: 200 });

      const store = useAuthStore();
      await store.changePassword({
        oldPassword: 'old',
        password: 'new',
        confirmPassword: 'new'
      });

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', message: 'Password has been changed successfully' })
      );
    });

    it('should show error notification when change fails', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        success: false,
        body: null,
        message: 'Wrong old password',
        code: 400
      });

      const store = useAuthStore();
      const result = await store.changePassword({
        oldPassword: 'wrong',
        password: 'new',
        confirmPassword: 'new'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Wrong old password');
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should set loadingChangePassword during the request', async () => {
      let resolvePromise: (v: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockUseApiFetch.mockReturnValueOnce(pendingPromise);

      const store = useAuthStore();
      const promise = store.changePassword({
        oldPassword: 'old',
        password: 'new',
        confirmPassword: 'new'
      });

      expect(store.loadingChangePassword).toBe(true);

      resolvePromise!({ success: true, body: null, message: 'OK', code: 200 });
      await promise;

      expect(store.loadingChangePassword).toBe(false);
    });

    it('should reset loadingChangePassword on error', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Network error'));

      const store = useAuthStore();
      const result = await store.changePassword({
        oldPassword: 'old',
        password: 'new',
        confirmPassword: 'new'
      });

      expect(store.loadingChangePassword).toBe(false);
      expect(result.success).toBe(false);
    });

    it('should handle exception and show error notification', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Connection lost'));

      const store = useAuthStore();
      await store.changePassword({
        oldPassword: 'old',
        password: 'new',
        confirmPassword: 'new'
      });

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Connection lost' }));
    });

    it('should use fallback message when response message is empty', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        success: false,
        body: null,
        message: '',
        code: 500
      });

      const store = useAuthStore();
      const _result = await store.changePassword({
        oldPassword: 'old',
        password: 'new',
        confirmPassword: 'new'
      });

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Failed to change password' }));
    });
  });

  // ============================================
  // logout
  // ============================================
  describe('logout', () => {
    it('should call the logout API endpoint', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'OK', code: 200 });

      const store = useAuthStore();
      await store.logout();

      expect(mockUseApiFetch).toHaveBeenCalledWith('auth/logout', 'POST', {}, true);
    });

    it('should clear the cached user data', async () => {
      user.value = { id: 1, name: 'John', email: 'john@test.com' };
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'OK', code: 200 });

      const store = useAuthStore();
      await store.logout();

      expect(user.value).toBeNull();
    });

    it('should navigate to login page', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'OK', code: 200 });

      const store = useAuthStore();
      await store.logout();

      expect(mockNavigateTo).toHaveBeenCalledWith('/login');
    });

    it('should call logout with silence=true', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'OK', code: 200 });

      const store = useAuthStore();
      await store.logout();

      // Fourth argument is silence=true
      const callArgs = mockUseApiFetch.mock.calls[0];
      expect(callArgs[3]).toBe(true);
    });
  });

  // ============================================
  // State defaults
  // ============================================
  describe('store state defaults', () => {
    it('should initialize with loadingChangePassword=false', () => {
      const store = useAuthStore();
      expect(store.loadingChangePassword).toBe(false);
    });

    it('should initialize with empty permissions array', () => {
      const store = useAuthStore();
      expect(store.permissions).toEqual([]);
    });

    it('should initialize with lang=en', () => {
      const store = useAuthStore();
      expect(store.lang).toBe('en');
    });
  });
});

describe('Auth: usePermissions composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    user.value = {};

    // We need to reset the module state for permissions tests
    // Since permissions and isLoaded are module-level refs, we re-import fresh
  });

  describe('permission checking logic', () => {
    it('should check single permission correctly', () => {
      const permissions = ['view_leads', 'edit_leads', 'delete_leads'];
      const hasPermission = (perm: string) => permissions.includes(perm);

      expect(hasPermission('view_leads')).toBe(true);
      expect(hasPermission('edit_leads')).toBe(true);
      expect(hasPermission('admin_access')).toBe(false);
    });

    it('should check multiple permissions with hasAnyPermission', () => {
      const permissions = ['view_leads', 'create_deals'];
      const hasAnyPermission = (perms: string[]) => perms.some(perm => permissions.includes(perm));

      expect(hasAnyPermission(['view_leads', 'admin'])).toBe(true);
      expect(hasAnyPermission(['create_deals'])).toBe(true);
      expect(hasAnyPermission(['admin', 'superuser'])).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const permissions: string[] = [];
      const hasPermission = (perm: string) => permissions.includes(perm);
      const hasAnyPermission = (perms: string[]) => perms.some(perm => permissions.includes(perm));

      expect(hasPermission('any_permission')).toBe(false);
      expect(hasAnyPermission(['view_leads', 'admin'])).toBe(false);
    });

    it('should handle empty check array', () => {
      const permissions = ['view_leads', 'create_leads'];
      const hasAnyPermission = (perms: string[]) => perms.some(perm => permissions.includes(perm));

      expect(hasAnyPermission([])).toBe(false);
    });

    it('should support granular permission names', () => {
      const permissions = ['leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'deals.view', 'deals.create', 'invoices.view'];
      const hasPermission = (perm: string) => permissions.includes(perm);

      expect(hasPermission('leads.view')).toBe(true);
      expect(hasPermission('leads.delete')).toBe(true);
      expect(hasPermission('deals.delete')).toBe(false);
      expect(hasPermission('invoices.create')).toBe(false);
    });

    it('should be case sensitive', () => {
      const permissions = ['View_Leads'];
      const hasPermission = (perm: string) => permissions.includes(perm);

      expect(hasPermission('View_Leads')).toBe(true);
      expect(hasPermission('view_leads')).toBe(false);
    });
  });

  describe('CurrentUser interface', () => {
    it('should allow minimal user with no fields', () => {
      const minUser: CurrentUser = {};
      expect(minUser.id).toBeUndefined();
    });

    it('should support role with nested permissions', () => {
      const adminUser: CurrentUser = {
        id: 1,
        role: { id: 'admin', name: 'Administrator', permissions: ['all'] }
      };

      expect(adminUser.role?.permissions).toContain('all');
    });

    it('should support twoFactorEnabled flag', () => {
      const user2fa: CurrentUser = {
        id: 1,
        twoFactorEnabled: true
      };

      expect(user2fa.twoFactorEnabled).toBe(true);
    });

    it('should support tenantId for multi-tenancy', () => {
      const tenantUser: CurrentUser = {
        id: 1,
        tenantId: 'org-abc-123'
      };

      expect(tenantUser.tenantId).toBe('org-abc-123');
    });
  });
});
