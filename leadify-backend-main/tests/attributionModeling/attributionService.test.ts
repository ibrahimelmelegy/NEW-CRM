
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/attributionModeling/touchpointModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

import attributionService from '../../src/attributionModeling/attributionService';
import Touchpoint from '../../src/attributionModeling/touchpointModel';

describe('AttributionService', () => {
  const mockTouchpoint: any = {
    id: 1,
    dealId: 'deal-100',
    channel: 'ORGANIC_SEARCH',
    touchpointDate: new Date('2026-01-15'),
    campaign: 'Spring Campaign',
    creditPercent: 0,
    creditValue: 0,
    interactionType: 'CLICK',
    tenantId: 'tenant-1',
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. create
  // --------------------------------------------------------------------------
  describe('create', () => {
    it('should create a touchpoint and emit socket event', async () => {
      (Touchpoint.create as jest.Mock<any>).mockResolvedValue({ id: 1, dealId: 'deal-100' });

      const result = await attributionService.create(
        { dealId: 'deal-100', channel: 'ORGANIC_SEARCH', touchpointDate: new Date() },
        'tenant-1'
      );

      expect(Touchpoint.create).toHaveBeenCalledWith(
        expect.objectContaining({ dealId: 'deal-100', channel: 'ORGANIC_SEARCH', tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  // --------------------------------------------------------------------------
  // 2. getAll
  // --------------------------------------------------------------------------
  describe('getAll', () => {
    it('should return paginated touchpoints', async () => {
      (Touchpoint.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockTouchpoint], count: 1 });

      const result = await attributionService.getAll({ page: 1 }, 'tenant-1');

      expect(Touchpoint.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) })
      );
      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });

    it('should filter by dealId when provided', async () => {
      (Touchpoint.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await attributionService.getAll({ dealId: 'deal-100' }, 'tenant-1');

      expect(Touchpoint.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ dealId: 'deal-100' }) })
      );
    });

    it('should filter by channel when provided', async () => {
      (Touchpoint.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await attributionService.getAll({ channel: 'EMAIL' }, 'tenant-1');

      expect(Touchpoint.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ channel: 'EMAIL' }) })
      );
    });

    it('should return empty docs when no touchpoints exist', async () => {
      (Touchpoint.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await attributionService.getAll({});

      expect(result.docs).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. getById
  // --------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a touchpoint by id', async () => {
      (Touchpoint.findByPk as jest.Mock<any>).mockResolvedValue(mockTouchpoint);

      const result = await attributionService.getById(1);

      expect(Touchpoint.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(mockTouchpoint);
    });

    it('should return null when touchpoint is not found', async () => {
      (Touchpoint.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await attributionService.getById(999);

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 4. update
  // --------------------------------------------------------------------------
  describe('update', () => {
    it('should update an existing touchpoint', async () => {
      (Touchpoint.findByPk as jest.Mock<any>).mockResolvedValue(mockTouchpoint);

      const result = await attributionService.update(1, { channel: 'EMAIL' });

      expect(mockTouchpoint.update).toHaveBeenCalledWith({ channel: 'EMAIL' });
      expect(result).toBe(mockTouchpoint);
    });

    it('should return null when touchpoint is not found', async () => {
      (Touchpoint.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await attributionService.update(999, { channel: 'EMAIL' });

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 5. delete
  // --------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete an existing touchpoint', async () => {
      (Touchpoint.findByPk as jest.Mock<any>).mockResolvedValue(mockTouchpoint);

      const result = await attributionService.delete(1);

      expect(mockTouchpoint.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when touchpoint is not found', async () => {
      (Touchpoint.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await attributionService.delete(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 6. calculateAttribution
  // --------------------------------------------------------------------------
  describe('calculateAttribution', () => {
    const makeTouchpoint = (id: number, date: string) => ({
      id,
      dealId: 'deal-100',
      channel: 'ORGANIC_SEARCH',
      touchpointDate: new Date(date),
      creditPercent: 0,
      creditValue: 0,
      update: jest.fn()
    });

    it('should return empty touchpoints when none exist for the deal', async () => {
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await attributionService.calculateAttribution('deal-100', 'LINEAR');

      expect(result).toEqual({ dealId: 'deal-100', touchpoints: [], model: 'LINEAR' });
    });

    it('should assign 100% credit to first touchpoint with FIRST_TOUCH model', async () => {
      const tp1 = makeTouchpoint(1, '2026-01-01');
      const tp2 = makeTouchpoint(2, '2026-01-10');
      (Touchpoint.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([tp1, tp2])
        .mockResolvedValueOnce([tp1, tp2]);

      await attributionService.calculateAttribution('deal-100', 'FIRST_TOUCH', 1000);

      expect(tp1.update).toHaveBeenCalledWith({ creditPercent: 100, creditValue: 1000 });
      expect(tp2.update).toHaveBeenCalledWith({ creditPercent: 0, creditValue: 0 });
    });

    it('should assign 100% credit to last touchpoint with LAST_TOUCH model', async () => {
      const tp1 = makeTouchpoint(1, '2026-01-01');
      const tp2 = makeTouchpoint(2, '2026-01-10');
      (Touchpoint.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([tp1, tp2])
        .mockResolvedValueOnce([tp1, tp2]);

      await attributionService.calculateAttribution('deal-100', 'LAST_TOUCH', 1000);

      expect(tp1.update).toHaveBeenCalledWith({ creditPercent: 0, creditValue: 0 });
      expect(tp2.update).toHaveBeenCalledWith({ creditPercent: 100, creditValue: 1000 });
    });

    it('should distribute equal credit with LINEAR model', async () => {
      const tp1 = makeTouchpoint(1, '2026-01-01');
      const tp2 = makeTouchpoint(2, '2026-01-10');
      (Touchpoint.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([tp1, tp2])
        .mockResolvedValueOnce([tp1, tp2]);

      await attributionService.calculateAttribution('deal-100', 'LINEAR', 1000);

      // 100 / 2 = 50 each
      expect(tp1.update).toHaveBeenCalledWith({ creditPercent: 50, creditValue: 500 });
      expect(tp2.update).toHaveBeenCalledWith({ creditPercent: 50, creditValue: 500 });
    });

    it('should assign higher credit to later touchpoints with TIME_DECAY model', async () => {
      const tp1 = makeTouchpoint(1, '2026-01-01');
      const tp2 = makeTouchpoint(2, '2026-01-15');
      (Touchpoint.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([tp1, tp2])
        .mockResolvedValueOnce([tp1, tp2]);

      await attributionService.calculateAttribution('deal-100', 'TIME_DECAY', 1000);

      // tp2 (latest) should get more credit than tp1
      const tp2Credit = (tp2.update as jest.Mock<any>).mock.calls[0][0].creditPercent;
      const tp1Credit = (tp1.update as jest.Mock<any>).mock.calls[0][0].creditPercent;
      expect(tp2Credit).toBeGreaterThan(tp1Credit);
    });

    it('should return the re-fetched touchpoints after calculation', async () => {
      const tp1 = makeTouchpoint(1, '2026-01-01');
      const updatedTps = [{ id: 1, creditPercent: 100, creditValue: 500 }];
      (Touchpoint.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([tp1])
        .mockResolvedValueOnce(updatedTps);

      const result = await attributionService.calculateAttribution('deal-100', 'FIRST_TOUCH', 500);

      expect(result.touchpoints).toEqual(updatedTps);
      expect(result.model).toBe('FIRST_TOUCH');
      expect(result.dealValue).toBe(500);
    });
  });

  // --------------------------------------------------------------------------
  // 7. getChannelPerformance
  // --------------------------------------------------------------------------
  describe('getChannelPerformance', () => {
    it('should aggregate touchpoints by channel', async () => {
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([
        { channel: 'EMAIL', creditPercent: 50, creditValue: 250 },
        { channel: 'EMAIL', creditPercent: 30, creditValue: 150 },
        { channel: 'SOCIAL', creditPercent: 20, creditValue: 100 }
      ]);

      const result = await attributionService.getChannelPerformance('tenant-1');

      expect(result.totalTouchpoints).toBe(3);
      expect(result.channels).toHaveLength(2);

      const emailChannel = result.channels.find(c => c.channel === 'EMAIL');
      expect(emailChannel).toBeDefined();
      expect(emailChannel!.touchpoints).toBe(2);
      expect(emailChannel!.totalAttributedValue).toBe(400);
      expect(emailChannel!.avgCredit).toBe(40);
    });

    it('should return empty channels when no touchpoints have credit', async () => {
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await attributionService.getChannelPerformance();

      expect(result.channels).toHaveLength(0);
      expect(result.totalTouchpoints).toBe(0);
    });

    it('should handle touchpoints with missing channel as UNKNOWN', async () => {
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([
        { channel: null, creditPercent: 100, creditValue: 500 }
      ]);

      const result = await attributionService.getChannelPerformance();

      expect(result.channels[0].channel).toBe('UNKNOWN');
    });

    it('should sort channels by totalAttributedValue descending', async () => {
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([
        { channel: 'EMAIL', creditPercent: 30, creditValue: 100 },
        { channel: 'SOCIAL', creditPercent: 70, creditValue: 500 }
      ]);

      const result = await attributionService.getChannelPerformance();

      expect(result.channels[0].channel).toBe('SOCIAL');
      expect(result.channels[1].channel).toBe('EMAIL');
    });
  });

  // --------------------------------------------------------------------------
  // 8. compareModels
  // --------------------------------------------------------------------------
  describe('compareModels', () => {
    it('should return comparisons across all four attribution models', async () => {
      const tp1: any = {
        id: 1, dealId: 'deal-100', channel: 'EMAIL',
        touchpointDate: new Date('2026-01-01'),
        creditPercent: 0, creditValue: 0,
        update: jest.fn()
      };
      // findAll is called twice per model (4 models) = 8 calls
      // First call returns touchpoints for calculation, second call returns updated
      const updatedTp = { id: 1, channel: 'EMAIL', creditPercent: 100, creditValue: 1000 };
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([tp1]);

      const result = await attributionService.compareModels('deal-100', 1000);

      expect(result.dealId).toBe('deal-100');
      expect(result.dealValue).toBe(1000);
      expect(result.comparison).toHaveProperty('FIRST_TOUCH');
      expect(result.comparison).toHaveProperty('LAST_TOUCH');
      expect(result.comparison).toHaveProperty('LINEAR');
      expect(result.comparison).toHaveProperty('TIME_DECAY');
    });

    it('should handle deal with no touchpoints', async () => {
      (Touchpoint.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await attributionService.compareModels('deal-empty', 500);

      expect(result.dealId).toBe('deal-empty');
      // Each model should return empty touchpoints array mapped to empty
      expect(result.comparison.FIRST_TOUCH).toEqual([]);
      expect(result.comparison.LAST_TOUCH).toEqual([]);
    });
  });
});
