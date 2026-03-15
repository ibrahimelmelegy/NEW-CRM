/**
 * charts - Unit Tests
 * ====================
 * Tests for composables/charts.ts
 *
 * The module provides chart data transformation utilities:
 * - getPieChartsData(data, colorpallete, position, left)
 * - getBarChartData(data, colorpallete)
 * - getBarHorizontalChartData(data, colorpallete)
 * - getConversionGauge(value)
 * - getIncreaseLineChart(data, colorPalette)
 * - getBarChartWithLineData(data, legend, colorpallete)
 * - getCenterPieChartsData(data, colorpallete, title)
 * - getLeadsStatics, getProjectOperationsStatics, getBussinesStatics, getPerformanceStatics
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

vi.mock('echarts/core', () => ({
  graphic: {
    LinearGradient: class {
      constructor(...args: unknown[]) { return args; }
    }
  }
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);
(globalThis as Record<string, unknown>).ElNotification = (...args: unknown[]) => mockElNotification(...args);
(globalThis as Record<string, unknown>).useNuxtApp = () => mockNuxtApp;

const { ref } = await import('vue');
(globalThis as Record<string, unknown>).ref = ref;

// Import auto-import helpers used by charts.ts
(globalThis as Record<string, unknown>).formatLargeNumber = (n: number) => String(n);
(globalThis as Record<string, unknown>).capitalizeName = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
(globalThis as Record<string, unknown>).formatSnakeCase = (s: string) => s.replace(/_/g, ' ');

import {
  getPieChartsData,
  getBarChartData,
  getBarHorizontalChartData,
  getConversionGauge,
  getIncreaseLineChart,
  getBarChartWithLineData,
  getCenterPieChartsData,
  getLeadsStatics,
  getProjectOperationsStatics,
  getBussinesStatics,
  getPerformanceStatics
} from '@/composables/charts';

const sampleData = [
  { name: 'Q1', value: 100 },
  { name: 'Q2', value: 200 },
  { name: 'Q3', value: 150 }
];

const sampleColors = ['#ff0000', '#00ff00', '#0000ff'];

describe('charts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getPieChartsData
  // ============================================
  describe('getPieChartsData', () => {
    it('should return empty object when data is null/undefined', () => {
      expect(getPieChartsData(null, sampleColors)).toEqual({});
      expect(getPieChartsData(undefined, sampleColors)).toEqual({});
    });

    it('should return object with tooltip configuration', () => {
      const result = getPieChartsData(sampleData, sampleColors);

      expect(result).toHaveProperty('tooltip');
      expect(result.tooltip.trigger).toBe('item');
    });

    it('should return object with series array', () => {
      const result = getPieChartsData(sampleData, sampleColors);

      expect(result).toHaveProperty('series');
      expect(result.series).toHaveLength(1);
      expect(result.series[0].type).toBe('pie');
    });

    it('should include legend configuration', () => {
      const result = getPieChartsData(sampleData, sampleColors);
      expect(result).toHaveProperty('legend');
    });

    it('should apply custom position and left alignment', () => {
      const result = getPieChartsData(sampleData, sampleColors, '20%', 'left');

      expect(result.legend.top).toBe('20%');
      expect(result.legend.left).toBe('left');
    });
  });

  // ============================================
  // getBarChartData
  // ============================================
  describe('getBarChartData', () => {
    it('should return empty object when data is null', () => {
      expect(getBarChartData(null, sampleColors)).toEqual({});
    });

    it('should return chart config with xAxis categories from data names', () => {
      const result = getBarChartData(sampleData, sampleColors);

      expect(result).toHaveProperty('xAxis');
      expect(result.xAxis.data).toEqual(['Q1', 'Q2', 'Q3']);
    });

    it('should map data values to series data', () => {
      const result = getBarChartData(sampleData, sampleColors);

      expect(result.series[0].data).toEqual([100, 200, 150]);
    });

    it('should have bar chart type in series', () => {
      const result = getBarChartData(sampleData, sampleColors);
      expect(result.series[0].type).toBe('bar');
    });

    it('should include grid configuration', () => {
      const result = getBarChartData(sampleData, sampleColors);
      expect(result).toHaveProperty('grid');
    });
  });

  // ============================================
  // getBarHorizontalChartData
  // ============================================
  describe('getBarHorizontalChartData', () => {
    it('should return empty object when data is null', () => {
      expect(getBarHorizontalChartData(null, sampleColors)).toEqual({});
    });

    it('should map names to yAxis categories', () => {
      const result = getBarHorizontalChartData(sampleData, sampleColors);

      expect(result.yAxis.data).toEqual(['Q1', 'Q2', 'Q3']);
    });

    it('should have horizontal bar chart with value x-axis', () => {
      const result = getBarHorizontalChartData(sampleData, sampleColors);

      expect(result.xAxis.type).toBe('value');
      expect(result.yAxis.type).toBe('category');
    });
  });

  // ============================================
  // getConversionGauge
  // ============================================
  describe('getConversionGauge', () => {
    it('should return gauge chart config', () => {
      const result = getConversionGauge(75);

      expect(result).toHaveProperty('series');
      expect(result.series[0].type).toBe('gauge');
    });

    it('should set value in gauge data', () => {
      const result = getConversionGauge(42);
      expect(result.series[0].data[0].value).toBe(42);
    });

    it('should handle string value input', () => {
      const result = getConversionGauge(35.5);
      expect(result.series[0].data[0].value).toBe(35.5);
    });

    it('should handle 0 value', () => {
      const result = getConversionGauge(0);
      expect(result.series[0].data[0].value).toBe(0);
    });

    it('should handle 100 value', () => {
      const result = getConversionGauge(100);
      expect(result.series[0].data[0].value).toBe(100);
    });
  });

  // ============================================
  // getIncreaseLineChart
  // ============================================
  describe('getIncreaseLineChart', () => {
    it('should return empty object when data is null', () => {
      expect(getIncreaseLineChart(null, sampleColors)).toEqual({});
    });

    it('should return line chart config', () => {
      const result = getIncreaseLineChart(sampleData, sampleColors);

      expect(result.series[0].type).toBe('line');
    });

    it('should map data values correctly', () => {
      const result = getIncreaseLineChart(sampleData, sampleColors);
      expect(result.series[0].data).toEqual([100, 200, 150]);
    });

    it('should map data names to xAxis', () => {
      const result = getIncreaseLineChart(sampleData, sampleColors);
      expect(result.xAxis.data).toEqual(['Q1', 'Q2', 'Q3']);
    });
  });

  // ============================================
  // getBarChartWithLineData
  // ============================================
  describe('getBarChartWithLineData', () => {
    it('should return empty object when data is null', () => {
      expect(getBarChartWithLineData(null, [], sampleColors)).toEqual({});
    });

    it('should have two series (bar and line)', () => {
      const result = getBarChartWithLineData(sampleData, ['Revenue', 'Paid'], sampleColors);

      expect(result.series).toHaveLength(2);
      expect(result.series[0].type).toBe('bar');
      expect(result.series[1].type).toBe('line');
    });

    it('should set legend data from provided legend array', () => {
      const result = getBarChartWithLineData(sampleData, ['Revenue', 'Paid'], sampleColors);
      expect(result.legend.data).toEqual(['Revenue', 'Paid']);
    });
  });

  // ============================================
  // getCenterPieChartsData
  // ============================================
  describe('getCenterPieChartsData', () => {
    it('should return empty object when data is null', () => {
      expect(getCenterPieChartsData(null, sampleColors)).toEqual({});
    });

    it('should include title when provided', () => {
      const result = getCenterPieChartsData(sampleData, sampleColors, 'Revenue Split');
      expect(result.title.text).toBe('Revenue Split');
    });

    it('should default to empty title', () => {
      const result = getCenterPieChartsData(sampleData, sampleColors);
      expect(result.title.text).toBe('');
    });

    it('should return pie chart with donut style', () => {
      const result = getCenterPieChartsData(sampleData, sampleColors);
      expect(result.series[0].type).toBe('pie');
      // Donut has inner radius
      expect(result.series[0].radius[0]).toBeTruthy();
    });
  });

  // ============================================
  // getLeadsStatics
  // ============================================
  describe('getLeadsStatics', () => {
    it('should fetch and transform leads stats', async () => {
      const mockBody = {
        leadCount: 150,
        leadConversionRate: 35.5,
        opportunityCount: 80,
        dealsCount: 50,
        revenueFromDeals: 500000,
        opportunityStages: { NEW: 30, QUALIFIED: 25 },
        dealsPipeline: { NEGOTIATION: 10, WON: 20 },
        salesPerformance: [{ date: '2024-01', revenue: 50000 }]
      };
      mockUseApiFetch.mockResolvedValue({ body: mockBody, success: true });

      const result = await getLeadsStatics();

      expect(mockUseApiFetch).toHaveBeenCalledWith('insights/leads-sales');
      expect(result.firstCards).toHaveLength(3);
      expect(result.firstCards[0]?.value).toBe(150);
    });

    it('should return default empty structure on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await getLeadsStatics();

      expect(result.firstCards).toEqual([]);
      expect(result.opportunityStages).toEqual([]);
    });

    it('should show error notification on exception', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('API error'));

      const result = await getLeadsStatics();

      expect(result.firstCards).toEqual([]);
    });
  });

  // ============================================
  // getBussinesStatics
  // ============================================
  describe('getBussinesStatics', () => {
    it('should fetch business metrics', async () => {
      const mockBody = {
        revenueFromDeals: 1000000,
        outstandingInvoicesCount: 25,
        collectedPaymentsCount: 100
      };
      mockUseApiFetch.mockResolvedValue({ body: mockBody, success: true });

      const result = await getBussinesStatics();

      expect(mockUseApiFetch).toHaveBeenCalledWith('insights/financial-business-metrics');
      expect(result.firstCards).toHaveLength(3);
    });

    it('should return default empty on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await getBussinesStatics();

      expect(result.firstCards).toEqual([]);
    });
  });

  // ============================================
  // getPerformanceStatics
  // ============================================
  describe('getPerformanceStatics', () => {
    it('should fetch performance stats', async () => {
      const mockBody = {
        leadCount: 200,
        percentageOfOpportunitiesBecameDeals: 45.5,
        dealsCount: 90
      };
      mockUseApiFetch.mockResolvedValue({ body: mockBody, success: true });

      const result = await getPerformanceStatics();

      expect(mockUseApiFetch).toHaveBeenCalledWith('insights/performance-hr');
      expect(result.firstCards).toHaveLength(3);
    });

    it('should return default empty on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await getPerformanceStatics();

      expect(result.firstCards).toEqual([]);
    });
  });
});
