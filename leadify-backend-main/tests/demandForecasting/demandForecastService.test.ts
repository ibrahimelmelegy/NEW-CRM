import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import demandForecastService from '../../src/demandForecasting/demandForecastService';
import DemandForecast from '../../src/demandForecasting/forecastModel';

jest.mock('../../src/demandForecasting/forecastModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('DemandForecastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a forecast and emit forecast:created', async () => {
      const mockForecast = { id: 1, product: 'Widget A' };
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue(mockForecast);

      const result = await demandForecastService.create(
        { product: 'Widget A', period: '2026-Q2', predictedDemand: 500 },
        'tenant-1',
        5
      );

      expect(DemandForecast.create).toHaveBeenCalledWith({
        product: 'Widget A',
        period: '2026-Q2',
        predictedDemand: 500,
        tenantId: 'tenant-1',
        createdBy: 5
      });
      expect(result).toEqual(mockForecast);
    });

    it('should not throw when io.emit fails', async () => {
      const { io } = require('../../src/server');
      io.emit.mockImplementation(() => { throw new Error('socket error'); });
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue({ id: 2, product: 'X' });

      const result = await demandForecastService.create({ product: 'X' });
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('should return paginated forecasts', async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      (DemandForecast.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 2 });

      const result = await demandForecastService.getAll({ page: 1, limit: 20 }, 'tenant-1');

      expect(DemandForecast.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['createdAt', 'DESC']],
          limit: 20,
          offset: 0,
          distinct: true
        })
      );
      expect(result.docs).toEqual(mockRows);
      expect(result.pagination).toEqual({
        page: 1, limit: 20, totalItems: 2, totalPages: 1
      });
    });

    it('should filter by product, status, and method', async () => {
      (DemandForecast.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await demandForecastService.getAll({
        status: 'PENDING',
        method: 'EXPONENTIAL',
        product: 'Widget'
      }, 'tenant-1');

      expect(DemandForecast.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            status: 'PENDING',
            method: 'EXPONENTIAL',
            product: expect.anything() // Op.iLike
          })
        })
      );
    });

    it('should filter by search (product iLike)', async () => {
      (DemandForecast.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await demandForecastService.getAll({ search: 'widget' });

      expect(DemandForecast.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            product: expect.anything()
          })
        })
      );
    });

    it('should return empty docs when no forecasts found', async () => {
      (DemandForecast.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await demandForecastService.getAll({});

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a forecast by id', async () => {
      const mock = { id: 1, product: 'Widget A' };
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(mock);

      const result = await demandForecastService.getById(1);

      expect(DemandForecast.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mock);
    });

    it('should return null if forecast not found', async () => {
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await demandForecastService.getById(999);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update and return the forecast', async () => {
      const mockItem: any = { id: 1, update: jest.fn().mockImplementation(() => Promise.resolve(true)) };
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await demandForecastService.update(1, { status: 'CONFIRMED' });

      expect(mockItem.update).toHaveBeenCalledWith({ status: 'CONFIRMED' });
      expect(result).toEqual(mockItem);
    });

    it('should return null if forecast not found', async () => {
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await demandForecastService.update(999, { status: 'CONFIRMED' });

      expect(result).toBeNull();
    });

    it('should emit forecast:updated on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 3, update: jest.fn() };
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await demandForecastService.update(3, { actualDemand: 480 });

      expect(io.emit).toHaveBeenCalledWith('forecast:updated', { id: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete the forecast and return true', async () => {
      const mockItem = { id: 1, destroy: jest.fn() };
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await demandForecastService.delete(1);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if forecast not found', async () => {
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await demandForecastService.delete(999);

      expect(result).toBe(false);
    });

    it('should emit forecast:deleted on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 5, destroy: jest.fn() };
      (DemandForecast.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await demandForecastService.delete(5);

      expect(io.emit).toHaveBeenCalledWith('forecast:deleted', { id: 5 });
    });
  });

  // ---------------------------------------------------------------------------
  // generateForecast
  // ---------------------------------------------------------------------------
  describe('generateForecast', () => {
    const historicalData = [
      { period: '2025-10', demand: 100 },
      { period: '2025-11', demand: 120 },
      { period: '2025-12', demand: 110 },
      { period: '2026-01', demand: 130 },
      { period: '2026-02', demand: 140 }
    ];

    it('should generate a forecast using MOVING_AVG method', async () => {
      const mockCreated = { id: 1, product: 'Widget A', predictedDemand: 126.67 };
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue(mockCreated);

      const result = await demandForecastService.generateForecast({
        product: 'Widget A',
        historicalData,
        method: 'MOVING_AVG',
        windowSize: 3,
        targetPeriod: '2026-03'
      }, 'tenant-1', 5);

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product: 'Widget A',
          period: '2026-03',
          method: 'MOVING_AVG',
          windowSize: 3,
          tenantId: 'tenant-1',
          createdBy: 5,
          predictedDemand: expect.any(Number),
          confidence: expect.any(Number)
        })
      );
      expect(result).toEqual(mockCreated);
    });

    it('should generate a forecast using WEIGHTED_AVG method', async () => {
      const mockCreated = { id: 2, product: 'Widget B' };
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue(mockCreated);

      const result = await demandForecastService.generateForecast({
        product: 'Widget B',
        historicalData,
        method: 'WEIGHTED_AVG',
        targetPeriod: '2026-03'
      });

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'WEIGHTED_AVG',
          predictedDemand: expect.any(Number),
          confidence: expect.any(Number)
        })
      );
      expect(result).toEqual(mockCreated);
    });

    it('should generate a forecast using EXPONENTIAL method', async () => {
      const mockCreated = { id: 3, product: 'Widget C' };
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue(mockCreated);

      const result = await demandForecastService.generateForecast({
        product: 'Widget C',
        historicalData,
        method: 'EXPONENTIAL',
        targetPeriod: '2026-03'
      });

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'EXPONENTIAL',
          predictedDemand: expect.any(Number),
          confidence: expect.any(Number)
        })
      );
      expect(result).toEqual(mockCreated);
    });

    it('should default to MOVING_AVG when method not specified', async () => {
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue({ id: 4 });

      await demandForecastService.generateForecast({
        product: 'Widget D',
        historicalData,
        targetPeriod: '2026-03'
      });

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'MOVING_AVG' })
      );
    });

    it('should default windowSize to 3', async () => {
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue({ id: 5 });

      await demandForecastService.generateForecast({
        product: 'Widget E',
        historicalData,
        targetPeriod: '2026-03'
      });

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({ windowSize: 3 })
      );
    });

    it('should return error object when historicalData is empty', async () => {
      const result = await demandForecastService.generateForecast({
        product: 'Widget F',
        historicalData: [],
        targetPeriod: '2026-03'
      });

      expect(result).toEqual({ error: 'Historical data is required' });
      expect(DemandForecast.create).not.toHaveBeenCalled();
    });

    it('should return error object when historicalData is undefined/null', async () => {
      const result = await demandForecastService.generateForecast({
        product: 'Widget G',
        historicalData: undefined as any,
        targetPeriod: '2026-03'
      });

      expect(result).toEqual({ error: 'Historical data is required' });
    });

    it('should sort historical data by period before computing', async () => {
      const unsortedData = [
        { period: '2026-02', demand: 200 },
        { period: '2025-12', demand: 100 },
        { period: '2026-01', demand: 150 }
      ];
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue({ id: 6 });

      await demandForecastService.generateForecast({
        product: 'Widget H',
        historicalData: unsortedData,
        method: 'MOVING_AVG',
        windowSize: 3,
        targetPeriod: '2026-03'
      });

      // With sorted data [100, 150, 200], SMA(3) = (100+150+200)/3 = 150
      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          predictedDemand: 150,
          historicalData: [
            { period: '2025-12', demand: 100 },
            { period: '2026-01', demand: 150 },
            { period: '2026-02', demand: 200 }
          ]
        })
      );
    });

    it('should emit forecast:generated event', async () => {
      const { io } = require('../../src/server');
      const mockCreated = { id: 10, product: 'Widget I', predictedDemand: 126.67 };
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue(mockCreated);

      await demandForecastService.generateForecast({
        product: 'Widget I',
        historicalData,
        targetPeriod: '2026-03'
      });

      expect(io.emit).toHaveBeenCalledWith('forecast:generated', {
        id: 10,
        product: 'Widget I',
        predictedDemand: 126.67
      });
    });

    it('should compute MOVING_AVG correctly with window=3 on known data', async () => {
      // Data: [100, 120, 110, 130, 140] (sorted). Window=3 takes last 3: [110, 130, 140]
      // SMA = (110 + 130 + 140) / 3 = 126.67
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue({ id: 11 });

      await demandForecastService.generateForecast({
        product: 'Test',
        historicalData,
        method: 'MOVING_AVG',
        windowSize: 3,
        targetPeriod: '2026-03'
      });

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          predictedDemand: 126.67
        })
      );
    });

    it('should clamp confidence between 0 and 1', async () => {
      // Very consistent data should produce confidence close to 1
      const consistentData = [
        { period: '2025-10', demand: 100 },
        { period: '2025-11', demand: 100 },
        { period: '2025-12', demand: 100 }
      ];
      (DemandForecast.create as jest.Mock<any>).mockResolvedValue({ id: 12 });

      await demandForecastService.generateForecast({
        product: 'Steady',
        historicalData: consistentData,
        method: 'MOVING_AVG',
        windowSize: 3,
        targetPeriod: '2026-01'
      });

      expect(DemandForecast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          confidence: 1 // zero variance = max confidence
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getAccuracyReport
  // ---------------------------------------------------------------------------
  describe('getAccuracyReport', () => {
    it('should compute MAPE and bias for confirmed forecasts', async () => {
      const mockForecasts = [
        { id: 1, product: 'A', period: '2026-Q1', predictedDemand: 100, actualDemand: 110 },
        { id: 2, product: 'B', period: '2026-Q1', predictedDemand: 200, actualDemand: 180 }
      ];
      (DemandForecast.findAll as jest.Mock<any>).mockResolvedValue(mockForecasts);

      const result = await demandForecastService.getAccuracyReport('tenant-1');

      expect(DemandForecast.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ raw: true })
      );
      expect(result.count).toBe(2);
      expect(result.mape).toEqual(expect.any(Number));
      expect(result.bias).toEqual(expect.any(Number));
      expect(result.forecasts).toHaveLength(2);
      // Forecast 1: error=10, absPercError=9.1%
      // Forecast 2: error=-20, absPercError=11.1%
      // MAPE = (9.1+11.1)/2 = 10.1%, bias = (10-20)/2 = -5
      expect(result.mape).toBeCloseTo(10.1, 0);
      expect(result.bias).toBeCloseTo(-5, 0);
    });

    it('should return null metrics when no confirmed forecasts exist', async () => {
      (DemandForecast.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await demandForecastService.getAccuracyReport();

      expect(result.count).toBe(0);
      expect(result.mape).toBeNull();
      expect(result.bias).toBeNull();
      expect(result.forecasts).toEqual([]);
    });

    it('should handle actualDemand of zero gracefully', async () => {
      const mockForecasts = [
        { id: 1, product: 'A', period: '2026-Q1', predictedDemand: 100, actualDemand: 0 }
      ];
      (DemandForecast.findAll as jest.Mock<any>).mockResolvedValue(mockForecasts);

      const result = await demandForecastService.getAccuracyReport();

      // When actualDemand=0, absPercError=0 (guarded in the code)
      expect(result.count).toBe(1);
      expect(result.mape).toBe(0);
    });

    it('should filter by tenantId when provided', async () => {
      (DemandForecast.findAll as jest.Mock<any>).mockResolvedValue([]);

      await demandForecastService.getAccuracyReport('tenant-2');

      expect(DemandForecast.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-2',
            status: 'CONFIRMED'
          })
        })
      );
    });
  });
});
