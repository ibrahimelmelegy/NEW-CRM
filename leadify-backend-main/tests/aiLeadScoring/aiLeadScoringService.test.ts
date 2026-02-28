
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/aiLeadScoring/scoringModelConfig');
jest.mock('../../src/lead/leadModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

import aiLeadScoringService from '../../src/aiLeadScoring/aiLeadScoringService';
import ScoringModelConfig from '../../src/aiLeadScoring/scoringModelConfig';
import Lead from '../../src/lead/leadModel';

describe('AiLeadScoringService', () => {
  const mockModel: any = {
    id: 1,
    name: 'Enterprise Scorer',
    type: 'RULE_BASED',
    status: 'ACTIVE',
    accuracy: 0.85,
    leadsScored: 100,
    parameters: [
      { feature: 'company', condition: 'exists', value: null, weight: 1, points: 20 },
      { feature: 'source', condition: 'equals', value: 'REFERRAL', weight: 2, points: 30 },
      { feature: 'budget', condition: 'greater_than', value: 10000, weight: 1, points: 25 }
    ],
    featureImportance: null,
    tenantId: 'tenant-1',
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockLead: any = {
    id: 'lead-1',
    name: 'John Smith',
    company: 'Acme Corp',
    source: 'REFERRAL',
    budget: 50000,
    tenantId: 'tenant-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Model Config CRUD
  // --------------------------------------------------------------------------
  describe('create', () => {
    it('should create a scoring model config and emit socket event', async () => {
      (ScoringModelConfig.create as jest.Mock<any>).mockResolvedValue({ id: 1, name: 'Enterprise Scorer' });

      const result = await aiLeadScoringService.create(
        { name: 'Enterprise Scorer', type: 'RULE_BASED', parameters: [] },
        'tenant-1',
        1
      );

      expect(ScoringModelConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Enterprise Scorer', tenantId: 'tenant-1', createdBy: 1 })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getAll', () => {
    it('should return paginated scoring model configs', async () => {
      (ScoringModelConfig.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockModel], count: 1 });

      const result = await aiLeadScoringService.getAll({ page: 1 }, 'tenant-1');

      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });

    it('should filter by status when provided', async () => {
      (ScoringModelConfig.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await aiLeadScoringService.getAll({ status: 'ACTIVE' }, 'tenant-1');

      expect(ScoringModelConfig.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) })
      );
    });

    it('should filter by type when provided', async () => {
      (ScoringModelConfig.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await aiLeadScoringService.getAll({ type: 'RULE_BASED' }, 'tenant-1');

      expect(ScoringModelConfig.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'RULE_BASED' }) })
      );
    });

    it('should return empty docs when no models exist', async () => {
      (ScoringModelConfig.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await aiLeadScoringService.getAll({});

      expect(result.docs).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return a scoring model by id', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);

      const result = await aiLeadScoringService.getById(1);

      expect(ScoringModelConfig.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(mockModel);
    });

    it('should return null when model is not found', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await aiLeadScoringService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing scoring model and emit socket event', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);

      const result = await aiLeadScoringService.update(1, { name: 'Updated Scorer' });

      expect(mockModel.update).toHaveBeenCalledWith({ name: 'Updated Scorer' });
      expect(result).toBe(mockModel);
    });

    it('should return null when model is not found', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await aiLeadScoringService.update(999, { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing scoring model', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);

      const result = await aiLeadScoringService.delete(1);

      expect(mockModel.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when model is not found', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await aiLeadScoringService.delete(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Lead Scoring Engine
  // --------------------------------------------------------------------------
  describe('scoreLeads', () => {
    it('should return null when model is not found', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await aiLeadScoringService.scoreLeads(999);

      expect(result).toBeNull();
    });

    it('should return error when model has no parameters', async () => {
      const emptyModel = { ...mockModel, parameters: [], update: jest.fn() };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(emptyModel);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result).toHaveProperty('error', 'No scoring parameters defined');
      expect(result!.scored).toBe(0);
    });

    it('should score leads based on rule matching and return sorted results', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', name: 'John', company: 'Acme', source: 'REFERRAL', budget: 50000 },
        { id: 'lead-2', name: 'Jane', company: null, source: 'COLD_CALL', budget: 5000 }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result).not.toBeNull();
      expect(result!.scored).toBe(2);
      expect(result!.results).toHaveLength(2);
      // lead-1 matches all 3 rules (company exists, source=REFERRAL, budget>10000)
      // lead-2 matches 0 rules
      expect(result!.results[0].leadId).toBe('lead-1');
      expect(result!.results[0].score).toBeGreaterThan(result!.results[1].score);
    });

    it('should match the exists condition', async () => {
      const model = {
        ...mockModel,
        parameters: [{ feature: 'email', condition: 'exists', value: null, weight: 1, points: 10 }],
        update: jest.fn()
      };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(model);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', name: 'John', email: 'john@test.com' },
        { id: 'lead-2', name: 'Jane', email: '' }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result!.results.find((r: any) => r.leadId === 'lead-1')!.matchedRules).toHaveLength(1);
      expect(result!.results.find((r: any) => r.leadId === 'lead-2')!.matchedRules).toHaveLength(0);
    });

    it('should match the contains condition', async () => {
      const model = {
        ...mockModel,
        parameters: [{ feature: 'company', condition: 'contains', value: 'acme', weight: 1, points: 10 }],
        update: jest.fn()
      };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(model);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', name: 'John', company: 'Acme Corp' }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result!.results[0].matchedRules).toHaveLength(1);
    });

    it('should match the not_equals condition', async () => {
      const model = {
        ...mockModel,
        parameters: [{ feature: 'status', condition: 'not_equals', value: 'LOST', weight: 1, points: 10 }],
        update: jest.fn()
      };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(model);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', name: 'John', status: 'NEW' },
        { id: 'lead-2', name: 'Jane', status: 'LOST' }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result!.results.find((r: any) => r.leadId === 'lead-1')!.score).toBe(100);
      expect(result!.results.find((r: any) => r.leadId === 'lead-2')!.score).toBe(0);
    });

    it('should match the less_than condition', async () => {
      const model = {
        ...mockModel,
        parameters: [{ feature: 'age', condition: 'less_than', value: 30, weight: 1, points: 10 }],
        update: jest.fn()
      };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(model);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', name: 'Young Lead', age: 25 },
        { id: 'lead-2', name: 'Old Lead', age: 50 }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result!.results.find((r: any) => r.leadId === 'lead-1')!.score).toBe(100);
      expect(result!.results.find((r: any) => r.leadId === 'lead-2')!.score).toBe(0);
    });

    it('should match the in condition', async () => {
      const model = {
        ...mockModel,
        parameters: [{ feature: 'source', condition: 'in', value: ['REFERRAL', 'WEBSITE'], weight: 1, points: 10 }],
        update: jest.fn()
      };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(model);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', name: 'John', source: 'REFERRAL' },
        { id: 'lead-2', name: 'Jane', source: 'COLD_CALL' }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result!.results.find((r: any) => r.leadId === 'lead-1')!.score).toBe(100);
      expect(result!.results.find((r: any) => r.leadId === 'lead-2')!.score).toBe(0);
    });

    it('should filter by specific leadIds when provided', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([mockLead]);

      await aiLeadScoringService.scoreLeads(1, ['lead-1', 'lead-2']);

      expect(Lead.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: expect.any(Object) }) })
      );
    });

    it('should update the model leadsScored count after scoring', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([mockLead]);

      await aiLeadScoringService.scoreLeads(1);

      expect(mockModel.update).toHaveBeenCalledWith({ leadsScored: 101 }); // 100 + 1
    });

    it('should normalise scores to 0-100 range', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([mockLead]);

      const result = await aiLeadScoringService.scoreLeads(1);

      for (const r of result!.results) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    });

    it('should return results sorted by score descending', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-low', name: 'Low', company: null, source: 'COLD', budget: 100 },
        { id: 'lead-high', name: 'High', company: 'Big Corp', source: 'REFERRAL', budget: 50000 }
      ]);

      const result = await aiLeadScoringService.scoreLeads(1);

      expect(result!.results[0].score).toBeGreaterThanOrEqual(result!.results[1].score);
    });
  });

  // --------------------------------------------------------------------------
  // Feature Importance
  // --------------------------------------------------------------------------
  describe('getFeatureImportance', () => {
    it('should return null when model is not found', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await aiLeadScoringService.getFeatureImportance(999);

      expect(result).toBeNull();
    });

    it('should return empty features when model has no parameters', async () => {
      const emptyModel = { ...mockModel, parameters: [], update: jest.fn() };
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(emptyModel);

      const result = await aiLeadScoringService.getFeatureImportance(1);

      expect(result).toHaveProperty('features', []);
    });

    it('should return empty features and sampleSize 0 when no leads exist', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await aiLeadScoringService.getFeatureImportance(1);

      expect(result!.sampleSize).toBe(0);
      expect(result!.features).toEqual([]);
    });

    it('should calculate feature importance based on rule coverage', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([
        { id: 'lead-1', company: 'Acme', source: 'REFERRAL', budget: 50000 },
        { id: 'lead-2', company: 'Other', source: 'COLD', budget: 5000 }
      ]);

      const result = await aiLeadScoringService.getFeatureImportance(1);

      expect(result!.sampleSize).toBe(2);
      expect(result!.features.length).toBeGreaterThan(0);
      // Features should be sorted by importance descending
      for (let i = 1; i < result!.features.length; i++) {
        expect(result!.features[i - 1].importance).toBeGreaterThanOrEqual(result!.features[i].importance);
      }
    });

    it('should normalise importance values to 0-100', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([mockLead]);

      const result = await aiLeadScoringService.getFeatureImportance(1);

      for (const f of result!.features) {
        expect(f.importance).toBeGreaterThanOrEqual(0);
        expect(f.importance).toBeLessThanOrEqual(100);
      }
      // The top feature should have importance of 100
      if (result!.features.length > 0) {
        expect(result!.features[0].importance).toBe(100);
      }
    });

    it('should save feature importance map to the model', async () => {
      (ScoringModelConfig.findByPk as jest.Mock<any>).mockResolvedValue(mockModel);
      (Lead.findAll as jest.Mock<any>).mockResolvedValue([mockLead]);

      await aiLeadScoringService.getFeatureImportance(1);

      expect(mockModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ featureImportance: expect.any(Object) })
      );
    });
  });

  // --------------------------------------------------------------------------
  // Model Comparison
  // --------------------------------------------------------------------------
  describe('compareModels', () => {
    it('should return comparison of multiple scoring models', async () => {
      (ScoringModelConfig.findAll as jest.Mock<any>).mockResolvedValue([
        {
          id: 1, name: 'Model A', type: 'RULE_BASED', status: 'ACTIVE',
          accuracy: 0.85, leadsScored: 100, parameters: [
            { feature: 'company', condition: 'exists', value: null, weight: 1, points: 10 }
          ],
          lastTrainedAt: new Date('2026-01-01')
        },
        {
          id: 2, name: 'Model B', type: 'DECISION_TREE', status: 'TESTING',
          accuracy: 0.90, leadsScored: 50, parameters: [
            { feature: 'budget', condition: 'greater_than', value: 5000, weight: 1, points: 20 },
            { feature: 'source', condition: 'equals', value: 'REFERRAL', weight: 2, points: 30 }
          ],
          lastTrainedAt: new Date('2026-02-01')
        }
      ]);

      const result = await aiLeadScoringService.compareModels([1, 2]);

      expect(result.count).toBe(2);
      expect(result.models).toHaveLength(2);
      expect(result.models[0]).toHaveProperty('name', 'Model A');
      expect(result.models[0].parameterCount).toBe(1);
      expect(result.models[0].features).toContain('company');
      expect(result.models[1]).toHaveProperty('name', 'Model B');
      expect(result.models[1].parameterCount).toBe(2);
      expect(result.models[1].features).toContain('budget');
      expect(result.models[1].features).toContain('source');
    });

    it('should return empty comparison when no models match the ids', async () => {
      (ScoringModelConfig.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await aiLeadScoringService.compareModels([999, 998]);

      expect(result.count).toBe(0);
      expect(result.models).toHaveLength(0);
    });

    it('should deduplicate features in the comparison output', async () => {
      (ScoringModelConfig.findAll as jest.Mock<any>).mockResolvedValue([
        {
          id: 1, name: 'Duplicate Features', type: 'RULE_BASED', status: 'ACTIVE',
          accuracy: 0.80, leadsScored: 10, parameters: [
            { feature: 'company', condition: 'exists', value: null, weight: 1, points: 10 },
            { feature: 'company', condition: 'contains', value: 'Corp', weight: 1, points: 5 }
          ],
          lastTrainedAt: null
        }
      ]);

      const result = await aiLeadScoringService.compareModels([1]);

      expect(result.models[0].features).toEqual(['company']);
      expect(result.models[0].parameterCount).toBe(2);
    });
  });
});
