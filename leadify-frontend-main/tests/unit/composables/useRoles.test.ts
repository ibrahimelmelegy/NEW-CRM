/**
 * useRoles - Unit Tests
 * =======================
 * Tests for composables/useRoles.ts
 *
 * The module exports:
 * - getRole(id: string | string[]): Promise<any> - fetches a single role
 * - createRole(values: any): Promise<void> - creates a new role
 * - updateRole(values: any): Promise<void> - updates an existing role
 *
 * Internal helpers (not exported):
 * - handleError(message: string) - shows error notification
 * - handleSuccess(message: string) - shows success notification and navigates to /roles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock useApiFetch globally
// ============================================
const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

// ============================================
// Mock ElNotification
// ============================================
const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

// ============================================
// Mock navigateTo
// ============================================
const mockNavigateTo = vi.fn();
(globalThis as any).navigateTo = mockNavigateTo;

// ============================================
// Mock cleanObject (used by updateRole)
// ============================================
const mockCleanObject = vi.fn((obj: any) => {
  // Replicate the real cleanObject behavior: filter out null/undefined/empty
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      if (value === null || value === undefined || value === '' || Number.isNaN(value)) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
      return true;
    })
  );
});
(globalThis as any).cleanObject = mockCleanObject;

// ============================================
// Mock usePermissions (called by updateRole on success)
// ============================================
const mockUsePermissions = vi.fn().mockResolvedValue({
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn()
});
(globalThis as any).usePermissions = mockUsePermissions;

// Must mock element-plus before importing
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args)
}));

import { getRole, createRole, updateRole } from '~/composables/useRoles';

describe('useRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getRole
  // ============================================
  describe('getRole', () => {
    it('should call useApiFetch with correct endpoint', async () => {
      mockApiFetch.mockResolvedValue({ body: { id: '1', name: 'Admin' }, success: true });

      await getRole('1');

      expect(mockApiFetch).toHaveBeenCalledWith('role/1');
    });

    it('should return the role body on success', async () => {
      const mockRole = { id: '1', name: 'Admin', permissions: ['read', 'write'] };
      mockApiFetch.mockResolvedValue({ body: mockRole, success: true });

      const result = await getRole('1');

      expect(result).toEqual(mockRole);
    });

    it('should return empty object on error', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await getRole('999');

      expect(result).toEqual({});
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      await getRole('999');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error'
        })
      );
    });

    it('should accept string array as id parameter', async () => {
      mockApiFetch.mockResolvedValue({ body: { id: 'abc', name: 'Editor' }, success: true });

      const result = await getRole(['abc']);

      expect(mockApiFetch).toHaveBeenCalledWith('role/abc');
      expect(result).toEqual({ id: 'abc', name: 'Editor' });
    });
  });

  // ============================================
  // createRole
  // ============================================
  describe('createRole', () => {
    it('should call useApiFetch with POST method', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const values = { name: 'New Role', permissions: ['read'] };

      await createRole(values);

      expect(mockApiFetch).toHaveBeenCalledWith('role', 'POST', values);
    });

    it('should show success notification on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createRole({ name: 'Manager', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Success',
          message: 'Role created successfully'
        })
      );
    });

    it('should navigate to /roles on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createRole({ name: 'Manager', permissions: [] });

      expect(mockNavigateTo).toHaveBeenCalledWith('/roles');
    });

    it('should show error notification on API failure response', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Role name already exists' });

      await createRole({ name: 'Admin', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'Role name already exists'
        })
      );
    });

    it('should show default error message when no message in response', async () => {
      mockApiFetch.mockResolvedValue({ success: false });

      await createRole({ name: 'Test', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Something went wrong'
        })
      );
    });

    it('should handle thrown errors gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network failure'));

      await createRole({ name: 'Test', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'Network failure'
        })
      );
    });

    it('should handle non-Error thrown values', async () => {
      mockApiFetch.mockRejectedValue('string error');

      await createRole({ name: 'Test', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Unknown error'
        })
      );
    });
  });

  // ============================================
  // updateRole
  // ============================================
  describe('updateRole', () => {
    it('should call useApiFetch with PUT method and correct endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const values = { id: '5', name: 'Updated Role', permissions: ['read', 'write'] };

      await updateRole(values);

      expect(mockApiFetch).toHaveBeenCalledWith(
        'role/5',
        'PUT',
        expect.not.objectContaining({ id: '5' })
      );
    });

    it('should remove id from the request body', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const values = { id: '5', name: 'Updated Role', permissions: [] };

      await updateRole(values);

      const calledWithBody = mockApiFetch.mock.calls[0]![2];
      expect(calledWithBody).not.toHaveProperty('id');
      expect(calledWithBody).toHaveProperty('name', 'Updated Role');
    });

    it('should use cleanObject to sanitize values', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const values = { id: '5', name: 'Role', permissions: [], emptyField: '', nullField: null };

      await updateRole(values);

      expect(mockCleanObject).toHaveBeenCalled();
    });

    it('should show success notification on successful update', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateRole({ id: '5', name: 'Updated', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Success',
          message: 'Role updated successfully'
        })
      );
    });

    it('should navigate to /roles on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateRole({ id: '5', name: 'Updated', permissions: [] });

      expect(mockNavigateTo).toHaveBeenCalledWith('/roles');
    });

    it('should refresh permissions after successful update', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateRole({ id: '5', name: 'Updated', permissions: [] });

      expect(mockUsePermissions).toHaveBeenCalledWith(true);
    });

    it('should show error notification on API failure response', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Permission denied' });

      await updateRole({ id: '5', name: 'Updated', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Permission denied'
        })
      );
    });

    it('should handle thrown errors gracefully', async () => {
      mockApiFetch.mockRejectedValue(new Error('Server error'));

      await updateRole({ id: '5', name: 'Updated', permissions: [] });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Server error'
        })
      );
    });
  });
});
