/**
 * useForecasting - Unit Tests
 * ============================
 * Tests for composables/useForecasting.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

import {
  fetchForecasts,
  fetchForecastByPeriod,
  fetchForecastByUser,
  createForecast,
  updateForecast,
  calculateFromPipeline,
  fetchHistoricalComparison,
  runScenario,
  fetchTeamBreakdown,
  type ForecastPeriod
} from '@/composables/useForecasting';

const mockForecast = (overrides: Partial<ForecastPeriod> = {}): ForecastPeriod => ({
  id: 'forecast-1',
  userId: 'user-1',
  period: 'monthly',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  target: 100000,
  predicted: 85000,
  actual: 78000,
  closedWon: 70000,
  closedLost: 30000,
  pipeline: 250000,
  ...overrides
});

describe('useForecasting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchForecasts
  // ============================================
  describe('fetchForecasts', () => {
    it('should fetch forecasts from correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchForecasts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('forecasting');
    });

    it('should append query parameters when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchForecasts({ period: 'monthly', userId: 'user-1' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('forecasting?');
      expect(calledUrl).toContain('period=monthly');
      expect(calledUrl).toContain('userId=user-1');
    });

    it('should return forecast docs and pagination', async () => {
      const mockDocs = [mockForecast()];
      const mockPagination = { page: 1, limit: 20, totalItems: 1, totalPages: 1 };

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: mockPagination },
        success: true
      });

      const result = await fetchForecasts();

      expect(result.docs).toEqual(mockDocs);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('should return empty docs when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchForecasts();

      expect(result.docs).toEqual([]);
    });
  });

  // ============================================
  // fetchForecastByPeriod
  // ============================================
  describe('fetchForecastByPeriod', () => {
    it('should fetch forecasts for specific period and date range', async () => {
      const mockDocs = [mockForecast()];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const result = await fetchForecastByPeriod('monthly', '2024-01-01', '2024-01-31');

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('forecasting/period');
      expect(calledUrl).toContain('period=monthly');
      expect(calledUrl).toContain('startDate=2024-01-01');
      expect(calledUrl).toContain('endDate=2024-01-31');
      expect(result).toEqual(mockDocs);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchForecastByPeriod('quarterly', '2024-01-01', '2024-03-31');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchForecastByUser
  // ============================================
  describe('fetchForecastByUser', () => {
    it('should fetch forecasts for specific user', async () => {
      const mockDocs = [mockForecast({ userId: 'user-123' })];
      mockUseApiFetch.mockResolvedValue({ body: { docs: mockDocs }, success: true });

      const result = await fetchForecastByUser('user-123');

      expect(mockUseApiFetch).toHaveBeenCalledWith('forecasting/user/user-123');
      expect(result).toEqual(mockDocs);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchForecastByUser('user-999');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // createForecast
  // ============================================
  describe('createForecast', () => {
    it('should create forecast with POST method', async () => {
      const newForecast: Partial<ForecastPeriod> = {
        period: 'quarterly',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        target: 300000
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'forecast-new', ...newForecast } });

      await createForecast(newForecast);

      expect(mockUseApiFetch).toHaveBeenCalledWith('forecasting', 'POST', newForecast);
    });

    it('should return API response', async () => {
      const response = { success: true, body: { id: 'forecast-2' } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createForecast({ period: 'monthly', target: 100000 });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // updateForecast
  // ============================================
  describe('updateForecast', () => {
    it('should update forecast with PUT method and ID', async () => {
      const updateData = { target: 150000 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateForecast('forecast-1', updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('forecasting/forecast-1', 'PUT', updateData);
    });
  });

  // ============================================
  // calculateFromPipeline
  // ============================================
  describe('calculateFromPipeline', () => {
    it('should calculate forecast from pipeline data', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { predicted: 85000 } });

      await calculateFromPipeline('user-1', 'monthly');

      expect(mockUseApiFetch).toHaveBeenCalledWith('forecasting/calculate', 'POST', {
        userId: 'user-1',
        period: 'monthly'
      });
    });
  });

  // ============================================
  // fetchHistoricalComparison
  // ============================================
  describe('fetchHistoricalComparison', () => {
    it('should fetch historical comparison with period and dates', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await fetchHistoricalComparison('monthly', '2024-01-01', '2024-01-31');

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('forecasting/historical-comparison');
      expect(calledUrl).toContain('period=monthly');
      expect(calledUrl).toContain('startDate=2024-01-01');
    });
  });

  // ============================================
  // runScenario
  // ============================================
  describe('runScenario', () => {
    it('should run forecast scenario with adjustments', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { result: 95000 } });

      await runScenario(0.1, 0.05);

      expect(mockUseApiFetch).toHaveBeenCalledWith('forecasting/scenario', 'POST', {
        winRateAdjustment: 0.1,
        dealValueAdjustment: 0.05
      });
    });

    it('should return scenario results', async () => {
      const response = { success: true, body: { result: 95000, breakdown: [] } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await runScenario(0.2, 0);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // fetchTeamBreakdown
  // ============================================
  describe('fetchTeamBreakdown', () => {
    it('should fetch team breakdown with period and dates', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await fetchTeamBreakdown('quarterly', '2024-01-01', '2024-03-31');

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('forecasting/team-breakdown');
      expect(calledUrl).toContain('period=quarterly');
      expect(calledUrl).toContain('startDate=2024-01-01');
      expect(calledUrl).toContain('endDate=2024-03-31');
    });
  });
});
