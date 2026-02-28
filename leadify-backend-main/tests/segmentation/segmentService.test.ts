import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import segmentService from '../../src/segmentation/segmentService';
import Segment from '../../src/segmentation/segmentModel';
import Client from '../../src/client/clientModel';

jest.mock('../../src/segmentation/segmentModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('SegmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a segment and emit segment:created', async () => {
      const mockSegment = { id: 1, name: 'Enterprise Clients' };
      (Segment.create as jest.Mock<any>).mockResolvedValue(mockSegment);

      const result = await segmentService.create(
        { name: 'Enterprise Clients', criteria: [], type: 'DYNAMIC' },
        'tenant-1',
        5
      );

      expect(Segment.create).toHaveBeenCalledWith({
        name: 'Enterprise Clients',
        criteria: [],
        type: 'DYNAMIC',
        tenantId: 'tenant-1',
        createdBy: 5
      });
      expect(result).toEqual(mockSegment);
    });

    it('should not throw when io.emit fails', async () => {
      const { io } = require('../../src/server');
      io.emit.mockImplementation(() => { throw new Error('socket error'); });
      (Segment.create as jest.Mock<any>).mockResolvedValue({ id: 2, name: 'Test' });

      const result = await segmentService.create({ name: 'Test' });
      expect(result).toEqual({ id: 2, name: 'Test' });
    });
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('should return paginated segments', async () => {
      const mockRows = [
        { id: 1, name: 'Seg A' },
        { id: 2, name: 'Seg B' }
      ];
      (Segment.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 2 });

      const result = await segmentService.getAll({ page: 1, limit: 20 }, 'tenant-1');

      expect(Segment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['createdAt', 'DESC']],
          limit: 20,
          offset: 0,
          distinct: true
        })
      );
      expect(result.docs).toEqual(mockRows);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalItems: 2,
        totalPages: 1
      });
    });

    it('should filter by status and type', async () => {
      (Segment.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await segmentService.getAll({ status: 'ACTIVE', type: 'DYNAMIC' }, 'tenant-1');

      expect(Segment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            status: 'ACTIVE',
            type: 'DYNAMIC'
          })
        })
      );
    });

    it('should filter by search (name iLike)', async () => {
      (Segment.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await segmentService.getAll({ search: 'enterprise' });

      expect(Segment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything() // Op.iLike is a Symbol, so we just confirm it's set
          })
        })
      );
    });

    it('should return empty docs when no segments found', async () => {
      (Segment.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await segmentService.getAll({});

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a segment by id', async () => {
      const mockSegment = { id: 1, name: 'VIP Clients' };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockSegment);

      const result = await segmentService.getById(1);

      expect(Segment.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSegment);
    });

    it('should return null if segment not found', async () => {
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await segmentService.getById(999);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update and return the segment', async () => {
      const mockItem = {
        id: 1,
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(true)
      };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await segmentService.update(1, { name: 'New Name' });

      expect(Segment.findByPk).toHaveBeenCalledWith(1);
      expect(mockItem.update).toHaveBeenCalledWith({ name: 'New Name' });
      expect(result).toEqual(mockItem);
    });

    it('should return null if segment not found', async () => {
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await segmentService.update(999, { name: 'X' });

      expect(result).toBeNull();
    });

    it('should emit segment:updated on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 1, name: 'Seg', update: jest.fn() };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await segmentService.update(1, { name: 'Updated' });

      expect(io.emit).toHaveBeenCalledWith('segment:updated', { id: 1, name: 'Seg' });
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete the segment and return true', async () => {
      const mockItem = { id: 1, destroy: jest.fn() };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await segmentService.delete(1);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if segment not found', async () => {
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await segmentService.delete(999);

      expect(result).toBe(false);
    });

    it('should emit segment:deleted on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 5, destroy: jest.fn() };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await segmentService.delete(5);

      expect(io.emit).toHaveBeenCalledWith('segment:deleted', { id: 5 });
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateSegment
  // ---------------------------------------------------------------------------
  describe('evaluateSegment', () => {
    it('should return null if segment not found', async () => {
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await segmentService.evaluateSegment(999);

      expect(result).toBeNull();
    });

    it('should match clients based on criteria and update customerCount', async () => {
      const mockSegment = {
        id: 1,
        criteria: [
          { field: 'industry', operator: 'equals', value: 'Tech' }
        ],
        update: jest.fn()
      };
      const matchedClients = [
        { id: 'c1', name: 'Client A', email: 'a@test.com' },
        { id: 'c2', name: 'Client B', email: 'b@test.com' }
      ];

      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockSegment);
      (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ count: 2, rows: matchedClients });

      const result = await segmentService.evaluateSegment(1, 'tenant-1');

      expect(Client.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            industry: 'Tech'
          })
        })
      );
      expect(mockSegment.update).toHaveBeenCalledWith({
        customerCount: 2,
        lastEvaluatedAt: expect.any(Date)
      });
      expect(result).toEqual({
        segment: mockSegment,
        matchedCustomers: matchedClients,
        customerCount: 2
      });
    });

    it('should handle contains operator', async () => {
      const mockSegment = {
        id: 2,
        criteria: [{ field: 'name', operator: 'contains', value: 'Corp' }],
        update: jest.fn()
      };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockSegment);
      (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ count: 0, rows: [] });

      await segmentService.evaluateSegment(2);

      expect(Client.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything() // Op.iLike
          })
        })
      );
    });

    it('should handle greater_than, less_than, not_equals, and in operators', async () => {
      const mockSegment = {
        id: 3,
        criteria: [
          { field: 'revenue', operator: 'greater_than', value: 10000 },
          { field: 'status', operator: 'not_equals', value: 'INACTIVE' },
          { field: 'size', operator: 'less_than', value: 50 },
          { field: 'region', operator: 'in', value: ['US', 'EU'] }
        ],
        update: jest.fn()
      };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockSegment);
      (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ count: 1, rows: [{ id: 'c1' }] });

      const result = await segmentService.evaluateSegment(3);

      expect(Client.findAndCountAll).toHaveBeenCalled();
      expect(result!.customerCount).toBe(1);
    });

    it('should handle empty criteria array', async () => {
      const mockSegment = { id: 4, criteria: [], update: jest.fn() };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockSegment);
      (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ count: 5, rows: Array(5).fill({ id: 'c' }) });

      const result = await segmentService.evaluateSegment(4);

      expect(result!.customerCount).toBe(5);
    });

    it('should emit segment:evaluated event', async () => {
      const { io } = require('../../src/server');
      const mockSegment = { id: 1, criteria: [], update: jest.fn() };
      (Segment.findByPk as jest.Mock<any>).mockResolvedValue(mockSegment);
      (Client.findAndCountAll as jest.Mock<any>).mockResolvedValue({ count: 3, rows: [] });

      await segmentService.evaluateSegment(1);

      expect(io.emit).toHaveBeenCalledWith('segment:evaluated', { id: 1, customerCount: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // getDistribution
  // ---------------------------------------------------------------------------
  describe('getDistribution', () => {
    it('should return distribution of active segments', async () => {
      const mockSegments = [
        { id: 1, name: 'VIP', customerCount: 100, type: 'DYNAMIC', lastEvaluatedAt: new Date() },
        { id: 2, name: 'Standard', customerCount: 50, type: 'STATIC', lastEvaluatedAt: new Date() }
      ];
      (Segment.findAll as jest.Mock<any>).mockResolvedValue(mockSegments);

      const result = await segmentService.getDistribution('tenant-1');

      expect(Segment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE', tenantId: 'tenant-1' }),
          order: [['customerCount', 'DESC']],
          raw: true
        })
      );
      expect(result.totalCustomers).toBe(150);
      expect(result.segmentCount).toBe(2);
      expect(result.segments).toEqual(mockSegments);
    });

    it('should return zero totals when no active segments exist', async () => {
      (Segment.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await segmentService.getDistribution();

      expect(result.totalCustomers).toBe(0);
      expect(result.segmentCount).toBe(0);
      expect(result.segments).toEqual([]);
    });

    it('should handle segments with null/zero customerCount', async () => {
      const mockSegments = [
        { id: 1, name: 'Empty', customerCount: 0, type: 'STATIC' },
        { id: 2, name: 'Null', customerCount: null, type: 'DYNAMIC' }
      ];
      (Segment.findAll as jest.Mock<any>).mockResolvedValue(mockSegments);

      const result = await segmentService.getDistribution();

      expect(result.totalCustomers).toBe(0);
    });
  });
});
