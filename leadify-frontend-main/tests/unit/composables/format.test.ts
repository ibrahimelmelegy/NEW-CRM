/**
 * Format Utilities - Unit Tests
 * ==============================
 * Tests for composables/format.ts
 */

import { describe, it, expect } from 'vitest';
import {
  capitalizeFirstLetter,
  fromCamelCase,
  formatIso,
  formatTime,
  calculateAge,
  formatTextWithUnderscore,
  formatName,
  checkEmpty,
  checkDateLength,
  normalizePhoneNumber,
  capitalizeName,
  formatLargeNumber,
  formatDate,
  getYear,
  formatSnakeCase
} from '@/composables/format';

describe('format.ts', () => {
  // ============================================
  // capitalizeFirstLetter
  // ============================================
  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter of a string', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('HELLO')).toBe('Hello');
      expect(capitalizeFirstLetter('hELLO')).toBe('Hello');
    });

    it('should return empty string for empty input', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
    });
  });

  // ============================================
  // fromCamelCase
  // ============================================
  describe('fromCamelCase', () => {
    it('should convert camelCase to spaced words', () => {
      expect(fromCamelCase('helloWorld')).toBe('Hello World');
      expect(fromCamelCase('firstName')).toBe('First Name');
      expect(fromCamelCase('userProfileSettings')).toBe('User Profile Settings');
    });

    it('should handle single word', () => {
      expect(fromCamelCase('hello')).toBe('Hello');
    });
  });

  // ============================================
  // formatIso
  // ============================================
  describe('formatIso', () => {
    it('should format date to ISO format', () => {
      const result = formatIso('2024-01-15');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should return "Not Mentioned" for empty input', () => {
      expect(formatIso('')).toBe('Not Mentioned');
      expect(formatIso(null)).toBe('Not Mentioned');
    });
  });

  // ============================================
  // formatTime
  // ============================================
  describe('formatTime', () => {
    it('should format time with days and hours', () => {
      expect(formatTime(2, 5, 30, 45)).toBe('2d5h');
    });

    it('should format time with hours and minutes', () => {
      expect(formatTime(0, 5, 30, 45)).toBe('5h30min');
    });

    it('should return "0s" for zero values', () => {
      expect(formatTime(0, 0, 0, 0)).toBe('0s');
    });

    it('should handle only seconds', () => {
      expect(formatTime(0, 0, 0, 45)).toBe('45s');
    });
  });

  // ============================================
  // calculateAge
  // ============================================
  describe('calculateAge', () => {
    it('should calculate age in years', () => {
      expect(calculateAge(25, 0, 0)).toBe('25 y/o');
    });

    it('should calculate age in days', () => {
      expect(calculateAge(0, 0, 30)).toBe('30 d/o');
    });

    it('should return "0d" for zero values', () => {
      expect(calculateAge(0, 0, 0)).toBe('0d');
    });
  });

  // ============================================
  // formatTextWithUnderscore
  // ============================================
  describe('formatTextWithUnderscore', () => {
    it('should format underscore text to title case', () => {
      expect(formatTextWithUnderscore('hello_world')).toBe('Hello World');
      expect(formatTextWithUnderscore('user_profile_settings')).toBe('User Profile Settings');
    });

    it('should return space for empty input', () => {
      expect(formatTextWithUnderscore('')).toBe(' ');
    });
  });

  // ============================================
  // formatName
  // ============================================
  describe('formatName', () => {
    it('should format name with proper capitalization', () => {
      expect(formatName('john doe')).toBe('John Doe');
      expect(formatName('JOHN DOE')).toBe('John Doe');
    });

    it('should handle single name', () => {
      expect(formatName('john')).toBe('John');
    });
  });

  // ============================================
  // checkEmpty
  // ============================================
  describe('checkEmpty', () => {
    it('should return value if not empty', () => {
      expect(checkEmpty('Hello')).toBe('Hello');
      expect(checkEmpty(123)).toBe(123);
    });

    it('should return "Not mentioned" for empty values', () => {
      expect(checkEmpty('')).toBe('Not mentioned');
      expect(checkEmpty(null)).toBe('Not mentioned');
      expect(checkEmpty(undefined)).toBe('Not mentioned');
    });
  });

  // ============================================
  // checkDateLength
  // ============================================
  describe('checkDateLength', () => {
    it('should pad single digit with zero', () => {
      expect(checkDateLength(5)).toBe('05');
      expect(checkDateLength(1)).toBe('01');
    });

    it('should not pad double digits', () => {
      expect(checkDateLength(15)).toBe('15');
      expect(checkDateLength(10)).toBe('10');
    });
  });

  // ============================================
  // normalizePhoneNumber
  // ============================================
  describe('normalizePhoneNumber', () => {
    it('should remove spaces and plus sign', () => {
      expect(normalizePhoneNumber('+966 501 234 567')).toBe('966501234567');
    });

    it('should return empty string for empty input', () => {
      expect(normalizePhoneNumber('')).toBe('');
    });
  });

  // ============================================
  // capitalizeName
  // ============================================
  describe('capitalizeName', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeName('john')).toBe('John');
    });

    it('should return empty string for empty input', () => {
      expect(capitalizeName('')).toBe('');
    });
  });

  // ============================================
  // formatLargeNumber
  // ============================================
  describe('formatLargeNumber', () => {
    it('should format millions', () => {
      expect(formatLargeNumber(1000000)).toBe('1.0M');
      expect(formatLargeNumber(5500000)).toBe('5.5M');
    });

    it('should format thousands', () => {
      expect(formatLargeNumber(1000)).toBe('1.0k');
      expect(formatLargeNumber(50000)).toBe('50.0k');
    });

    it('should not format small numbers', () => {
      expect(formatLargeNumber(500)).toBe('500');
      expect(formatLargeNumber(99)).toBe('99');
    });

    it('should handle string input', () => {
      expect(formatLargeNumber('1000000')).toBe('1.0M');
    });
  });

  // ============================================
  // formatDate
  // ============================================
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it('should return "-" for empty input', () => {
      expect(formatDate('')).toBe('-');
      expect(formatDate(null as unknown)).toBe('-');
    });
  });

  // ============================================
  // getYear
  // ============================================
  describe('getYear', () => {
    it('should extract year from date', () => {
      expect(getYear('2024-01-15')).toBe('2024');
      expect(getYear(new Date('2023-06-20'))).toBe('2023');
    });

    it('should return "-" for empty input', () => {
      expect(getYear('')).toBe('-');
      expect(getYear(null)).toBe('-');
      expect(getYear(undefined)).toBe('-');
    });
  });

  // ============================================
  // formatSnakeCase
  // ============================================
  describe('formatSnakeCase', () => {
    it('should convert snake_case to Title Case', () => {
      expect(formatSnakeCase('hello_world')).toBe('Hello World');
      expect(formatSnakeCase('user_profile')).toBe('User Profile');
    });

    it('should return "-" for empty input', () => {
      expect(formatSnakeCase('')).toBe('-');
    });
  });
});
