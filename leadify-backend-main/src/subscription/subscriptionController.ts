import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import subscriptionService from './subscriptionService';

class SubscriptionController {
  // =====================
  // Plans
  // =====================

  public async createPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionService.createPlan(req.body);
      wrapResult(res, plan, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await subscriptionService.getPlans(req.query);
      wrapResult(res, plans);
    } catch (error) {
      next(error);
    }
  }

  public async updatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionService.updatePlan(req.params.id as string, req.body);
      wrapResult(res, plan);
    } catch (error) {
      next(error);
    }
  }

  public async deletePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionService.deletePlan(req.params.id as string);
      wrapResult(res, plan);
    } catch (error) {
      next(error);
    }
  }

  // =====================
  // Subscriptions
  // =====================

  public async createSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscription = await subscriptionService.createSubscription(req.body);
      wrapResult(res, subscription, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getSubscriptions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionService.getSubscriptions(req.query);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getSubscriptionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscription = await subscriptionService.getSubscriptionById(req.params.id as string);
      wrapResult(res, subscription);
    } catch (error) {
      next(error);
    }
  }

  public async cancelSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const subscription = await subscriptionService.cancelSubscription(req.params.id as string, reason);
      wrapResult(res, subscription);
    } catch (error) {
      next(error);
    }
  }

  public async changePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newPlanId } = req.body;
      const subscription = await subscriptionService.changePlan(req.params.id as string, newPlanId);
      wrapResult(res, subscription);
    } catch (error) {
      next(error);
    }
  }

  // =====================
  // Metrics & Renewals
  // =====================

  public async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await subscriptionService.getSubscriptionMetrics();
      wrapResult(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  public async processRenewals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionService.processAutoRenewals();
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();
