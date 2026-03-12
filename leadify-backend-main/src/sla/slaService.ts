import { Op } from 'sequelize';
import { SLAPolicy, SLAInstance, SLAInstanceStatus, SLAConditions, EscalationRule, BusinessHoursConfig } from './slaModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import notificationCenterService from '../notification/notificationCenterService';

// ─── Interfaces ──────────────────────────────────────────────────────────

interface CreatePolicyData {
  name: string;
  entityType: string;
  conditions?: SLAConditions;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationRules?: EscalationRule[];
  businessHoursOnly?: boolean;
  businessHours?: BusinessHoursConfig;
  isActive?: boolean;
}

interface UpdatePolicyData {
  name?: string;
  entityType?: string;
  conditions?: SLAConditions;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  escalationRules?: EscalationRule[];
  businessHoursOnly?: boolean;
  businessHours?: BusinessHoursConfig;
  isActive?: boolean;
}

interface GetPoliciesQuery {
  page?: number;
  limit?: number;
  entityType?: string;
  isActive?: boolean;
}

interface SLAStatusResult {
  instance: SLAInstance;
  responseTimeRemaining: number | null; // minutes remaining, null if responded
  resolutionTimeRemaining: number | null; // minutes remaining, null if resolved
  responseBreached: boolean;
  resolutionBreached: boolean;
  status: string;
}

interface SLAMetrics {
  totalInstances: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  responseBreach: { count: number; rate: number };
  resolutionBreach: { count: number; rate: number };
  activeCount: number;
  completedCount: number;
  breachedCount: number;
}

// ─── Service ─────────────────────────────────────────────────────────────

class SLAService {
  // ────── Policy CRUD ──────

  async createPolicy(data: CreatePolicyData, userId: number): Promise<SLAPolicy> {
    return SLAPolicy.create({
      ...data,
      createdBy: userId
    });
  }

  async updatePolicy(id: number, data: UpdatePolicyData): Promise<SLAPolicy> {
    const policy = await SLAPolicy.findByPk(id);
    if (!policy) throw new BaseError(ERRORS.NOT_FOUND);
    await policy.update(data);
    return policy;
  }

  async deletePolicy(id: number): Promise<void> {
    const policy = await SLAPolicy.findByPk(id);
    if (!policy) throw new BaseError(ERRORS.NOT_FOUND);
    await policy.destroy();
  }

