import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import socialListeningService from '../../src/socialListening/socialListeningService';
import SocialMention from '../../src/socialListening/socialMentionModel';

jest.mock('../../src/socialListening/socialMentionModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('SocialListeningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a social mention and emit socialMention:created', async () => {
      const mockMention = { id: 1, platform: 'TWITTER', content: 'Great product!' };
      (SocialMention.create as jest.Mock<any>).mockResolvedValue(mockMention);

      const result = await socialListeningService.create(
        { platform: 'TWITTER', content: 'Great product!', sentiment: 'POSITIVE', sentimentScore: 0.8, mentionDate: new Date() },
        'tenant-1'
      );

      expect(SocialMention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'TWITTER',
          content: 'Great product!',
          sentiment: 'POSITIVE',
          tenantId: 'tenant-1'
        })
      );
      expect(result).toEqual(mockMention);
    });

    it('should auto-analyse positive sentiment when not provided', async () => {
      const mockMention = { id: 2, platform: 'FACEBOOK' };
      (SocialMention.create as jest.Mock<any>).mockResolvedValue(mockMention);

      await socialListeningService.create(
        { platform: 'FACEBOOK', content: 'This product is great and amazing!', mentionDate: new Date() }
      );

      expect(SocialMention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sentiment: 'POSITIVE',
          sentimentScore: expect.any(Number)
        })
      );
    });

    it('should auto-analyse negative sentiment', async () => {
      const mockMention = { id: 3, platform: 'TWITTER' };
      (SocialMention.create as jest.Mock<any>).mockResolvedValue(mockMention);

      await socialListeningService.create(
        { platform: 'TWITTER', content: 'Terrible product, worst experience ever', mentionDate: new Date() }
      );

      expect(SocialMention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sentiment: 'NEGATIVE',
          sentimentScore: expect.any(Number)
        })
      );
    });

    it('should auto-analyse neutral sentiment for ambiguous content', async () => {
      const mockMention = { id: 4, platform: 'LINKEDIN' };
      (SocialMention.create as jest.Mock<any>).mockResolvedValue(mockMention);

      await socialListeningService.create(
        { platform: 'LINKEDIN', content: 'I used the product today', mentionDate: new Date() }
      );

      expect(SocialMention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sentiment: 'NEUTRAL',
          sentimentScore: 0
        })
      );
    });

    it('should not overwrite sentiment when already provided', async () => {
      const mockMention = { id: 5, platform: 'REDDIT' };
      (SocialMention.create as jest.Mock<any>).mockResolvedValue(mockMention);

      await socialListeningService.create(
        { platform: 'REDDIT', content: 'Great product!', sentiment: 'NEGATIVE', sentimentScore: -0.5, mentionDate: new Date() }
      );

      // Sentiment should remain as explicitly provided (NEGATIVE), not auto-detected (POSITIVE)
      expect(SocialMention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sentiment: 'NEGATIVE',
          sentimentScore: -0.5
        })
      );
    });

    it('should not throw when io.emit fails', async () => {
      const { io } = require('../../src/server');
      io.emit.mockImplementation(() => { throw new Error('socket error'); });
      (SocialMention.create as jest.Mock<any>).mockResolvedValue({ id: 10, platform: 'TWITTER' });

      const result = await socialListeningService.create(
        { platform: 'TWITTER', content: 'test', sentiment: 'NEUTRAL', mentionDate: new Date() }
      );
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('should return paginated mentions', async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      (SocialMention.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 2 });

      const result = await socialListeningService.getAll({ page: 1, limit: 20 }, 'tenant-1');

      expect(SocialMention.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['mentionDate', 'DESC']],
          limit: 20,
          offset: 0,
          distinct: true
        })
      );
      expect(result.docs).toEqual(mockRows);
      expect(result.pagination.totalItems).toBe(2);
    });

    it('should filter by platform, sentiment, and status', async () => {
      (SocialMention.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await socialListeningService.getAll({
        platform: 'TWITTER',
        sentiment: 'POSITIVE',
        status: 'NEW'
      }, 'tenant-1');

      expect(SocialMention.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            platform: 'TWITTER',
            sentiment: 'POSITIVE',
            status: 'NEW'
          })
        })
      );
    });

    it('should filter by keyword and search', async () => {
      (SocialMention.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await socialListeningService.getAll({ keyword: 'brand', search: 'review' });

      expect(SocialMention.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            keyword: expect.anything(), // Op.iLike
            content: expect.anything()  // Op.iLike
          })
        })
      );
    });

    it('should filter by date range', async () => {
      (SocialMention.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await socialListeningService.getAll({
        fromDate: '2026-01-01',
        toDate: '2026-01-31'
      });

      expect(SocialMention.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mentionDate: expect.anything()
          })
        })
      );
    });

    it('should return empty docs when no mentions found', async () => {
      (SocialMention.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await socialListeningService.getAll({});

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a mention by id', async () => {
      const mockMention = { id: 1, platform: 'TWITTER' };
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(mockMention);

      const result = await socialListeningService.getById(1);

      expect(SocialMention.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMention);
    });

    it('should return null if mention not found', async () => {
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await socialListeningService.getById(999);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update and return the mention', async () => {
      const mockItem: any = { id: 1, update: jest.fn().mockImplementation(() => Promise.resolve(true)) };
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await socialListeningService.update(1, { status: 'REVIEWED' });

      expect(mockItem.update).toHaveBeenCalledWith({ status: 'REVIEWED' });
      expect(result).toEqual(mockItem);
    });

    it('should return null if mention not found', async () => {
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await socialListeningService.update(999, { status: 'REVIEWED' });

      expect(result).toBeNull();
    });

    it('should emit socialMention:updated on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 7, update: jest.fn() };
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await socialListeningService.update(7, { status: 'RESPONDED' });

      expect(io.emit).toHaveBeenCalledWith('socialMention:updated', { id: 7 });
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete the mention and return true', async () => {
      const mockItem = { id: 1, destroy: jest.fn() };
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await socialListeningService.delete(1);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if mention not found', async () => {
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await socialListeningService.delete(999);

      expect(result).toBe(false);
    });

    it('should emit socialMention:deleted on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 3, destroy: jest.fn() };
      (SocialMention.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await socialListeningService.delete(3);

      expect(io.emit).toHaveBeenCalledWith('socialMention:deleted', { id: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // getSentimentAggregation
  // ---------------------------------------------------------------------------
  describe('getSentimentAggregation', () => {
    it('should aggregate sentiment breakdown across platforms', async () => {
      const mockMentions = [
        { platform: 'TWITTER', sentiment: 'POSITIVE', sentimentScore: 0.8 },
        { platform: 'TWITTER', sentiment: 'NEGATIVE', sentimentScore: -0.5 },
        { platform: 'FACEBOOK', sentiment: 'NEUTRAL', sentimentScore: 0 },
        { platform: 'FACEBOOK', sentiment: 'POSITIVE', sentimentScore: 0.6 }
      ];
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue(mockMentions);

      const result = await socialListeningService.getSentimentAggregation('tenant-1', 30);

      expect(SocialMention.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ raw: true })
      );
      expect(result.period).toBe('30 days');
      expect(result.totalMentions).toBe(4);
      expect(result.overall.positive).toBe(2);
      expect(result.overall.negative).toBe(1);
      expect(result.overall.neutral).toBe(1);
      expect(result.byPlatform.TWITTER.total).toBe(2);
      expect(result.byPlatform.TWITTER.positive).toBe(1);
      expect(result.byPlatform.TWITTER.negative).toBe(1);
      expect(result.byPlatform.FACEBOOK.total).toBe(2);
    });

    it('should return zero averages when no mentions exist', async () => {
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await socialListeningService.getSentimentAggregation();

      expect(result.totalMentions).toBe(0);
      expect(result.overall.avgScore).toBe(0);
      expect(result.overall.positive).toBe(0);
      expect(result.overall.negative).toBe(0);
      expect(result.overall.neutral).toBe(0);
      expect(result.byPlatform).toEqual({});
    });

    it('should use default 30-day window when days not specified', async () => {
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await socialListeningService.getSentimentAggregation('tenant-1');

      expect(result.period).toBe('30 days');
    });

    it('should handle mentions with platform OTHER when platform is missing', async () => {
      const mockMentions = [
        { platform: undefined, sentiment: 'POSITIVE', sentimentScore: 0.5 }
      ];
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue(mockMentions);

      const result = await socialListeningService.getSentimentAggregation();

      expect(result.byPlatform.OTHER).toBeDefined();
      expect(result.byPlatform.OTHER.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getTrendingKeywords
  // ---------------------------------------------------------------------------
  describe('getTrendingKeywords', () => {
    it('should return trending keywords from recent mentions', async () => {
      const mockResults = [
        { keyword: 'product launch', count: 25 },
        { keyword: 'bug report', count: 10 }
      ];
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue(mockResults);

      const result = await socialListeningService.getTrendingKeywords('tenant-1', 10);

      expect(SocialMention.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.any(Array),
          group: ['keyword'],
          limit: 10,
          raw: true
        })
      );
      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no keywords found', async () => {
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await socialListeningService.getTrendingKeywords();

      expect(result).toEqual([]);
    });

    it('should default limit to 10', async () => {
      (SocialMention.findAll as jest.Mock<any>).mockResolvedValue([]);

      await socialListeningService.getTrendingKeywords('tenant-1');

      expect(SocialMention.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });
  });
});
