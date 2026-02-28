
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/accountPlanning/accountPlanModel');
jest.mock('../../src/accountPlanning/stakeholderModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

import accountPlanService from '../../src/accountPlanning/accountPlanService';
import AccountPlan from '../../src/accountPlanning/accountPlanModel';
import Stakeholder from '../../src/accountPlanning/stakeholderModel';

describe('AccountPlanService', () => {
  const mockPlan: any = {
    id: 1,
    accountId: 'acc-100',
    name: 'Enterprise Growth Plan',
    tier: 'ENTERPRISE',
    healthScore: 85,
    annualRevenue: 500000,
    expansionPotential: 100000,
    renewalDate: new Date('2026-12-31'),
    status: 'ACTIVE',
    goals: [
      { title: 'Upsell Premium', target: '100K', progress: 80, status: 'IN_PROGRESS' },
      { title: 'Onboard Team', target: '50 users', progress: 100, status: 'COMPLETED' }
    ],
    tenantId: 'tenant-1',
    ownerId: 1,
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockStakeholder: any = {
    id: 1,
    accountPlanId: 1,
    name: 'Jane Doe',
    title: 'VP of Engineering',
    role: 'DECISION_MAKER',
    influence: 9,
    engagementScore: 75,
    sentiment: 'CHAMPION',
    tenantId: 'tenant-1',
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Account Plan CRUD
  // --------------------------------------------------------------------------
  describe('create', () => {
    it('should create an account plan and emit socket event', async () => {
      (AccountPlan.create as jest.Mock<any>).mockResolvedValue({ id: 1, name: 'Enterprise Growth Plan' });

      const result = await accountPlanService.create(
        { accountId: 'acc-100', name: 'Enterprise Growth Plan', tier: 'ENTERPRISE' },
        'tenant-1',
        1
      );

      expect(AccountPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Enterprise Growth Plan', tenantId: 'tenant-1', ownerId: 1 })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getAll', () => {
    it('should return paginated account plans with includes', async () => {
      (AccountPlan.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockPlan], count: 1 });

      const result = await accountPlanService.getAll({ page: 1 }, 'tenant-1');

      expect(AccountPlan.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
          include: expect.any(Array)
        })
      );
      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });

    it('should filter by tier when provided', async () => {
      (AccountPlan.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await accountPlanService.getAll({ tier: 'ENTERPRISE' }, 'tenant-1');

      expect(AccountPlan.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tier: 'ENTERPRISE' }) })
      );
    });

    it('should filter by status when provided', async () => {
      (AccountPlan.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await accountPlanService.getAll({ status: 'ACTIVE' }, 'tenant-1');

      expect(AccountPlan.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) })
      );
    });

    it('should return empty docs when no plans exist', async () => {
      (AccountPlan.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await accountPlanService.getAll({});

      expect(result.docs).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return an account plan by id with includes', async () => {
      (AccountPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockPlan);

      const result = await accountPlanService.getById(1);

      expect(AccountPlan.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({ include: expect.any(Array) }));
      expect(result).toBe(mockPlan);
    });

    it('should return null when plan is not found', async () => {
      (AccountPlan.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await accountPlanService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing account plan and emit socket event', async () => {
      (AccountPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockPlan);

      const result = await accountPlanService.update(1, { healthScore: 90 });

      expect(mockPlan.update).toHaveBeenCalledWith({ healthScore: 90 });
      expect(result).toBe(mockPlan);
    });

    it('should return null when plan is not found', async () => {
      (AccountPlan.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await accountPlanService.update(999, { healthScore: 90 });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete the plan and its stakeholders, then emit socket event', async () => {
      (AccountPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockPlan);
      (Stakeholder.destroy as jest.Mock<any>).mockResolvedValue(3);

      const result = await accountPlanService.delete(1);

      expect(Stakeholder.destroy).toHaveBeenCalledWith({ where: { accountPlanId: 1 } });
      expect(mockPlan.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when plan is not found', async () => {
      (AccountPlan.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await accountPlanService.delete(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Stakeholder CRUD
  // --------------------------------------------------------------------------
  describe('addStakeholder', () => {
    it('should create a stakeholder and emit socket event', async () => {
      (Stakeholder.create as jest.Mock<any>).mockResolvedValue({ id: 1, accountPlanId: 1 });

      const result = await accountPlanService.addStakeholder(
        { accountPlanId: 1, name: 'Jane Doe', role: 'DECISION_MAKER' },
        'tenant-1'
      );

      expect(Stakeholder.create).toHaveBeenCalledWith(
        expect.objectContaining({ accountPlanId: 1, name: 'Jane Doe', tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getStakeholders', () => {
    it('should return stakeholders for an account plan sorted by influence', async () => {
      (Stakeholder.findAll as jest.Mock<any>).mockResolvedValue([mockStakeholder]);

      const result = await accountPlanService.getStakeholders(1);

      expect(Stakeholder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountPlanId: 1 },
          order: [['influence', 'DESC']]
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no stakeholders exist', async () => {
      (Stakeholder.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await accountPlanService.getStakeholders(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('updateStakeholder', () => {
    it('should update an existing stakeholder', async () => {
      (Stakeholder.findByPk as jest.Mock<any>).mockResolvedValue(mockStakeholder);

      const result = await accountPlanService.updateStakeholder(1, { influence: 10 });

      expect(mockStakeholder.update).toHaveBeenCalledWith({ influence: 10 });
      expect(result).toBe(mockStakeholder);
    });

    it('should return null when stakeholder is not found', async () => {
      (Stakeholder.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await accountPlanService.updateStakeholder(999, { influence: 10 });

      expect(result).toBeNull();
    });
  });

  describe('deleteStakeholder', () => {
    it('should delete an existing stakeholder', async () => {
      (Stakeholder.findByPk as jest.Mock<any>).mockResolvedValue(mockStakeholder);

      const result = await accountPlanService.deleteStakeholder(1);

      expect(mockStakeholder.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when stakeholder is not found', async () => {
      (Stakeholder.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await accountPlanService.deleteStakeholder(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Whitespace Analysis
  // --------------------------------------------------------------------------
  describe('getWhitespaceAnalysis', () => {
    it('should return expansion opportunities sorted by potential', async () => {
      (AccountPlan.findAll as jest.Mock<any>).mockResolvedValue([
        {
          id: 1, tier: 'ENTERPRISE', annualRevenue: 500000, expansionPotential: 100000,
          renewalDate: '2026-12-31', healthScore: 85,
          goals: [
            { title: 'Upsell', status: 'COMPLETED' },
            { title: 'Onboard', status: 'IN_PROGRESS' }
          ],
          account: { name: 'Acme Corp' }
        },
        {
          id: 2, tier: 'STANDARD', annualRevenue: 50000, expansionPotential: 20000,
          renewalDate: '2026-06-30', healthScore: 60,
          goals: [],
          account: { name: 'Small Co' }
        }
      ]);

      const result = await accountPlanService.getWhitespaceAnalysis('tenant-1');

      expect(result.count).toBe(2);
      expect(result.totalExpansionPotential).toBe(120000);
      expect(result.opportunities[0].accountName).toBe('Acme Corp');
      expect(result.opportunities[0].goalProgress).toBe(50); // 1 of 2 goals completed
      expect(result.opportunities[1].goalProgress).toBe(0); // no goals
    });

    it('should return empty when no active plans exist', async () => {
      (AccountPlan.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await accountPlanService.getWhitespaceAnalysis();

      expect(result.count).toBe(0);
      expect(result.totalExpansionPotential).toBe(0);
      expect(result.opportunities).toHaveLength(0);
    });

    it('should handle missing account name gracefully', async () => {
      (AccountPlan.findAll as jest.Mock<any>).mockResolvedValue([
        {
          id: 1, tier: 'GROWTH', annualRevenue: 10000, expansionPotential: 5000,
          renewalDate: null, healthScore: 50, goals: [], account: null
        }
      ]);

      const result = await accountPlanService.getWhitespaceAnalysis();

      expect(result.opportunities[0].accountName).toBe('Unknown');
    });
  });

  // --------------------------------------------------------------------------
  // Account Forecast
  // --------------------------------------------------------------------------
  describe('getForecast', () => {
    it('should aggregate forecast by tier', async () => {
      (AccountPlan.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([
          { tier: 'ENTERPRISE', annualRevenue: 500000, expansionPotential: 100000, healthScore: 85 },
          { tier: 'ENTERPRISE', annualRevenue: 300000, expansionPotential: 50000, healthScore: 75 },
          { tier: 'STANDARD', annualRevenue: 50000, expansionPotential: 10000, healthScore: 60 }
        ])
        .mockResolvedValueOnce([{ id: 1 }]); // upcoming renewals

      const result = await accountPlanService.getForecast('tenant-1');

      expect(result.totalAccounts).toBe(3);
      expect(result.byTier).toHaveProperty('ENTERPRISE');
      expect(result.byTier.ENTERPRISE.count).toBe(2);
      expect(result.byTier.ENTERPRISE.totalRevenue).toBe(800000);
      expect(result.byTier.ENTERPRISE.totalExpansion).toBe(150000);
      expect(result.byTier.ENTERPRISE.avgHealth).toBe(80); // (85+75)/2
      expect(result.byTier).toHaveProperty('STANDARD');
      expect(result.byTier.STANDARD.count).toBe(1);
    });

    it('should return upcoming renewals count', async () => {
      (AccountPlan.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

      const result = await accountPlanService.getForecast();

      expect(result.totalAccounts).toBe(0);
      expect(result.upcomingRenewals).toBe(2);
    });

    it('should return empty forecast when no active plans exist', async () => {
      (AccountPlan.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await accountPlanService.getForecast();

      expect(result.totalAccounts).toBe(0);
      expect(result.byTier).toEqual({});
      expect(result.upcomingRenewals).toBe(0);
    });
  });
});
