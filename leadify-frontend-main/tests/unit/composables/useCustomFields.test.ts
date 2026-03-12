/**
 * useCustomFields - Unit Tests
 * ==============================
 * Tests for composables/useCustomFields.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  fetchFieldValues,
  saveFieldValues
} from '~/composables/useCustomFields';

const mockApiFetch = vi.fn();
(globalThis as Record<string, unknown>).useApiFetch = mockApiFetch;

describe('useCustomFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchCustomFields
  // ============================================
  describe('fetchCustomFields', () => {
    it('should fetch fields for entity type', async () => {
      const fields = [
        { id: '1', fieldName: 'industry', fieldLabel: 'Industry', fieldType: 'SELECT', entityType: 'LEAD', required: false, sortOrder: 0 }
      ];
      mockApiFetch.mockResolvedValue({ body: fields, success: true });

      const result = await fetchCustomFields('LEAD');

      expect(mockApiFetch).toHaveBeenCalledWith('custom-fields/fields/LEAD');
      expect(result).toEqual(fields);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCustomFields('LEAD');

      expect(result).toEqual([]);
    });

    it('should return empty array when body is not an array', async () => {
      mockApiFetch.mockResolvedValue({ body: { notArray: true }, success: true });

      const result = await fetchCustomFields('LEAD');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // createCustomField
  // ============================================
  describe('createCustomField', () => {
    it('should POST new custom field', async () => {
      const data = { fieldName: 'priority', fieldLabel: 'Priority', fieldType: 'SELECT' as const, entityType: 'DEAL', required: true, sortOrder: 1 };
      mockApiFetch.mockResolvedValue({ success: true, body: { id: '1', ...data } });

      const result = await createCustomField(data);

      expect(mockApiFetch).toHaveBeenCalledWith('custom-fields/fields', 'POST', data);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // updateCustomField
  // ============================================
  describe('updateCustomField', () => {
    it('should PUT updated field data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateCustomField('1', { fieldLabel: 'Updated Label' });

      expect(mockApiFetch).toHaveBeenCalledWith('custom-fields/fields/1', 'PUT', { fieldLabel: 'Updated Label' });
    });
  });

  // ============================================
  // deleteCustomField
  // ============================================
  describe('deleteCustomField', () => {
    it('should DELETE field by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteCustomField('1');

      expect(mockApiFetch).toHaveBeenCalledWith('custom-fields/fields/1', 'DELETE');
    });
  });

  // ============================================
  // fetchFieldValues
  // ============================================
  describe('fetchFieldValues', () => {
    it('should fetch values for entity', async () => {
      const values = [{ id: '1', customFieldId: 'f1', entityId: '10', entityType: 'LEAD', value: 'Tech' }];
      mockApiFetch.mockResolvedValue({ body: values, success: true });

      const result = await fetchFieldValues('LEAD', '10');

      expect(mockApiFetch).toHaveBeenCalledWith('custom-fields/values/LEAD/10');
      expect(result).toEqual(values);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchFieldValues('LEAD', '10');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // saveFieldValues
  // ============================================
  describe('saveFieldValues', () => {
    it('should PUT values for entity', async () => {
      const values = [{ customFieldId: 'f1', value: 'Updated' }];
      mockApiFetch.mockResolvedValue({ success: true });

      await saveFieldValues('LEAD', '10', values);

      expect(mockApiFetch).toHaveBeenCalledWith('custom-fields/values/LEAD/10', 'PUT', { values });
    });
  });
});