  async getPolicies(query: GetPoliciesQuery): Promise<{
    docs: SLAPolicy[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const { rows, count } = await SLAPolicy.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getPolicyById(id: number): Promise<SLAPolicy> {
    const policy = await SLAPolicy.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
    if (!policy) throw new BaseError(ERRORS.NOT_FOUND);
    return policy;
  }

  // ────── SLA Instance Lifecycle ──────

  /**
   * Start an SLA for a given entity. Finds the best matching active SLA policy
   * and creates an SLA instance with computed deadlines.
   */
  async startSLA(entityType: string, entityId: string, entityData: Record<string, unknown> = {}): Promise<SLAInstance | null> {
    // Find all active policies for this entity type
    const policies = await SLAPolicy.findAll({
      where: { entityType, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    if (policies.length === 0) return null;

    // Find the best matching policy based on conditions
    const matchedPolicy = this.findMatchingPolicy(policies, entityData);
    if (!matchedPolicy) return null;

    const now = new Date();
    const businessHoursConfig = matchedPolicy.businessHoursOnly ? matchedPolicy.businessHours : null;

    const responseDeadline = this.calculateDeadline(now, matchedPolicy.responseTimeMinutes, businessHoursConfig);

    const resolutionDeadline = this.calculateDeadline(now, matchedPolicy.resolutionTimeMinutes, businessHoursConfig);

    return SLAInstance.create({
      slaPolicyId: matchedPolicy.id,
      entityType,
      entityId: String(entityId),
      startedAt: now,
      responseDeadline,
      resolutionDeadline,
      status: SLAInstanceStatus.ACTIVE
    });
  }

  /**
   * Record the first response for an SLA instance.
   */
  async recordResponse(entityType: string, entityId: string): Promise<SLAInstance | null> {
    const instance = await SLAInstance.findOne({
      where: {
        entityType,
        entityId: String(entityId),
        status: { [Op.in]: [SLAInstanceStatus.ACTIVE, SLAInstanceStatus.PAUSED] }
      }
    });

    if (!instance) return null;
    if (instance.firstRespondedAt) return instance; // Already responded

    const now = new Date();
    const responseBreached = now > instance.responseDeadline;

    await instance.update({
      firstRespondedAt: now,
      responseBreached
    });

    return instance;
  }

  /**
   * Record resolution for an SLA instance.
   */
  async recordResolution(entityType: string, entityId: string): Promise<SLAInstance | null> {
    const instance = await SLAInstance.findOne({
      where: {
        entityType,
        entityId: String(entityId),
        status: { [Op.in]: [SLAInstanceStatus.ACTIVE, SLAInstanceStatus.PAUSED] }
      }
    });

    if (!instance) return null;

    const now = new Date();
    const resolutionBreached = now > instance.resolutionDeadline;

    // Also check response if not yet responded
    const updates: Record<string, unknown> = {
      resolvedAt: now,
      resolutionBreached,
      status: resolutionBreached ? SLAInstanceStatus.BREACHED : SLAInstanceStatus.COMPLETED
    };

    if (!instance.firstRespondedAt) {
      updates.firstRespondedAt = now;
      updates.responseBreached = now > instance.responseDeadline;
    }

    await instance.update(updates);
    return instance;
  }

  /**
   * Pause an SLA timer (e.g. when waiting for customer response).
   */
  async pauseSLA(entityType: string, entityId: string): Promise<SLAInstance | null> {
    const instance = await SLAInstance.findOne({
      where: {
        entityType,
        entityId: String(entityId),
        status: SLAInstanceStatus.ACTIVE
      }
    });

    if (!instance) return null;

    await instance.update({
      status: SLAInstanceStatus.PAUSED,
      pausedAt: new Date()
    });

    return instance;
  }

  /**
   * Resume a paused SLA timer. Extends deadlines by the paused duration.
   */
  async resumeSLA(entityType: string, entityId: string): Promise<SLAInstance | null> {
    const instance = await SLAInstance.findOne({
      where: {
        entityType,
        entityId: String(entityId),
        status: SLAInstanceStatus.PAUSED
      }
    });

    if (!instance || !instance.pausedAt) return null;

    const now = new Date();
    const pausedMs = now.getTime() - instance.pausedAt.getTime();
    const pausedMinutes = Math.floor(pausedMs / 60000);

    // Extend deadlines by the paused duration
    const newResponseDeadline = new Date(instance.responseDeadline.getTime() + pausedMs);
    const newResolutionDeadline = new Date(instance.resolutionDeadline.getTime() + pausedMs);

    await instance.update({
      status: SLAInstanceStatus.ACTIVE,
      pausedAt: null,
      pausedDurationMinutes: instance.pausedDurationMinutes + pausedMinutes,
      responseDeadline: newResponseDeadline,
      resolutionDeadline: newResolutionDeadline
    });

    return instance;
  }

  /**
   * Check all active SLA instances for breaches and trigger escalations.
   * This should be called periodically (e.g. every minute via cron).
   */
  async checkBreaches(): Promise<{
    responseBreaches: number;
    resolutionBreaches: number;
    escalations: number;
  }> {
    const now = new Date();
    let responseBreaches = 0;
    let resolutionBreaches = 0;
    let escalations = 0;

    // Find active instances that are past their response deadline and haven't responded
    const responseBreach = await SLAInstance.findAll({
      where: {
        status: SLAInstanceStatus.ACTIVE,
        responseBreached: false,
        firstRespondedAt: null,
        responseDeadline: { [Op.lt]: now }
      },
      include: [{ model: SLAPolicy, as: 'policy' }]
    });

    for (const instance of responseBreach) {
      await instance.update({ responseBreached: true });
      responseBreaches++;

      // Send SLA breach notification
      if (instance.policy?.createdBy) {
        await notificationCenterService.sendNotification({
          userId: instance.policy.createdBy,
          type: 'SLA_BREACH',
          title: 'SLA Response Breach',
          message: `SLA response time breached for ${instance.entityType} #${instance.entityId}`,
          entityType: instance.entityType,
          entityId: instance.entityId
        });
      }
    }

    // Find active instances that are past their resolution deadline and haven't been resolved
    const resolutionBreach = await SLAInstance.findAll({
      where: {
        status: SLAInstanceStatus.ACTIVE,
        resolutionBreached: false,
        resolvedAt: null,
        resolutionDeadline: { [Op.lt]: now }
      },
      include: [{ model: SLAPolicy, as: 'policy' }]
    });

    for (const instance of resolutionBreach) {
      await instance.update({
        resolutionBreached: true,
        status: SLAInstanceStatus.BREACHED
      });
      resolutionBreaches++;

      // Send SLA breach notification
      if (instance.policy?.createdBy) {
        await notificationCenterService.sendNotification({
          userId: instance.policy.createdBy,
          type: 'SLA_BREACH',
          title: 'SLA Resolution Breach',
          message: `SLA resolution time breached for ${instance.entityType} #${instance.entityId}`,
          entityType: instance.entityType,
          entityId: instance.entityId
        });
      }
    }

    // Process escalations for active (non-breached-yet) instances
    const activeInstances = await SLAInstance.findAll({
      where: {
        status: SLAInstanceStatus.ACTIVE,
        resolvedAt: null
      },
      include: [{ model: SLAPolicy, as: 'policy' }]
    });

    for (const instance of activeInstances) {
      const policy = instance.policy;
      if (!policy || !policy.escalationRules || policy.escalationRules.length === 0) continue;

      const elapsedMinutes = Math.floor((now.getTime() - instance.startedAt.getTime()) / 60000) - instance.pausedDurationMinutes;

      // Sort escalation rules by afterMinutes ascending
      const sortedRules = [...policy.escalationRules].sort((a, b) => a.afterMinutes - b.afterMinutes);

      // Find the highest escalation level that should have triggered
      let targetLevel = 0;
      for (let i = 0; i < sortedRules.length; i++) {
        if (elapsedMinutes >= sortedRules[i].afterMinutes) {
          targetLevel = i + 1;
        }
      }

      // Only escalate if we haven't already reached this level
      if (targetLevel > instance.currentEscalationLevel) {
        const rule = sortedRules[targetLevel - 1];
        await instance.update({ currentEscalationLevel: targetLevel });
        escalations++;

        // Send escalation notification
        if (rule.targetUserId) {
          await notificationCenterService.sendNotification({
            userId: rule.targetUserId,
            type: 'SLA_WARNING',
            title: 'SLA Escalation',
            message: `SLA escalation (level ${targetLevel}) for ${instance.entityType} #${instance.entityId}: ${rule.action}`,
            entityType: instance.entityType,
            entityId: instance.entityId
          });
        }

        if (rule.targetRole) {
          await notificationCenterService.sendRoleNotification(rule.targetRole, {
            type: 'SLA_WARNING',
            title: 'SLA Escalation',
            message: `SLA escalation (level ${targetLevel}) for ${instance.entityType} #${instance.entityId}: ${rule.action}`,
            entityType: instance.entityType,
            entityId: instance.entityId
          });
        }
      }
    }

    return { responseBreaches, resolutionBreaches, escalations };
  }

  /**
   * Get the current SLA status for a specific entity.
   */
  async getSLAStatus(entityType: string, entityId: string): Promise<SLAStatusResult | null> {
    const instance = await SLAInstance.findOne({
      where: {
        entityType,
        entityId: String(entityId)
      },
      include: [{ model: SLAPolicy, as: 'policy' }],
      order: [['createdAt', 'DESC']]
    });

    if (!instance) return null;

    const now = new Date();

    // Calculate time remaining for response
    let responseTimeRemaining: number | null = null;
    if (!instance.firstRespondedAt && instance.status !== SLAInstanceStatus.COMPLETED) {
      const remainingMs = instance.responseDeadline.getTime() - now.getTime();
      responseTimeRemaining = Math.floor(remainingMs / 60000);
    }

    // Calculate time remaining for resolution
    let resolutionTimeRemaining: number | null = null;
    if (!instance.resolvedAt && instance.status !== SLAInstanceStatus.COMPLETED) {
      const remainingMs = instance.resolutionDeadline.getTime() - now.getTime();
      resolutionTimeRemaining = Math.floor(remainingMs / 60000);
    }

    return {
      instance,
      responseTimeRemaining,
      resolutionTimeRemaining,
      responseBreached: instance.responseBreached,
      resolutionBreached: instance.resolutionBreached,
      status: instance.status
    };
  }

  /**
   * Get aggregate SLA metrics for a given entity type within a date range.
   */
  async getSLAMetrics(entityType: string, dateRange?: { from?: string; to?: string }): Promise<SLAMetrics> {
    const where: Record<string, unknown> = { entityType };

    if (dateRange?.from || dateRange?.to) {
      where.startedAt = {};
      if (dateRange.from) where.startedAt[Op.gte] = new Date(dateRange.from);
      if (dateRange.to) where.startedAt[Op.lte] = new Date(dateRange.to);
    }

    const instances = await SLAInstance.findAll({
      where,
      include: [{ model: SLAPolicy, as: 'policy' }]
    });

    const totalInstances = instances.length;
    if (totalInstances === 0) {
      return {
        totalInstances: 0,
        avgResponseTimeMinutes: 0,
        avgResolutionTimeMinutes: 0,
        responseBreach: { count: 0, rate: 0 },
        resolutionBreach: { count: 0, rate: 0 },
        activeCount: 0,
        completedCount: 0,
        breachedCount: 0
      };
    }

    // Calculate average response time (for those that have responded)
    const respondedInstances = instances.filter(i => i.firstRespondedAt);
    const avgResponseTime =
      respondedInstances.length > 0
        ? respondedInstances.reduce((sum, i) => {
            const responseMs = i.firstRespondedAt!.getTime() - i.startedAt.getTime();
            return sum + responseMs / 60000;
          }, 0) / respondedInstances.length
        : 0;

    // Calculate average resolution time (for those that have been resolved)
    const resolvedInstances = instances.filter(i => i.resolvedAt);
    const avgResolutionTime =
      resolvedInstances.length > 0
        ? resolvedInstances.reduce((sum, i) => {
            const resolutionMs = i.resolvedAt!.getTime() - i.startedAt.getTime();
            return sum + resolutionMs / 60000;
          }, 0) / resolvedInstances.length
        : 0;

    const responseBreachCount = instances.filter(i => i.responseBreached).length;
    const resolutionBreachCount = instances.filter(i => i.resolutionBreached).length;

    const activeCount = instances.filter(i => i.status === SLAInstanceStatus.ACTIVE || i.status === SLAInstanceStatus.PAUSED).length;
    const completedCount = instances.filter(i => i.status === SLAInstanceStatus.COMPLETED).length;
    const breachedCount = instances.filter(i => i.status === SLAInstanceStatus.BREACHED).length;

    return {
      totalInstances,
      avgResponseTimeMinutes: Math.round(avgResponseTime * 100) / 100,
      avgResolutionTimeMinutes: Math.round(avgResolutionTime * 100) / 100,
      responseBreach: {
        count: responseBreachCount,
        rate: Math.round((responseBreachCount / totalInstances) * 10000) / 100
      },
      resolutionBreach: {
        count: resolutionBreachCount,
        rate: Math.round((resolutionBreachCount / totalInstances) * 10000) / 100
      },
      activeCount,
      completedCount,
      breachedCount
    };
  }

  // ────── Helpers ──────

  /**
   * Find the best matching SLA policy for given entity data.
   * A policy matches if all its conditions are satisfied by entityData.
   * More specific policies (more conditions) are preferred.
   */
  private findMatchingPolicy(policies: SLAPolicy[], entityData: Record<string, unknown>): SLAPolicy | null {
    let bestMatch: SLAPolicy | null = null;
    let bestScore = -1;

    for (const policy of policies) {
      const conditions = policy.conditions || {};
      const conditionKeys = Object.keys(conditions);

      // If no conditions, this is a catch-all policy (score 0)
      if (conditionKeys.length === 0) {
        if (bestScore < 0) {
          bestMatch = policy;
          bestScore = 0;
        }
        continue;
      }

      // Check if all conditions match
      let allMatch = true;
      for (const key of conditionKeys) {
        if (entityData[key] !== conditions[key]) {
          allMatch = false;
          break;
        }
      }

      if (allMatch && conditionKeys.length > bestScore) {
        bestMatch = policy;
        bestScore = conditionKeys.length;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate a deadline by adding business-aware minutes to a start time.
   * If businessHoursConfig is null, simply adds calendar minutes.
   */
  calculateDeadline(startTime: Date, minutes: number, businessHoursConfig: BusinessHoursConfig | null): Date {
    if (!businessHoursConfig) {
      // Calendar time (24/7)
      return new Date(startTime.getTime() + minutes * 60000);
    }

    const { start, end, workDays } = businessHoursConfig;

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    // Business minutes per day
    const businessMinutesPerDay = endHour * 60 + endMin - (startHour * 60 + startMin);

    if (businessMinutesPerDay <= 0) {
      // Invalid config, fall back to calendar time
      return new Date(startTime.getTime() + minutes * 60000);
    }

    let remainingMinutes = minutes;
    let cursor = new Date(startTime.getTime());

    // If current time is before business hours, move to start of business hours
    // If after, move to next business day start
    const adjustToBusinessStart = (d: Date): Date => {
      const result = new Date(d.getTime());
      const dayOfWeek = result.getDay();
      const currentMinutes = result.getHours() * 60 + result.getMinutes();
      const dayStartMinutes = startHour * 60 + startMin;
      const dayEndMinutes = endHour * 60 + endMin;

      if (!workDays.includes(dayOfWeek) || currentMinutes >= dayEndMinutes) {
        // Move to next work day start
        return this.nextWorkDayStart(result, workDays, startHour, startMin);
      }

      if (currentMinutes < dayStartMinutes) {
        result.setHours(startHour, startMin, 0, 0);
      }

      return result;
    };

    cursor = adjustToBusinessStart(cursor);

    // Safety limit to prevent infinite loops
    const maxIterations = Math.ceil(minutes / businessMinutesPerDay) + workDays.length + 10;
    let iterations = 0;

    while (remainingMinutes > 0 && iterations < maxIterations) {
      iterations++;
      const dayOfWeek = cursor.getDay();

      if (!workDays.includes(dayOfWeek)) {
        // Skip non-work day
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startHour, startMin, 0, 0);
        continue;
      }

      const currentMinutes = cursor.getHours() * 60 + cursor.getMinutes();
      const dayEndMinutes = endHour * 60 + endMin;
      const minutesLeftInDay = dayEndMinutes - currentMinutes;

      if (minutesLeftInDay <= 0) {
        // Move to next day
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startHour, startMin, 0, 0);
        continue;
      }

      if (remainingMinutes <= minutesLeftInDay) {
        // Fits within this business day
        cursor = new Date(cursor.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        // Use up the rest of this business day
        remainingMinutes -= minutesLeftInDay;
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startHour, startMin, 0, 0);
      }
    }

    return cursor;
  }

  /**
   * Find the start of the next work day after the given date.
   */
  private nextWorkDayStart(date: Date, workDays: number[], startHour: number, startMin: number): Date {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + 1);
    result.setHours(startHour, startMin, 0, 0);

    // Safety: max 7 iterations to find next work day
    for (let i = 0; i < 7; i++) {
      if (workDays.includes(result.getDay())) {
        return result;
      }
      result.setDate(result.getDate() + 1);
    }

    // Fallback (should not reach here if workDays has at least one day)
    return result;
  }
}

export default new SLAService();
