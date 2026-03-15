/**
 * useChurnDashboard - Unit Tests
 * =================================
 * Tests for composables/useChurnDashboard.ts
 *
 * The module provides:
 * - getChurnDashboardData(): fetch churn metrics and at-risk leads
 * - getRiskTagType(level): return Element Plus tag type for risk level
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();
const mockNuxtApp = {
  $i18n: {
    t: (key: string) => key
  }
};

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockElNotification(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);
(globalThis as Record<string, unknown>).ElNotification = (...args: unknown[]) => mockElNotification(...args);
(globalThis as Record<string, unknown>).useNuxtApp = () => mockNuxtApp;

import { getChurnDashboardData, getRiskTagType } from '@/composables/useChurnDashboard';

describe('useChurnDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getChurnDashboardData
  // ============================================
  describe('getChurnDashboardData', () => {
    it('should return churn dashboard data on success', async () => {
      const mockData = {
        summary: { highRisk: 5, mediumRisk: 12, lowRisk: 30, totalAtRisk: 47 },
        atRiskLeads: [
          { id: '1', name: 'Acme Corp', email: 'contact@acme.com', status: 'active', riskLevel: 'HIGH', riskScore: 85, daysSinceLastContact: 45, lastContactDate: '2024-01-01' }
        ],
        riskDistribution: [
          { name: 'HIGH', value: 5 },
          { name: 'MEDIUM', value: 12 },
          { name: 'LOW', value: 30 }
        ]
      };
      mockUseApiFetch.mockResolvedValue({ body: mockData, success: true, message: '' });

      const result = await getChurnDashboardData();

      expect(mockUseApiFetch).toHaveBeenCalledWith('ai/churn-dashboard');
      expect(result).toEqual(mockData);
      expect(result?.summary.highRisk).toBe(5);
    });

    it('should return null and show error notification when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false, message: 'Service unavailable' });

      const result = await getChurnDashboardData();

      expect(result).toBeNull();
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should return null and show error on thrown exception', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await getChurnDashboardData();

      expect(result).toBeNull();
      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('should handle empty at-risk leads list', async () => {
      const mockData = {
        summary: { highRisk: 0, mediumRisk: 0, lowRisk: 0, totalAtRisk: 0 },
        atRiskLeads: [],
        riskDistribution: []
      };
      mockUseApiFetch.mockResolvedValue({ body: mockData, success: true, message: '' });

      const result = await getChurnDashboardData();

      expect(result?.atRiskLeads).toHaveLength(0);
      expect(result?.summary.totalAtRisk).toBe(0);
    });

    it('should return data with correct risk distribution', async () => {
      const mockData = {
        summary: { highRisk: 10, mediumRisk: 20, lowRisk: 70, totalAtRisk: 100 },
        atRiskLeads: [],
        riskDistribution: [
          { name: 'HIGH', value: 10 },
          { name: 'MEDIUM', value: 20 },
          { name: 'LOW', value: 70 }
        ]
      };
      mockUseApiFetch.mockResolvedValue({ body: mockData, success: true, message: '' });

      const result = await getChurnDashboardData();

      expect(result?.riskDistribution).toHaveLength(3);
      const highRisk = result?.riskDistribution.find(r => r.name === 'HIGH');
      expect(highRisk?.value).toBe(10);
    });
  });

  // ============================================
  // getRiskTagType
  // ============================================
  describe('getRiskTagType', () => {
    it('should return "danger" for HIGH risk', () => {
      expect(getRiskTagType('HIGH')).toBe('danger');
    });

    it('should return "warning" for MEDIUM risk', () => {
      expect(getRiskTagType('MEDIUM')).toBe('warning');
    });

    it('should return "info" for LOW risk', () => {
      expect(getRiskTagType('LOW')).toBe('info');
    });

    it('should return "info" for unknown risk level', () => {
      expect(getRiskTagType('UNKNOWN')).toBe('info');
      expect(getRiskTagType('')).toBe('info');
    });

    it('should be case-sensitive', () => {
      // lowercase 'high' is not a valid value - defaults to info
      expect(getRiskTagType('high')).toBe('info');
    });
  });
});
