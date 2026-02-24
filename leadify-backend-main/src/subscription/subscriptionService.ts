import { Op, WhereOptions } from 'sequelize';
import SubscriptionPlan, { BillingCycleEnum } from './models/subscriptionPlanModel';
import CustomerSubscription, { SubscriptionStatusEnum } from './models/customerSubscriptionModel';
import SubscriptionEvent, { SubscriptionEventTypeEnum } from './models/subscriptionEventModel';
import Client from '../client/clientModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class SubscriptionService {
    // =====================
    // Plan CRUD
    // =====================

    async createPlan(data: any): Promise<SubscriptionPlan> {
        return SubscriptionPlan.create(data);
    }

    async getPlans(query: any): Promise<SubscriptionPlan[]> {
        const where: WhereOptions = { isActive: true };

        if (query.includeInactive === 'true') {
            delete (where as any).isActive;
        }

        if (query.tenantId) {
            (where as any).tenantId = query.tenantId;
        }

        return SubscriptionPlan.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
    }

    async updatePlan(id: string, data: any): Promise<SubscriptionPlan> {
        const plan = await SubscriptionPlan.findByPk(id);
        if (!plan) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Subscription plan not found');
        await plan.update(data);
        return plan;
    }

    async deletePlan(id: string): Promise<SubscriptionPlan> {
        const plan = await SubscriptionPlan.findByPk(id);
        if (!plan) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Subscription plan not found');
        await plan.update({ isActive: false });
        return plan;
    }

    // =====================
    // Subscription CRUD
    // =====================

    /**
     * Calculate the period end date based on billing cycle
     */
    private calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
        const end = new Date(startDate);
        switch (billingCycle) {
            case BillingCycleEnum.MONTHLY:
                end.setMonth(end.getMonth() + 1);
                break;
            case BillingCycleEnum.QUARTERLY:
                end.setMonth(end.getMonth() + 3);
                break;
            case BillingCycleEnum.ANNUAL:
                end.setFullYear(end.getFullYear() + 1);
                break;
            default:
                end.setMonth(end.getMonth() + 1);
        }
        return end;
    }

    async createSubscription(data: any): Promise<CustomerSubscription> {
        const plan = await SubscriptionPlan.findByPk(data.planId);
        if (!plan) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Subscription plan not found');
        if (!plan.isActive) throw new BaseError(400, 400, 'Plan is inactive');

        const now = new Date();
        const hasTrial = plan.trialDays > 0;

        let startDate = now;
        let currentPeriodStart = now;
        let currentPeriodEnd: Date;
        let nextBillingDate: Date;
        let status: SubscriptionStatusEnum;

        if (hasTrial) {
            // Trial period: subscription starts now, period ends after trial days
            const trialEnd = new Date(now);
            trialEnd.setDate(trialEnd.getDate() + plan.trialDays);

            currentPeriodEnd = trialEnd;
            nextBillingDate = trialEnd;
            status = SubscriptionStatusEnum.TRIAL;
        } else {
            currentPeriodEnd = this.calculatePeriodEnd(now, plan.billingCycle);
            nextBillingDate = currentPeriodEnd;
            status = SubscriptionStatusEnum.ACTIVE;
        }

        const subscription = await CustomerSubscription.create({
            clientId: data.clientId,
            planId: data.planId,
            status,
            startDate,
            currentPeriodStart,
            currentPeriodEnd,
            nextBillingDate,
            tenantId: data.tenantId
        });

        // Create CREATED event
        await SubscriptionEvent.create({
            subscriptionId: subscription.id,
            type: SubscriptionEventTypeEnum.CREATED,
            date: now,
            metadata: {
                planName: plan.name,
                price: plan.price,
                billingCycle: plan.billingCycle,
                hasTrial,
                trialDays: plan.trialDays
            }
        });

        return this.getSubscriptionById(subscription.id);
    }

    async getSubscriptions(query: any): Promise<any> {
        const { page = 1, limit = 10, status, clientId, searchKey } = query;
        const offset = (Number(page) - 1) * Number(limit);

        const where: WhereOptions = {};

        if (status) {
            (where as any).status = status;
        }
        if (clientId) {
            (where as any).clientId = clientId;
        }

        const includeOptions: any[] = [
            {
                model: Client,
                as: 'client',
                attributes: ['id', 'clientName', 'email', 'companyName']
            },
            {
                model: SubscriptionPlan,
                as: 'plan',
                attributes: ['id', 'name', 'price', 'billingCycle', 'currency']
            }
        ];

        if (searchKey) {
            // Search by client name through the include
            includeOptions[0].where = {
                clientName: { [Op.iLike]: `%${searchKey}%` }
            };
            includeOptions[0].required = true;
        }

        const { rows: docs, count: totalItems } = await CustomerSubscription.findAndCountAll({
            where,
            include: includeOptions,
            limit: Number(limit),
            offset: Number(offset),
            order: [['createdAt', 'DESC']]
        });

        return {
            docs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / (Number(limit) || 10))
            }
        };
    }

    async getSubscriptionById(id: string): Promise<CustomerSubscription> {
        const subscription = await CustomerSubscription.findOne({
            where: { id },
            include: [
                { model: Client, as: 'client' },
                { model: SubscriptionPlan, as: 'plan' },
                {
                    model: SubscriptionEvent,
                    as: 'events',
                    order: [['date', 'DESC']]
                }
            ]
        });
        if (!subscription) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Subscription not found');
        return subscription;
    }

    async cancelSubscription(id: string, reason?: string): Promise<CustomerSubscription> {
        const subscription = await this.getSubscriptionById(id);

        if (subscription.status === SubscriptionStatusEnum.CANCELLED) {
            throw new BaseError(400, 400, 'Subscription is already cancelled');
        }

        const now = new Date();
        await subscription.update({
            status: SubscriptionStatusEnum.CANCELLED,
            cancelledAt: now,
            cancelReason: reason || null,
            nextBillingDate: null
        });

        await SubscriptionEvent.create({
            subscriptionId: subscription.id,
            type: SubscriptionEventTypeEnum.CANCELLED,
            date: now,
            metadata: { reason }
        });

        return this.getSubscriptionById(id);
    }

    async changePlan(id: string, newPlanId: string): Promise<CustomerSubscription> {
        const subscription = await this.getSubscriptionById(id);
        const oldPlan = await SubscriptionPlan.findByPk(subscription.planId);
        const newPlan = await SubscriptionPlan.findByPk(newPlanId);

        if (!newPlan) throw new BaseError(ERRORS.NOT_FOUND, 404, 'New plan not found');
        if (!newPlan.isActive) throw new BaseError(400, 400, 'New plan is inactive');
        if (subscription.planId === newPlanId) throw new BaseError(400, 400, 'Already on this plan');

        const isUpgrade = Number(newPlan.price) > Number(oldPlan?.price || 0);
        const eventType = isUpgrade ? SubscriptionEventTypeEnum.UPGRADED : SubscriptionEventTypeEnum.DOWNGRADED;

        // Calculate proration: remaining days in current period
        const now = new Date();
        const periodEnd = new Date(subscription.currentPeriodEnd);
        const periodStart = new Date(subscription.currentPeriodStart);
        const totalDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
        const remainingDays = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const proratedCredit = Number(oldPlan?.price || 0) * (remainingDays / totalDays);
        const proratedCharge = Number(newPlan.price) * (remainingDays / totalDays);
        const prorationAmount = parseFloat((proratedCharge - proratedCredit).toFixed(2));

        await subscription.update({ planId: newPlanId });

        await SubscriptionEvent.create({
            subscriptionId: subscription.id,
            type: eventType,
            date: now,
            metadata: {
                oldPlanId: oldPlan?.id,
                oldPlanName: oldPlan?.name,
                oldPrice: oldPlan?.price,
                newPlanId: newPlan.id,
                newPlanName: newPlan.name,
                newPrice: newPlan.price,
                prorationAmount,
                remainingDays
            }
        });

        return this.getSubscriptionById(id);
    }

    async renewSubscription(id: string): Promise<CustomerSubscription> {
        const subscription = await this.getSubscriptionById(id);
        const plan = await SubscriptionPlan.findByPk(subscription.planId);

        if (!plan) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Plan not found');

        if (subscription.status === SubscriptionStatusEnum.CANCELLED) {
            throw new BaseError(400, 400, 'Cannot renew a cancelled subscription');
        }

        const now = new Date();
        const newPeriodStart = new Date(subscription.currentPeriodEnd);
        const newPeriodEnd = this.calculatePeriodEnd(newPeriodStart, plan.billingCycle);

        await subscription.update({
            status: SubscriptionStatusEnum.ACTIVE,
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            nextBillingDate: newPeriodEnd
        });

        await SubscriptionEvent.create({
            subscriptionId: subscription.id,
            type: SubscriptionEventTypeEnum.RENEWED,
            date: now,
            metadata: {
                periodStart: newPeriodStart,
                periodEnd: newPeriodEnd,
                amount: plan.price
            }
        });

        return this.getSubscriptionById(id);
    }

    async processAutoRenewals(): Promise<{ renewed: number; failed: number }> {
        const now = new Date();

        const dueSubscriptions = await CustomerSubscription.findAll({
            where: {
                nextBillingDate: { [Op.lte]: now },
                status: {
                    [Op.in]: [SubscriptionStatusEnum.ACTIVE, SubscriptionStatusEnum.TRIAL]
                }
            },
            include: [{ model: SubscriptionPlan, as: 'plan' }]
        });

        let renewed = 0;
        let failed = 0;

        for (const subscription of dueSubscriptions) {
            try {
                await this.renewSubscription(subscription.id);
                renewed++;
            } catch (error) {
                failed++;
                // Log payment failure event
                await SubscriptionEvent.create({
                    subscriptionId: subscription.id,
                    type: SubscriptionEventTypeEnum.PAYMENT_FAILED,
                    date: now,
                    metadata: {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });

                // Mark as PAST_DUE
                await subscription.update({ status: SubscriptionStatusEnum.PAST_DUE });
            }
        }

        return { renewed, failed };
    }

    // =====================
    // Metrics
    // =====================

    /**
     * Monthly Recurring Revenue: normalize all active subscription amounts to monthly
     */
    async getMRR(): Promise<number> {
        const activeSubscriptions = await CustomerSubscription.findAll({
            where: { status: SubscriptionStatusEnum.ACTIVE },
            include: [{ model: SubscriptionPlan, as: 'plan' }]
        });

        let mrr = 0;
        for (const sub of activeSubscriptions) {
            const plan = (sub as any).plan as SubscriptionPlan;
            if (!plan) continue;

            const price = Number(plan.price) || 0;
            switch (plan.billingCycle) {
                case BillingCycleEnum.MONTHLY:
                    mrr += price;
                    break;
                case BillingCycleEnum.QUARTERLY:
                    mrr += price / 3;
                    break;
                case BillingCycleEnum.ANNUAL:
                    mrr += price / 12;
                    break;
            }
        }

        return parseFloat(mrr.toFixed(2));
    }

    async getARR(): Promise<number> {
        const mrr = await this.getMRR();
        return parseFloat((mrr * 12).toFixed(2));
    }

    /**
     * Churn rate for a given month/year:
     * cancelled in period / active at start of period
     */
    async getChurnRate(month: number, year: number): Promise<number> {
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0, 23, 59, 59);

        // Subscriptions active at start of period:
        // those created before period start and not cancelled before period start
        const activeAtStart = await CustomerSubscription.count({
            where: {
                startDate: { [Op.lt]: periodStart },
                [Op.or]: [
                    { cancelledAt: null },
                    { cancelledAt: { [Op.gte]: periodStart } }
                ]
            }
        });

        if (activeAtStart === 0) return 0;

        // Cancelled during the period
        const cancelledInPeriod = await CustomerSubscription.count({
            where: {
                cancelledAt: {
                    [Op.gte]: periodStart,
                    [Op.lte]: periodEnd
                }
            }
        });

        return parseFloat(((cancelledInPeriod / activeAtStart) * 100).toFixed(2));
    }

    async getSubscriptionMetrics(): Promise<any> {
        const mrr = await this.getMRR();
        const arr = mrr * 12;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const churnRate = await this.getChurnRate(currentMonth, currentYear);

        const activeCount = await CustomerSubscription.count({
            where: { status: SubscriptionStatusEnum.ACTIVE }
        });

        const trialCount = await CustomerSubscription.count({
            where: { status: SubscriptionStatusEnum.TRIAL }
        });

        // Total revenue: sum of all active subscription plan prices (current period value)
        const activeSubscriptions = await CustomerSubscription.findAll({
            where: {
                status: {
                    [Op.in]: [SubscriptionStatusEnum.ACTIVE, SubscriptionStatusEnum.TRIAL]
                }
            },
            include: [{ model: SubscriptionPlan, as: 'plan' }]
        });

        let totalRevenue = 0;
        for (const sub of activeSubscriptions) {
            const plan = (sub as any).plan as SubscriptionPlan;
            if (plan) totalRevenue += Number(plan.price) || 0;
        }

        // Net revenue growth: compare current MRR with previous month's MRR equivalent
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevChurn = await this.getChurnRate(prevMonth, prevYear);
        const netRevenueGrowth = parseFloat((100 - prevChurn).toFixed(2));

        // MRR trend for the last 6 months
        const mrrTrend: Array<{ month: string; amount: number }> = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - 1 - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const label = `${y}-${String(m).padStart(2, '0')}`;

            // For historical MRR, count subscriptions active during that month
            const monthStart = new Date(y, m - 1, 1);
            const monthEnd = new Date(y, m, 0, 23, 59, 59);

            const activeSubs = await CustomerSubscription.findAll({
                where: {
                    startDate: { [Op.lte]: monthEnd },
                    [Op.or]: [
                        { cancelledAt: null },
                        { cancelledAt: { [Op.gt]: monthEnd } }
                    ],
                    status: {
                        [Op.ne]: SubscriptionStatusEnum.EXPIRED
                    }
                },
                include: [{ model: SubscriptionPlan, as: 'plan' }]
            });

            let monthMrr = 0;
            for (const sub of activeSubs) {
                const plan = (sub as any).plan as SubscriptionPlan;
                if (!plan) continue;
                const price = Number(plan.price) || 0;
                switch (plan.billingCycle) {
                    case BillingCycleEnum.MONTHLY:
                        monthMrr += price;
                        break;
                    case BillingCycleEnum.QUARTERLY:
                        monthMrr += price / 3;
                        break;
                    case BillingCycleEnum.ANNUAL:
                        monthMrr += price / 12;
                        break;
                }
            }

            mrrTrend.push({ month: label, amount: parseFloat(monthMrr.toFixed(2)) });
        }

        return {
            mrr: parseFloat(mrr.toFixed(2)),
            arr: parseFloat(arr.toFixed(2)),
            churnRate,
            activeCount,
            trialCount,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            netRevenueGrowth,
            mrrTrend
        };
    }
}

export default new SubscriptionService();
