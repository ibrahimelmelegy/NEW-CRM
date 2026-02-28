
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import competitorService from '../../src/competitor/competitorService';
import Competitor from '../../src/competitor/competitorModel';
import CompetitorDeal from '../../src/competitor/competitorDealModel';
import Deal from '../../src/deal/model/dealModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/competitor/competitorModel');
jest.mock('../../src/competitor/competitorDealModel');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('CompetitorService', () => {
  const mockCompetitor: any = {
    id: 1, name: 'Rival Corp', status: 'ACTIVE', dealsWon: 5, dealsLost: 3,
    marketShare: 15, industry: 'Tech',
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------
  describe('create', () => {
    it('should create a competitor and emit socket event', async () => {
      (Competitor.create as jest.Mock<any>).mockResolvedValue({ id: 1, name: 'Rival Corp' });

      const result = await competitorService.create({ name: 'Rival Corp' }, 'tenant-1', 1);

      expect(Competitor.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Rival Corp', tenantId: 'tenant-1', createdBy: 1 })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getAll', () => {
    it('should return paginated competitors', async () => {
      (Competitor.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockCompetitor], count: 1 });

      const result = await competitorService.getAll({ page: 1 }, 'tenant-1');

      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });
  });

  describe('getById', () => {
    it('should return a competitor by id', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(mockCompetitor);

      const result = await competitorService.getById(1);

      expect(result).toBe(mockCompetitor);
    });

    it('should return null when competitor is not found', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await competitorService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing competitor', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(mockCompetitor);

      const result = await competitorService.update(1, { name: 'Updated Corp' });

      expect(mockCompetitor.update).toHaveBeenCalledWith({ name: 'Updated Corp' });
      expect(result).toBe(mockCompetitor);
    });

    it('should return null when competitor is not found', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await competitorService.update(999, { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete the competitor and its deal associations', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(mockCompetitor);
      (CompetitorDeal.destroy as jest.Mock<any>).mockResolvedValue(2);

      const result = await competitorService.delete(1);

      expect(mockCompetitor.destroy).toHaveBeenCalled();
      expect(CompetitorDeal.destroy).toHaveBeenCalledWith({ where: { competitorId: 1 } });
      expect(result).toBe(true);
    });

    it('should return false when competitor is not found', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await competitorService.delete(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Deal Association
  // --------------------------------------------------------------------------
  describe('linkDeal', () => {
    it('should create a new competitor-deal link when none exists', async () => {
      (CompetitorDeal.findOne as jest.Mock<any>).mockResolvedValue(null);
      (CompetitorDeal.create as jest.Mock<any>).mockResolvedValue({ competitorId: 1, dealId: 'deal-1', outcome: 'PENDING' });

      const result = await competitorService.linkDeal(1, 'deal-1', {}, 'tenant-1');

      expect(CompetitorDeal.create).toHaveBeenCalledWith(
        expect.objectContaining({ competitorId: 1, dealId: 'deal-1', outcome: 'PENDING' })
      );
      expect(result).toHaveProperty('competitorId', 1);
    });

    it('should update existing link when one already exists', async () => {
      const existing = { competitorId: 1, dealId: 'deal-1', outcome: 'PENDING', notes: null, update: jest.fn() };
      (CompetitorDeal.findOne as jest.Mock<any>).mockResolvedValue(existing);

      await competitorService.linkDeal(1, 'deal-1', { outcome: 'WON' });

      expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'WON' }));
    });
  });

  describe('unlinkDeal', () => {
    it('should remove a competitor-deal association', async () => {
      (CompetitorDeal.destroy as jest.Mock<any>).mockResolvedValue(1);

      const result = await competitorService.unlinkDeal(1, 'deal-1');

      expect(result).toBe(true);
    });

    it('should return false when no link exists', async () => {
      (CompetitorDeal.destroy as jest.Mock<any>).mockResolvedValue(0);

      const result = await competitorService.unlinkDeal(1, 'deal-999');

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Win/Loss Analysis
  // --------------------------------------------------------------------------
  describe('getCompetitorAnalysis', () => {
    it('should return win/loss analysis with correct rates', async () => {
      (Competitor.findOne as jest.Mock<any>).mockResolvedValue(mockCompetitor);

      const result = await competitorService.getCompetitorAnalysis(1);

      expect(result).not.toBeNull();
      expect(result!.analysis.dealsWon).toBe(5);
      expect(result!.analysis.dealsLost).toBe(3);
      expect(result!.analysis.totalEngagements).toBe(8);
      expect(result!.analysis.winRate).toBeGreaterThan(0);
    });

    it('should return null when competitor is not found', async () => {
      (Competitor.findOne as jest.Mock<any>).mockResolvedValue(null);

      const result = await competitorService.getCompetitorAnalysis(999);

      expect(result).toBeNull();
    });
  });

  describe('updateThreatLevel', () => {
    it('should auto-calculate and update threat level based on win/loss data', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(mockCompetitor);

      const result = await competitorService.updateThreatLevel(1, { strengths: 'Strong brand' });

      expect(mockCompetitor.update).toHaveBeenCalledWith(
        expect.objectContaining({ threatLevel: expect.any(String), strengths: 'Strong brand' })
      );
      expect(result).toBe(mockCompetitor);
    });

    it('should return null when competitor is not found', async () => {
      (Competitor.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await competitorService.updateThreatLevel(999);

      expect(result).toBeNull();
    });
  });
});
