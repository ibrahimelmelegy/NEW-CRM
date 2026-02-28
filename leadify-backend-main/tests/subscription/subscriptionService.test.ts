
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import subscriptionService from '../../src/subscription/subscriptionService';
import SubscriptionPlan from '../../src/subscription/models/subscriptionPlanModel';
import CustomerSubscription from '../../src/subscription/models/customerSubscriptionModel';
import SubscriptionEvent from '../../src/subscription/models/subscriptionEventModel';
import Client from '../../src/client/clientModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/subscription/models/subscriptionPlanModel');
jest.mock('../../src/subscription/models/customerSubscriptionModel');
jest.mock('../../src/subscription/models/subscriptionEventModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));

describe('SubscriptionService', () => {
  const mockPlan: any = {
    id: 'plan-1',
    name: 'Pro Monthly',
    price: 99,
    billingCycle: 'MONTHLY',
    currency: 'USD',
    trialDays: 0,
    isActive: true,
    update: jest.fn()
  };

  const mockTrialPlan: any = {
    ...mockPlan,
    id: 'plan-trial',
    name: 'Pro with Trial',
    trialDays: 14,
    isActive: true,
    update: jest.fn()
  };

  const mockSubscription: any = {
    id: 'sub-1',
    clientId: 'client-1',
    planId: 'plan-1',
    status: 'ACTIVE',
    startDate: new Date('2026-01-01'),
    currentPeriodStart: new Date('2026-01-01'),
    currentPeriodEnd: new Date('2026-02-01'),
    nextBillingDate: new Date('2026-02-01'),
    cancelledAt: null,
    cancelReason: null,
    update: jest.fn(),
    reload: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Plan CRUD
  // --------------------------------------------------------------------------
  describe('createPlan', () => {
    it('should create a new subscription plan', async () => {
      (SubscriptionPlan.create as jest.Mock<any>).mockResolvedValue(mockPlan);

      const result = await subscriptionService.createPlan({ name: 'Pro Monthly', price: 99, billingCycle: 'MONTHLY' });

      expect(SubscriptionPlan.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'plan-1');
    });
  });

  describe('getPlans', () => {
    it('should return active plans by default', async () => {
      (SubscriptionPlan.findAll as jest.Mock<any>).mockResolvedValue([mockPlan]);

      const result = await subscriptionService.getPlans({});

      expect(SubscriptionPlan.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
      );
      expect(result).toHaveLength(1);
    });

    it('should include inactive plans when requested', async () => {
      (SubscriptionPlan.findAll as jest.Mock<any>).mockResolvedValue([mockPlan]);

      await subscriptionService.getPlans({ includeInactive: 'true' });

      expect(SubscriptionPlan.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ isActive: true }) })
      );
    });
  });

  describe('updatePlan', () => {
    it('should update an existing plan', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockPlan);

      const result = await subscriptionService.updatePlan('plan-1', { price: 149 });

      expect(mockPlan.update).toHaveBeenCalledWith({ price: 149 });
      expect(result).toBe(mockPlan);
    });

    it('should throw NOT_FOUND when plan does not exist', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(subscriptionService.updatePlan('plan-999', { price: 1 }))
        .rejects.toThrow(BaseError);
    });
  });

  describe('deletePlan', () => {
    it('should soft-delete a plan by setting isActive to false', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockPlan);

      await subscriptionService.deletePlan('plan-1');

      expect(mockPlan.update).toHaveBeenCalledWith({ isActive: false });
    });

    it('should throw NOT_FOUND when plan does not exist', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(subscriptionService.deletePlan('plan-999'))
        .rejects.toThrow(BaseError);
    });
  });

  // --------------------------------------------------------------------------
  // Subscription CRUD
  // --------------------------------------------------------------------------
  describe('createSubscription', () => {
    it('should create an ACTIVE subscription for a plan without trial', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockPlan);
      (CustomerSubscription.create as jest.Mock<any>).mockResolvedValue({ id: 'sub-new' });
      (SubscriptionEvent.create as jest.Mock<any>).mockResolvedValue({});
      // getSubscriptionById calls findOne
      (CustomerSubscription.findOne as jest.Mock<any>).mockResolvedValue({ ...mockSubscription, id: 'sub-new' });

      const result = await subscriptionService.createSubscription({ clientId: 'client-1', planId: 'plan-1' });

      expect(CustomerSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE', planId: 'plan-1' })
      );
      expect(SubscriptionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CREATED' })
      );
    });

    it('should create a TRIAL subscription when plan has trialDays', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(mockTrialPlan);
      (CustomerSubscription.create as jest.Mock<any>).mockResolvedValue({ id: 'sub-trial' });
      (SubscriptionEvent.create as jest.Mock<any>).mockResolvedValue({});
      (CustomerSubscription.findOne as jest.Mock<any>).mockResolvedValue({ id: 'sub-trial', status: 'TRIAL' });

      await subscriptionService.createSubscription({ clientId: 'client-1', planId: 'plan-trial' });

      expect(CustomerSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'TRIAL' })
      );
    });

    it('should throw NOT_FOUND when plan does not exist', async () => {
      (SubscriptionPlan.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(subscriptionService.createSubscription({ clientId: 'c', planId: 'bad' }))
        .rejects.toThrow(BaseError);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription with reason', async () => {
      // getSubscriptionById mock
      (CustomerSubscription.findOne as jest.Mock<any>).mockResolvedValue(mockSubscription);
      (SubscriptionEvent.create as jest.Mock<any>).mockResolvedValue({});

      await subscriptionService.cancelSubscription('sub-1', 'Too expensive');

      expect(mockSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CANCELLED', cancelReason: 'Too expensive' })
      );
      expect(SubscriptionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CANCELLED' })
      );
    });

    it('should throw error when subscription is already cancelled', async () => {
      const cancelled = { ...mockSubscription, status: 'CANCELLED' };
      (CustomerSubscription.findOne as jest.Mock<any>).mockResolvedValue(cancelled);

      await expect(subscriptionService.cancelSubscription('sub-1'))
        .rejects.toThrow(BaseError);
    });
  });

  describe('getSubscriptionById', () => {
    it('should return subscription with client, plan, and events', async () => {
      (CustomerSubscription.findOne as jest.Mock<any>).mockResolvedValue(mockSubscription);

      const result = await subscriptionService.getSubscriptionById('sub-1');

      expect(CustomerSubscription.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'sub-1' } })
      );
      expect(result).toBe(mockSubscription);
    });

    it('should throw NOT_FOUND when subscription does not exist', async () => {
      (CustomerSubscription.findOne as jest.Mock<any>).mockResolvedValue(null);

      await expect(subscriptionService.getSubscriptionById('sub-999'))
        .rejects.toThrow(BaseError);
    });
  });

  // --------------------------------------------------------------------------
  // Metrics
  // --------------------------------------------------------------------------
  describe('getMRR', () => {
    it('should calculate MRR by normalizing billing cycles to monthly', async () => {
      const subs = [
        { plan: { price: 100, billingCycle: 'MONTHLY' } },
        { plan: { price: 300, billingCycle: 'QUARTERLY' } },
        { plan: { price: 1200, billingCycle: 'ANNUAL' } }
      ];
      (CustomerSubscription.findAll as jest.Mock<any>).mockResolvedValue(subs);

      const result = await subscriptionService.getMRR();

      // 100 + 300/3 + 1200/12 = 100 + 100 + 100 = 300
      expect(result).toBe(300);
    });

    it('should return 0 when there are no active subscriptions', async () => {
      (CustomerSubscription.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await subscriptionService.getMRR();

      expect(result).toBe(0);
    });
  });

  describe('getChurnRate', () => {
    it('should calculate churn rate for a given month', async () => {
      (CustomerSubscription.count as jest.Mock<any>)
        .mockResolvedValueOnce(100)  // activeAtStart
        .mockResolvedValueOnce(5);   // cancelledInPeriod

      const result = await subscriptionService.getChurnRate(3, 2026);

      expect(result).toBe(5); // 5/100 * 100 = 5%
    });

    it('should return 0 when there are no active subscriptions at period start', async () => {
      (CustomerSubscription.count as jest.Mock<any>).mockResolvedValue(0);

      const result = await subscriptionService.getChurnRate(1, 2026);

      expect(result).toBe(0);
    });
  });
});
