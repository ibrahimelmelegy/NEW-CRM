
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import territoryService from '../../src/territory/territoryService';
import Territory from '../../src/territory/territoryModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/territory/territoryModel');
jest.mock('../../src/user/userModel');

describe('TerritoryService', () => {
  const mockTerritory: any = {
    id: 'terr-1',
    name: 'North Region',
    type: 'REGION',
    parentId: null,
    isActive: true,
    set: jest.fn(),
    save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    destroy: jest.fn(),
    toJSON: jest.fn(() => ({
      id: 'terr-1', name: 'North Region', type: 'REGION', parentId: null, isActive: true
    }))
  };

  const mockChildTerritory: any = {
    id: 'terr-2',
    name: 'North-East',
    type: 'SUB_REGION',
    parentId: 'terr-1',
    isActive: true,
    toJSON: jest.fn(() => ({
      id: 'terr-2', name: 'North-East', type: 'SUB_REGION', parentId: 'terr-1', isActive: true
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------
  describe('getTerritories', () => {
    it('should return territories filtered by query params', async () => {
      (Territory.findAll as jest.Mock<any>).mockResolvedValue([mockTerritory]);

      const result = await territoryService.getTerritories({ isActive: true });

      expect(Territory.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
          order: [['name', 'ASC']]
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by parentId when provided', async () => {
      (Territory.findAll as jest.Mock<any>).mockResolvedValue([mockChildTerritory]);

      const result = await territoryService.getTerritories({ parentId: 'terr-1' });

      expect(Territory.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: 'terr-1' })
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getTerritoryById', () => {
    it('should return a territory with children and parent', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(mockTerritory);

      const result = await territoryService.getTerritoryById('terr-1');

      expect(Territory.findByPk).toHaveBeenCalledWith('terr-1', expect.anything());
      expect(result).toBe(mockTerritory);
    });

    it('should throw TERRITORY_NOT_FOUND when territory does not exist', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(territoryService.getTerritoryById('terr-999'))
        .rejects.toThrow(new BaseError(ERRORS.TERRITORY_NOT_FOUND));
    });
  });

  describe('createTerritory', () => {
    it('should create a root territory (no parent)', async () => {
      (Territory.create as jest.Mock<any>).mockResolvedValue(mockTerritory);

      const result = await territoryService.createTerritory({ name: 'North Region', type: 'REGION' });

      expect(Territory.create).toHaveBeenCalledWith({ name: 'North Region', type: 'REGION' });
      expect(result).toBe(mockTerritory);
    });

    it('should create a child territory when parentId is valid', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(mockTerritory);
      (Territory.create as jest.Mock<any>).mockResolvedValue(mockChildTerritory);

      const result = await territoryService.createTerritory({
        name: 'North-East', type: 'SUB_REGION', parentId: 'terr-1'
      });

      expect(Territory.findByPk).toHaveBeenCalledWith('terr-1');
      expect(result).toBe(mockChildTerritory);
    });

    it('should throw TERRITORY_NOT_FOUND when parentId is invalid', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(territoryService.createTerritory({ name: 'X', type: 'REGION', parentId: 'bad-id' }))
        .rejects.toThrow(new BaseError(ERRORS.TERRITORY_NOT_FOUND));
    });
  });

  describe('updateTerritory', () => {
    it('should update an existing territory', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(mockTerritory);

      const result = await territoryService.updateTerritory('terr-1', { name: 'Updated Region' });

      expect(mockTerritory.set).toHaveBeenCalledWith({ name: 'Updated Region' });
      expect(mockTerritory.save).toHaveBeenCalled();
    });

    it('should throw TERRITORY_NOT_FOUND when territory does not exist', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(territoryService.updateTerritory('terr-999', { name: 'X' }))
        .rejects.toThrow(new BaseError(ERRORS.TERRITORY_NOT_FOUND));
    });

    it('should throw SOMETHING_WENT_WRONG when parentId equals own id', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(mockTerritory);

      await expect(territoryService.updateTerritory('terr-1', { parentId: 'terr-1' }))
        .rejects.toThrow(new BaseError(ERRORS.SOMETHING_WENT_WRONG));
    });
  });

  describe('deleteTerritory', () => {
    it('should delete an existing territory', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(mockTerritory);

      await territoryService.deleteTerritory('terr-1');

      expect(mockTerritory.destroy).toHaveBeenCalled();
    });

    it('should throw TERRITORY_NOT_FOUND when territory does not exist', async () => {
      (Territory.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(territoryService.deleteTerritory('terr-999'))
        .rejects.toThrow(new BaseError(ERRORS.TERRITORY_NOT_FOUND));
    });
  });

  // --------------------------------------------------------------------------
  // Tree
  // --------------------------------------------------------------------------
  describe('getTerritoryTree', () => {
    it('should build a tree from flat territory list', async () => {
      (Territory.findAll as jest.Mock<any>).mockResolvedValue([mockTerritory, mockChildTerritory]);

      const result = await territoryService.getTerritoryTree();

      // Root should have 1 entry
      expect(result).toHaveLength(1);
      // Root should have the child nested
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('North-East');
    });

    it('should return empty array when no territories exist', async () => {
      (Territory.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await territoryService.getTerritoryTree();

      expect(result).toHaveLength(0);
    });
  });
});
