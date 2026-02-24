/**
 * Utils - Unit Tests
 * ===================
 * Tests for composables/utils.ts
 */

import { describe, it, expect } from 'vitest';
import { isObjectValid, filterLength, cleanObject, isNullish, checkRouteDispatch, checkSecParent, checkparent } from '@/composables/utils';

describe('utils.ts', () => {
  // ============================================
  // isObjectValid
  // ============================================
  describe('isObjectValid', () => {
    it('should return true for object with all valid values', () => {
      expect(isObjectValid({ a: 1, b: 'hello', c: true })).toBe(true);
    });

    it('should return false for object with null value', () => {
      expect(isObjectValid({ a: 1, b: null })).toBe(false);
    });

    it('should return false for object with undefined value', () => {
      expect(isObjectValid({ a: 1, b: undefined })).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isObjectValid('string')).toBe(false);
      expect(isObjectValid(123)).toBe(false);
      expect(isObjectValid(null)).toBe(false);
    });

    it('should return true for empty object', () => {
      expect(isObjectValid({})).toBe(true);
    });
  });

  // ============================================
  // filterLength
  // ============================================
  describe('filterLength', () => {
    it('should count total length of array values', () => {
      expect(filterLength({ arr1: [1, 2, 3], arr2: [4, 5] })).toBe(5);
    });

    it('should count total length of string values', () => {
      expect(filterLength({ str1: 'hello', str2: 'world' })).toBe(10);
    });

    it('should handle mixed types', () => {
      expect(filterLength({ arr: [1, 2], str: 'abc', num: 123 })).toBe(5);
    });

    it('should return 0 for empty object', () => {
      expect(filterLength({})).toBe(0);
    });
  });

  // ============================================
  // cleanObject
  // ============================================
  describe('cleanObject', () => {
    it('should remove null values', () => {
      const result = cleanObject({ a: 1, b: null, c: 'hello' });
      expect(result).toEqual({ a: 1, c: 'hello' });
    });

    it('should remove undefined values', () => {
      const result = cleanObject({ a: 1, b: undefined, c: 'hello' });
      expect(result).toEqual({ a: 1, c: 'hello' });
    });

    it('should remove empty strings', () => {
      const result = cleanObject({ a: 1, b: '', c: 'hello' });
      expect(result).toEqual({ a: 1, c: 'hello' });
    });

    it('should remove empty arrays', () => {
      const result = cleanObject({ a: [1, 2], b: [], c: 'hello' });
      expect(result).toEqual({ a: [1, 2], c: 'hello' });
    });

    it('should remove empty objects', () => {
      const result = cleanObject({ a: { x: 1 }, b: {}, c: 'hello' });
      expect(result).toEqual({ a: { x: 1 }, c: 'hello' });
    });

    it('should keep valid values', () => {
      const result = cleanObject({ a: 0, b: false, c: 'hello' });
      expect(result).toEqual({ a: 0, b: false, c: 'hello' });
    });
  });

  // ============================================
  // isNullish
  // ============================================
  describe('isNullish', () => {
    it('should return true for null', () => {
      expect(isNullish(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNullish(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isNullish('')).toBe(true);
      expect(isNullish('   ')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isNullish([])).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isNullish({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isNullish('hello')).toBe(false);
      expect(isNullish([1, 2])).toBe(false);
      expect(isNullish({ a: 1 })).toBe(false);
      expect(isNullish(0)).toBe(false);
      expect(isNullish(false)).toBe(false);
    });
  });

  // ============================================
  // Route Check Functions
  // ============================================
  describe('Route Check Functions', () => {
    describe('checkRouteDispatch', () => {
      it('should return true when navigating to child route', () => {
        const to = { fullPath: '/sales/leads/123' };
        const from = { fullPath: '/sales/leads' };
        expect(checkRouteDispatch(to, from)).toBe(true);
      });

      it('should return false for unrelated routes', () => {
        const to = { fullPath: '/sales/deals/123' };
        const from = { fullPath: '/sales/leads' };
        expect(checkRouteDispatch(to, from)).toBe(false);
      });
    });

    describe('checkSecParent', () => {
      it('should return true for same second level parent', () => {
        const to = { fullPath: '/sales/leads/123' };
        const from = { fullPath: '/sales/leads/456' };
        expect(checkSecParent(to, from)).toBe(true);
      });

      it('should handle query params in from route', () => {
        const to = { fullPath: '/sales/leads/123' };
        const from = { fullPath: '/sales/leads?page=1' };
        expect(checkSecParent(to, from)).toBe(true);
      });
    });

    describe('checkparent', () => {
      it('should return true for same first level parent', () => {
        const to = { fullPath: '/sales/leads' };
        const from = { fullPath: '/sales/deals' };
        expect(checkparent(to, from)).toBe(true);
      });

      it('should return false for different first level parent', () => {
        const to = { fullPath: '/sales/leads' };
        const from = { fullPath: '/operations/projects' };
        expect(checkparent(to, from)).toBe(false);
      });
    });
  });
});
