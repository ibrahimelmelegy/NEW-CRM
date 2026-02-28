import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import clvService from '../../src/clvAnalytics/clvService';
import ClvRecord from '../../src/clvAnalytics/clvModel';
import Client from '../../src/client/clientModel';

jest.mock('../../src/clvAnalytics/clvModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('ClvService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a CLV record and emit clv:created', async () => {
      const mockRecord = { id: 1, customerId: 'cust-1' };
      (ClvRecord.create as jest.Mock<any>).mockResolvedValue(mockRecord);

      const result = await clvService.create(
        { customerId: 'cust-1', historicalRevenue: 5000, predictedRevenue: 15000 },
        'tenant-1'
      );

      expect(ClvRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          tenantId: 'tenant-1',
          calculatedAt: expect.any(Date)
        })
      );
      expect(result).toEqual(mockRecord);
    });

    it('should not throw when io.emit fails', async () => {
      const { io } = require('../../src/server');
      io.emit.mockImplementation(() => { throw new Error('socket error'); });
      (ClvRecord.create as jest.Mock<any>).mockResolvedValue({ id: 2, customerId: 'c2' });

      const result = await clvService.create({ customerId: 'c2' });
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('should return paginated CLV records with customer include', async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      (ClvRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 2 });

      const result = await clvService.getAll({ page: 1, limit: 20 }, 'tenant-1');

      expect(ClvRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({ model: Client, as: 'customer' })
          ]),
          order: [['predictedRevenue', 'DESC']],
          limit: 20,
          offset: 0,
          distinct: true
        })
      );
      expect(result.docs).toEqual(mockRows);
      expect(result.pagination.totalItems).toBe(2);
    });

    it('should filter by segment and customerId', async () => {
      (ClvRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await clvService.getAll({ segment: 'HIGH_VALUE', customerId: 'cust-1' }, 'tenant-1');

      expect(ClvRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            segment: 'HIGH_VALUE',
            customerId: 'cust-1'
          })
        })
      );
    });

    it('should filter by churnRisk range', async () => {
      (ClvRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await clvService.getAll({ minChurnRisk: '0.3', maxChurnRisk: '0.8' });

      expect(ClvRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            churnRisk: expect.anything()
          })
        })
      );
    });

    it('should return empty docs when no records found', async () => {
      (ClvRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await clvService.getAll({});

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a CLV record by id with customer include', async () => {
      const mock = { id: 1, customerId: 'cust-1' };
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(mock);

      const result = await clvService.getById(1);

      expect(ClvRecord.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Client, as: 'customer' })
        ])
      }));
      expect(result).toEqual(mock);
    });

    it('should return null if record not found', async () => {
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await clvService.getById(999);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update and return the CLV record', async () => {
      const mockItem = { id: 1, update: jest.fn().mockResolvedValue(true) };
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await clvService.update(1, { segment: 'AT_RISK' });

      expect(mockItem.update).toHaveBeenCalledWith({ segment: 'AT_RISK' });
      expect(result).toEqual(mockItem);
    });

    it('should return null if record not found', async () => {
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await clvService.update(999, {});

      expect(result).toBeNull();
    });

    it('should emit clv:updated on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 3, update: jest.fn() };
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await clvService.update(3, { churnRisk: 0.9 });

      expect(io.emit).toHaveBeenCalledWith('clv:updated', { id: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete the record and return true', async () => {
      const mockItem = { id: 1, destroy: jest.fn() };
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await clvService.delete(1);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if record not found', async () => {
      (ClvRecord.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await clvService.delete(999);

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // calculateCLV
  // ---------------------------------------------------------------------------
  describe('calculateCLV', () => {
    const baseInput = {
      customerId: 'cust-1',
      historicalRevenue: 25000,
      avgOrderValue: 500,
      purchaseFrequency: 12,
      customerAge: 2,
      lastPurchaseDate: new Date().toISOString()
    };

    it('should calculate CLV and create a new record when none exists', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      const mockCreated = { id: 1, customerId: 'cust-1', segment: 'MEDIUM_VALUE' };
      (ClvRecord.create as jest.Mock<any>).mockResolvedValue(mockCreated);

      const result = await clvService.calculateCLV(baseInput, 'tenant-1');

      expect(ClvRecord.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1', tenantId: 'tenant-1' })
        })
      );
      expect(ClvRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          historicalRevenue: 25000,
          predictedRevenue: expect.any(Number),
          churnRisk: expect.any(Number),
          segment: expect.any(String),
          calculatedAt: expect.any(Date),
          tenantId: 'tenant-1'
        })
      );
      expect(result).toEqual(mockCreated);
    });

    it('should update existing record instead of creating new one', async () => {
      const mockExisting = {
        id: 5,
        customerId: 'cust-1',
        update: jest.fn().mockResolvedValue(true)
      };
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(mockExisting);

      const result = await clvService.calculateCLV(baseInput);

      expect(mockExisting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          predictedRevenue: expect.any(Number),
          churnRisk: expect.any(Number),
          segment: expect.any(String)
        })
      );
      expect(ClvRecord.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockExisting);
    });

    it('should compute predictedRevenue as avgOrderValue * purchaseFrequency * 3', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        avgOrderValue: 100,
        purchaseFrequency: 10
      });

      // 100 * 10 * 3 = 3000
      expect(result.predictedRevenue).toBe(3000);
    });

    it('should assign HIGH_VALUE segment for historicalRevenue > 50000', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        historicalRevenue: 60000,
        customerAge: 2,
        lastPurchaseDate: new Date().toISOString() // recent => low churn
      });

      expect(result.segment).toBe('HIGH_VALUE');
    });

    it('should assign MEDIUM_VALUE segment for historicalRevenue > 10000', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        historicalRevenue: 25000,
        customerAge: 2,
        lastPurchaseDate: new Date().toISOString()
      });

      expect(result.segment).toBe('MEDIUM_VALUE');
    });

    it('should assign LOW_VALUE segment for low historicalRevenue', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        historicalRevenue: 5000,
        customerAge: 2,
        lastPurchaseDate: new Date().toISOString()
      });

      expect(result.segment).toBe('LOW_VALUE');
    });

    it('should assign NEW segment for customerAge < 0.5 years', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        historicalRevenue: 5000,
        customerAge: 0.3,
        lastPurchaseDate: new Date().toISOString()
      });

      expect(result.segment).toBe('NEW');
    });

    it('should assign AT_RISK segment when churnRisk > 0.7', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      // Use a very old lastPurchaseDate to drive up churn risk
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 3); // 3 years ago

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        historicalRevenue: 60000,
        purchaseFrequency: 12, // expects monthly purchase
        customerAge: 5,
        lastPurchaseDate: oldDate.toISOString()
      });

      expect(result.segment).toBe('AT_RISK');
      expect(result.churnRisk).toBeGreaterThan(0.7);
    });

    it('should clamp churnRisk between 0 and 1', async () => {
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      (ClvRecord.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve(data));

      const result: any = await clvService.calculateCLV({
        ...baseInput,
        lastPurchaseDate: new Date().toISOString()
      });

      expect(result.churnRisk).toBeGreaterThanOrEqual(0);
      expect(result.churnRisk).toBeLessThanOrEqual(1);
    });

    it('should emit clv:calculated event', async () => {
      const { io } = require('../../src/server');
      (ClvRecord.findOne as jest.Mock<any>).mockResolvedValue(null);
      const mockCreated = { id: 10, customerId: 'cust-1', segment: 'MEDIUM_VALUE', churnRisk: 0.15 };
      (ClvRecord.create as jest.Mock<any>).mockResolvedValue(mockCreated);

      await clvService.calculateCLV(baseInput, 'tenant-1');

      expect(io.emit).toHaveBeenCalledWith('clv:calculated', expect.objectContaining({
        id: 10,
        customerId: 'cust-1',
        segment: 'MEDIUM_VALUE'
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // getCohortAnalysis
  // ---------------------------------------------------------------------------
  describe('getCohortAnalysis', () => {
    it('should group customers by segment and compute aggregated metrics', async () => {
      const mockRecords = [
        { segment: 'HIGH_VALUE', historicalRevenue: 60000, predictedRevenue: 90000, churnRisk: 0.1, avgOrderValue: 1000 },
        { segment: 'HIGH_VALUE', historicalRevenue: 80000, predictedRevenue: 120000, churnRisk: 0.2, avgOrderValue: 1500 },
        { segment: 'LOW_VALUE', historicalRevenue: 3000, predictedRevenue: 5000, churnRisk: 0.3, avgOrderValue: 50 }
      ];
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue(mockRecords);

      const result = await clvService.getCohortAnalysis('tenant-1');

      expect(result.totalCustomers).toBe(3);
      expect(result.cohorts.HIGH_VALUE).toBeDefined();
      expect(result.cohorts.HIGH_VALUE.count).toBe(2);
      expect(result.cohorts.HIGH_VALUE.totalHistorical).toBe(140000);
      expect(result.cohorts.HIGH_VALUE.totalPredicted).toBe(210000);
      expect(result.cohorts.HIGH_VALUE.avgChurnRisk).toBe(0.15);
      expect(result.cohorts.HIGH_VALUE.avgOrderValue).toBe(1250);
      expect(result.cohorts.LOW_VALUE).toBeDefined();
      expect(result.cohorts.LOW_VALUE.count).toBe(1);
    });

    it('should return empty cohorts when no records exist', async () => {
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await clvService.getCohortAnalysis();

      expect(result.totalCustomers).toBe(0);
      expect(result.cohorts).toEqual({});
    });

    it('should handle records with null/undefined segment as UNKNOWN', async () => {
      const mockRecords = [
        { segment: null, historicalRevenue: 1000, predictedRevenue: 2000, churnRisk: 0.5, avgOrderValue: 100 }
      ];
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue(mockRecords);

      const result = await clvService.getCohortAnalysis();

      expect(result.cohorts.UNKNOWN).toBeDefined();
      expect(result.cohorts.UNKNOWN.count).toBe(1);
    });

    it('should filter by tenantId', async () => {
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      await clvService.getCohortAnalysis('tenant-2');

      expect(ClvRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-2' })
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getChurnPredictions
  // ---------------------------------------------------------------------------
  describe('getChurnPredictions', () => {
    it('should return at-risk customers sorted by churnRisk descending', async () => {
      const mockAtRisk = [
        { id: 1, churnRisk: 0.9, customerId: 'c1' },
        { id: 2, churnRisk: 0.7, customerId: 'c2' },
        { id: 3, churnRisk: 0.5, customerId: 'c3' }
      ];
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue(mockAtRisk);

      const result = await clvService.getChurnPredictions('tenant-1', 20);

      expect(ClvRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({ model: Client, as: 'customer' })
          ]),
          order: [['churnRisk', 'DESC']],
          limit: 20
        })
      );
      expect(result.atRiskCustomers).toEqual(mockAtRisk);
      expect(result.count).toBe(3);
    });

    it('should return empty when no at-risk customers exist', async () => {
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await clvService.getChurnPredictions();

      expect(result.atRiskCustomers).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should default limit to 20', async () => {
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      await clvService.getChurnPredictions('tenant-1');

      expect(ClvRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 })
      );
    });

    it('should filter by tenantId when provided', async () => {
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      await clvService.getChurnPredictions('tenant-2');

      expect(ClvRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-2' })
        })
      );
    });

    it('should only include customers with churnRisk > 0.3', async () => {
      (ClvRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      await clvService.getChurnPredictions();

      expect(ClvRecord.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            churnRisk: expect.anything() // Op.gt(0.3)
          })
        })
      );
    });
  });
});
