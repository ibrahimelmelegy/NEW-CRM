/**
 * useDashboard - Unit Tests
 * ==========================
 * Tests for composables/useDashboard.ts
 *
 * The module provides async functions to fetch and manage dashboards:
 * - fetchDashboards, fetchDashboard
 * - createDashboard, updateDashboard, deleteDashboard
 * - fetchWidgetData, fetchExecutiveSummary
 * - fetchPipelineData, fetchRevenueChart, fetchTeamPerformance
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
  fetchDashboards,
  fetchDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  fetchWidgetData,
  fetchExecutiveSummary,
  fetchPipelineData,
  fetchRevenueChart,
  fetchTeamPerformance,
  type Dashboard,
  type DashboardWidget
} from '@/composables/useDashboard';

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchDashboards
  // ============================================
  describe('fetchDashboards', () => {
    it('should return array of dashboards on success (docs format)', async () => {
      const mockDashboards: Dashboard[] = [
        { id: 1, name: 'Main Dashboard', widgets: [], userId: 1 },
        { id: 2, name: 'Sales Dashboard', widgets: [], userId: 1 }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDashboards },
        success: true
      });

      const result = await fetchDashboards();

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards');
      expect(result).toEqual(mockDashboards);
    });

    it('should return array directly when not wrapped in docs', async () => {
      const mockDashboards: Dashboard[] = [
        { id: 1, name: 'Main Dashboard', widgets: [], userId: 1 }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: mockDashboards,
        success: true
      });

      const result = await fetchDashboards();

      expect(result).toEqual(mockDashboards);
    });

    it('should return empty array when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false
      });

      const result = await fetchDashboards();

      expect(result).toEqual([]);
    });

    it('should return empty array when success is false', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [{ id: 1 }] },
        success: false
      });

      const result = await fetchDashboards();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchDashboard
  // ============================================
  describe('fetchDashboard', () => {
    it('should return dashboard by ID on success', async () => {
      const mockDashboard: Dashboard = { id: 1, name: 'Main', widgets: [], userId: 1 };

      mockUseApiFetch.mockResolvedValue({
        body: mockDashboard,
        success: true
      });

      const result = await fetchDashboard(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/1');
      expect(result).toEqual(mockDashboard);
    });

    it('should return null when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false
      });

      const result = await fetchDashboard(99);

      expect(result).toBeNull();
    });

    it('should return null when success is true but body is null', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: true
      });

      const result = await fetchDashboard(1);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createDashboard
  // ============================================
  describe('createDashboard', () => {
    it('should call API with POST method and data', async () => {
      const newDashboard = { name: 'New Dashboard', description: 'A new dashboard' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 3, ...newDashboard } });

      await createDashboard(newDashboard);

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards', 'POST', newDashboard);
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 3, name: 'New Dashboard', widgets: [], userId: 1 } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createDashboard({ name: 'New Dashboard' });

      expect(result).toEqual(response);
    });

    it('should handle creation failure', async () => {
      const response = { success: false, message: 'Validation error' };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createDashboard({ name: '' });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // updateDashboard
  // ============================================
  describe('updateDashboard', () => {
    it('should call API with PUT method, ID, and data', async () => {
      const updateData = { name: 'Updated Dashboard' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 1, ...updateData } });

      await updateDashboard(1, updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/1', 'PUT', updateData);
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: 1, name: 'Updated' } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await updateDashboard(1, { name: 'Updated' });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // deleteDashboard
  // ============================================
  describe('deleteDashboard', () => {
    it('should call API with DELETE method and correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteDashboard(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/1', 'DELETE');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: null };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await deleteDashboard(1);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // fetchWidgetData
  // ============================================
  describe('fetchWidgetData', () => {
    it('should call API with widget config and return body on success', async () => {
      const widgetConfig = { type: 'stat', metric: 'total_leads' };
      const mockData = { value: 150, change: 12.5 };

      mockUseApiFetch.mockResolvedValue({
        body: mockData,
        success: true
      });

      const result = await fetchWidgetData(widgetConfig);

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/widget-data', 'POST', widgetConfig);
      expect(result).toEqual(mockData);
    });

    it('should return null when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false
      });

      const result = await fetchWidgetData({ type: 'stat' });

      expect(result).toBeNull();
    });
  });

  // ============================================
  // fetchExecutiveSummary
  // ============================================
  describe('fetchExecutiveSummary', () => {
    it('should fetch executive summary data', async () => {
      const mockSummary = { totalRevenue: 500000, totalLeads: 150, conversionRate: 0.35 };

      mockUseApiFetch.mockResolvedValue({
        body: mockSummary,
        success: true
      });

      const result = await fetchExecutiveSummary();

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/executive-summary');
      expect(result).toEqual(mockSummary);
    });

    it('should return null when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false
      });

      const result = await fetchExecutiveSummary();

      expect(result).toBeNull();
    });
  });

  // ============================================
  // fetchPipelineData
  // ============================================
  describe('fetchPipelineData', () => {
    it('should fetch pipeline data without date range', async () => {
      const mockPipeline = { stages: [], total: 0 };

      mockUseApiFetch.mockResolvedValue({
        body: mockPipeline,
        success: true
      });

      const result = await fetchPipelineData();

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/pipeline');
      expect(result).toEqual(mockPipeline);
    });

    it('should fetch pipeline data with date range', async () => {
      const dateRange = { start: '2024-01-01', end: '2024-01-31' };
      const mockPipeline = { stages: [], total: 0 };

      mockUseApiFetch.mockResolvedValue({
        body: mockPipeline,
        success: true
      });

      await fetchPipelineData(dateRange);

      expect(mockUseApiFetch).toHaveBeenCalledWith(
        'dashboards/pipeline?startDate=2024-01-01&endDate=2024-01-31'
      );
    });

    it('should return null when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchPipelineData();

      expect(result).toBeNull();
    });
  });

  // ============================================
  // fetchRevenueChart
  // ============================================
  describe('fetchRevenueChart', () => {
    it('should fetch revenue chart with default monthly period', async () => {
      const mockRevenue = { labels: [], data: [] };

      mockUseApiFetch.mockResolvedValue({
        body: mockRevenue,
        success: true
      });

      await fetchRevenueChart();

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('dashboards/revenue');
      expect(calledUrl).toContain('period=monthly');
    });

    it('should fetch revenue chart with custom period', async () => {
      mockUseApiFetch.mockResolvedValue({ body: {}, success: true });

      await fetchRevenueChart('quarterly');

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('period=quarterly');
    });

    it('should include date range when provided', async () => {
      const dateRange = { start: '2024-01-01', end: '2024-03-31' };
      mockUseApiFetch.mockResolvedValue({ body: {}, success: true });

      await fetchRevenueChart('monthly', dateRange);

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('startDate=2024-01-01');
      expect(calledUrl).toContain('endDate=2024-03-31');
    });

    it('should return null when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchRevenueChart();

      expect(result).toBeNull();
    });
  });

  // ============================================
  // fetchTeamPerformance
  // ============================================
  describe('fetchTeamPerformance', () => {
    it('should fetch team performance data without date range', async () => {
      const mockPerformance = { members: [], topPerformer: null };

      mockUseApiFetch.mockResolvedValue({
        body: mockPerformance,
        success: true
      });

      const result = await fetchTeamPerformance();

      expect(mockUseApiFetch).toHaveBeenCalledWith('dashboards/team-performance');
      expect(result).toEqual(mockPerformance);
    });

    it('should fetch team performance with date range', async () => {
      const dateRange = { start: '2024-01-01', end: '2024-01-31' };

      mockUseApiFetch.mockResolvedValue({ body: {}, success: true });

      await fetchTeamPerformance(dateRange);

      expect(mockUseApiFetch).toHaveBeenCalledWith(
        'dashboards/team-performance?startDate=2024-01-01&endDate=2024-01-31'
      );
    });

    it('should return null when API call fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTeamPerformance();

      expect(result).toBeNull();
    });
  });

  // ============================================
  // DashboardWidget type
  // ============================================
  describe('DashboardWidget interface', () => {
    it('should create a valid widget object', () => {
      const widget: DashboardWidget = {
        id: 'widget-1',
        type: 'stat',
        title: 'Total Leads',
        config: { metric: 'total_leads' },
        width: 4,
        height: 2,
        position: { x: 0, y: 0 }
      };

      expect(widget.id).toBe('widget-1');
      expect(widget.type).toBe('stat');
      expect(widget.width).toBe(4);
    });
  });
});
