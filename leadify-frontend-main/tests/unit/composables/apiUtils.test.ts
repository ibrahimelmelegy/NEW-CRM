/**
 * apiUtils - Unit Tests
 * =======================
 * Tests for composables/apiUtils.ts
 *
 * The module exports pure utility functions:
 * - getStatusColor(status): Returns CSS class name for a given status
 * - transformNumToFixed(num): Rounds to 2 decimal places if needed
 * - checkStatuesNumber(num): Returns 'Positive', 'Negative', or 'Zero'
 * - formatNumber(number): Formats number with thousands separator commas
 * - unformatNumber(formattedNumber): Removes commas from formatted number
 * - checkAppointmentType(type): Returns color hex for appointment type
 * - checkPaymentType(type): Returns image path for payment type
 * - convertToReadableFormat(str): Converts camelCase to readable format
 * - toUpperSnakeCase(str): Converts camelCase to UPPER_SNAKE_CASE
 * - getWordInitials(name): Gets first letters of first two words
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStatusColor,
  transformNumToFixed,
  checkStatuesNumber,
  formatNumber,
  unformatNumber,
  checkAppointmentType,
  checkPaymentType,
  convertToReadableFormat,
  toUpperSnakeCase,
  getWordInitials,
  getRequestStatus
} from '~/composables/apiUtils';

// Mock dependencies that apiUtils uses
const mockNotification = vi.fn();
(globalThis as Record<string, unknown>).ElNotification = mockNotification;
(globalThis as Record<string, unknown>).navigateTo = vi.fn();
(globalThis as Record<string, unknown>).createError = vi.fn();

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockNotification(...args)
}));

describe('apiUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getStatusColor
  // ============================================
  describe('getStatusColor', () => {
    it('should return "one" for NEW status', () => {
      expect(getStatusColor('NEW')).toBe('one');
    });

    it('should return "two" for CONTACTED status', () => {
      expect(getStatusColor('CONTACTED')).toBe('two');
    });

    it('should return "three" for DISQUALIFIED status', () => {
      expect(getStatusColor('DISQUALIFIED')).toBe('three');
    });

    it('should return "primary" for QUALIFIED status', () => {
      expect(getStatusColor('QUALIFIED')).toBe('primary');
    });

    it('should return "three" for LOST status', () => {
      expect(getStatusColor('LOST')).toBe('three');
    });

    it('should return "primary" for WON status', () => {
      expect(getStatusColor('WON')).toBe('primary');
    });

    it('should return "primary" for ACTIVE status', () => {
      expect(getStatusColor('ACTIVE')).toBe('primary');
    });

    it('should return "six" for INACTIVE status', () => {
      expect(getStatusColor('INACTIVE')).toBe('six');
    });

    it('should return "primary" for APPROVED status', () => {
      expect(getStatusColor('APPROVED')).toBe('primary');
    });

    it('should return "three" for REJECTED status', () => {
      expect(getStatusColor('REJECTED')).toBe('three');
    });

    it('should return "four" for WAITING_APPROVAL status', () => {
      expect(getStatusColor('WAITING_APPROVAL')).toBe('four');
    });

    it('should return "four" for NEGOTIATION status', () => {
      expect(getStatusColor('NEGOTIATION')).toBe('four');
    });

    it('should return undefined for unknown status', () => {
      expect(getStatusColor('UNKNOWN_STATUS')).toBeUndefined();
    });
  });

  // ============================================
  // transformNumToFixed
  // ============================================
  describe('transformNumToFixed', () => {
    it('should return integer as-is', () => {
      expect(transformNumToFixed(100)).toBe(100);
    });

    it('should round float to 2 decimal places', () => {
      expect(transformNumToFixed(3.14159)).toBe(3.14);
    });

    it('should handle already 2 decimal places', () => {
      expect(transformNumToFixed(10.25)).toBe(10.25);
    });

    it('should handle zero', () => {
      expect(transformNumToFixed(0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(transformNumToFixed(-3.567)).toBe(-3.57);
    });

    it('should return integer for whole number float', () => {
      expect(transformNumToFixed(5.0)).toBe(5);
    });
  });

  // ============================================
  // checkStatuesNumber
  // ============================================
  describe('checkStatuesNumber', () => {
    it('should return "Positive" for positive numbers', () => {
      expect(checkStatuesNumber(5)).toBe('Positive');
      expect(checkStatuesNumber(0.01)).toBe('Positive');
      expect(checkStatuesNumber(1000)).toBe('Positive');
    });

    it('should return "Negative" for negative numbers', () => {
      expect(checkStatuesNumber(-1)).toBe('Negative');
      expect(checkStatuesNumber(-0.01)).toBe('Negative');
    });

    it('should return "Zero" for zero', () => {
      expect(checkStatuesNumber(0)).toBe('Zero');
    });
  });

  // ============================================
  // formatNumber
  // ============================================
  describe('formatNumber', () => {
    it('should format thousands with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('should format millions with commas', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle numbers less than 1000', () => {
      expect(formatNumber(999)).toBe('999');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should accept string input', () => {
      expect(formatNumber('1500')).toBe('1,500');
    });

    it('should format large numbers correctly', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  // ============================================
  // unformatNumber
  // ============================================
  describe('unformatNumber', () => {
    it('should remove commas from formatted string', () => {
      expect(unformatNumber('1,000')).toBe(1000);
    });

    it('should remove multiple commas', () => {
      expect(unformatNumber('1,234,567')).toBe(1234567);
    });

    it('should return number as-is when number type is passed', () => {
      expect(unformatNumber(500)).toBe(500);
    });

    it('should handle string without commas', () => {
      expect(unformatNumber('1500')).toBe(1500);
    });
  });

  // ============================================
  // checkAppointmentType
  // ============================================
  describe('checkAppointmentType', () => {
    it('should return correct color for SCHEDULED', () => {
      expect(checkAppointmentType('SCHEDULED')).toBe('#FFCE0E');
    });

    it('should return correct color for URGENT', () => {
      expect(checkAppointmentType('URGENT')).toBe('#E56461');
    });

    it('should return correct color for FOLLOW_UP', () => {
      expect(checkAppointmentType('FOLLOW_UP')).toBe('#27AE60');
    });

    it('should return correct color for FREE', () => {
      expect(checkAppointmentType('FREE')).toBe('#5789e3');
    });

    it('should return default color for unknown type', () => {
      expect(checkAppointmentType('UNKNOWN')).toBe('#1ED8D6');
    });
  });

  // ============================================
  // checkPaymentType
  // ============================================
  describe('checkPaymentType', () => {
    it('should return Apple Pay image path', () => {
      expect(checkPaymentType('APPLE_PAY')).toBe('/images/payment/applepay.svg');
    });

    it('should return Visa image path', () => {
      expect(checkPaymentType('VISA')).toBe('/images/payment/visa.svg');
    });

    it('should return Mastercard image path', () => {
      expect(checkPaymentType('MASTERCARD')).toBe('/images/payment/mastercard.svg');
    });

    it('should return wallet path for WALLET type', () => {
      expect(checkPaymentType('WALLET')).toBe('/images/payment/wallet.svg');
    });

    it('should return wallet path for SYSTEM type', () => {
      expect(checkPaymentType('SYSTEM')).toBe('/images/payment/wallet.svg');
    });

    it('should return Mada image path', () => {
      expect(checkPaymentType('MADA')).toBe('/images/payment/mada.svg');
    });

    it('should return undefined for unknown payment type', () => {
      expect(checkPaymentType('UNKNOWN')).toBeUndefined();
    });
  });

  // ============================================
  // convertToReadableFormat
  // ============================================
  describe('convertToReadableFormat', () => {
    it('should convert camelCase to space-separated words', () => {
      expect(convertToReadableFormat('camelCaseString')).toBe('Camel Case String');
    });

    it('should capitalize first letter', () => {
      expect(convertToReadableFormat('firstName')).toBe('First Name');
    });

    it('should handle single word', () => {
      expect(convertToReadableFormat('Name')).toBe('Name');
    });

    it('should return empty string for empty input', () => {
      expect(convertToReadableFormat('')).toBe('');
    });

    it('should handle already readable string', () => {
      expect(convertToReadableFormat('Hello')).toBe('Hello');
    });
  });

  // ============================================
  // toUpperSnakeCase
  // ============================================
  describe('toUpperSnakeCase', () => {
    it('should convert camelCase to UPPER_SNAKE_CASE', () => {
      expect(toUpperSnakeCase('camelCaseString')).toBe('CAMEL_CASE_STRING');
    });

    it('should handle single word', () => {
      expect(toUpperSnakeCase('hello')).toBe('HELLO');
    });

    it('should return empty string for empty input', () => {
      expect(toUpperSnakeCase('')).toBe('');
    });

    it('should handle already uppercase string', () => {
      expect(toUpperSnakeCase('HELLO')).toBe('HELLO');
    });

    it('should handle multiple transitions', () => {
      expect(toUpperSnakeCase('myFirstName')).toBe('MY_FIRST_NAME');
    });
  });

  // ============================================
  // getWordInitials
  // ============================================
  describe('getWordInitials', () => {
    it('should return initials of first two words', () => {
      expect(getWordInitials('John Doe')).toBe('JD');
    });

    it('should only use first two words for long names', () => {
      expect(getWordInitials('John William Doe Smith')).toBe('JW');
    });

    it('should handle single word', () => {
      expect(getWordInitials('Alice')).toBe('A');
    });

    it('should return empty string for empty input', () => {
      expect(getWordInitials('')).toBe('');
    });

    it('should capitalize initials', () => {
      expect(getWordInitials('alice bob')).toBe('AB');
    });
  });

  // ============================================
  // getRequestStatus
  // ============================================
  describe('getRequestStatus', () => {
    it('should return correct object for PENDING_DATA_REVIEW', () => {
      const result = getRequestStatus('PENDING_DATA_REVIEW');
      expect(result).toEqual({ name: 'To be reviewed', color: '#f1ca32' });
    });

    it('should return correct object for SENT', () => {
      const result = getRequestStatus('SENT');
      expect(result).toEqual({ name: 'Contract sent', color: '#159998' });
    });

    it('should return correct object for ACCEPTED', () => {
      const result = getRequestStatus('ACCEPTED');
      expect(result).toEqual({ name: 'Accepted', color: '#3dd388' });
    });

    it('should return correct object for RECEIVED', () => {
      const result = getRequestStatus('RECEIVED');
      expect(result).toEqual({ name: 'Contract signed', color: '#239E57' });
    });

    it('should return Rejected for REJECTED status', () => {
      const result = getRequestStatus('REJECTED');
      expect(result).toEqual({ name: 'Rejected', color: '#d1615f' });
    });

    it('should return Rejected for NOT_SENT status', () => {
      const result = getRequestStatus('NOT_SENT');
      expect(result).toEqual({ name: 'Rejected', color: '#d1615f' });
    });

    it('should return undefined for unknown status', () => {
      const result = getRequestStatus('UNKNOWN');
      expect(result).toBeUndefined();
    });
  });
});
