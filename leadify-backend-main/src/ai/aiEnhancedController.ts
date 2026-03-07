import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { wrapResult } from '../utils/response/responseWrapper';
import aiChatService from './aiChatService';
import dealScoringService from './dealScoringService';
import emailAIService from './emailAIService';
import { Op, fn, col } from 'sequelize';
import Deal from '../deal/model/dealModel';
import Lead from '../lead/leadModel';
import Invoice from '../deal/model/invoiceMode';
import { DealActivity } from '../activity-logs/model/dealActivities';
import Opportunity from '../opportunity/opportunityModel';

// ===== Chat Controller =====
export const aiChatController = {
  async askCRM(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question } = req.body;
      if (!question || typeof question !== 'string') {
        res.status(400).json({ success: false, message: 'Question is required' });
        return;
      }

      const userId = req.user!.id;
      const result = await aiChatService.askCRM(question, userId);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  },

  async clearChat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      aiChatService.clearHistory(userId);
      wrapResult(res, { message: 'Chat history cleared' });
    } catch (error) {
      next(error);
    }
  }
};

// ===== Deal Scoring Controller =====
export const aiDealController = {
  async scoreDeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dealId } = req.params;
      if (!dealId) {
        res.status(400).json({ success: false, message: 'Deal ID is required' });
        return;
      }

      const score = await dealScoringService.scoreDeal(dealId as string);
      wrapResult(res, score);
    } catch (error) {
      if ((error instanceof Error ? error.message : String(error)) === 'Deal not found') {
        res.status(404).json({ success: false, message: 'Deal not found' });
        return;
      }
      next(error);
    }
  }
};

// ===== Email AI Controller =====
export const aiEmailController = {
  async generateEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = req.body;
      if (!context || (!context.purpose && !context.customInstructions)) {
        res.status(400).json({ success: false, message: 'Email purpose or custom instructions are required' });
        return;
      }

      const result = await emailAIService.generateEmail(context);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  },

  async suggestReply(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { thread, context } = req.body;
      if (!thread || typeof thread !== 'string') {
        res.status(400).json({ success: false, message: 'Email thread content is required' });
        return;
      }

      const result = await emailAIService.suggestReply(thread, context);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  },

  async improveEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { draft, instruction } = req.body;
      if (!draft || !instruction) {
        res.status(400).json({ success: false, message: 'Both draft and instruction are required' });
        return;
      }

      const result = await emailAIService.improveEmail(draft, instruction);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
};

// ===== Daily Insights Controller =====
export const aiInsightsController = {
  async getDailyInsights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const oneWeekAgo = sevenDaysAgo;
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // Parallel data fetching for performance
      const [
        stalledDeals,
        recentClosedDeals,
        prevWeekClosedDeals,
        newLeadsThisWeek,
        newLeadsPrevWeek,
        convertedLeadsThisWeek,
        totalLeadsThisWeek,
        overdueInvoices,
        _upcomingOpportunities,
        pipelineValue,
        recentActivitiesCount
      ] = await Promise.all([
        // Deals with no activity in 7+ days that are still in progress
        Deal.findAll({
          where: { stage: 'PROGRESS' },
          attributes: ['id', 'name', 'price', 'createdAt'],
          raw: true
        }),
        // Deals closed this week
        Deal.count({
          where: {
            stage: 'CLOSED',
            updatedAt: { [Op.gte]: oneWeekAgo }
          }
        }),
        // Deals closed previous week
        Deal.count({
          where: {
            stage: 'CLOSED',
            updatedAt: { [Op.gte]: twoWeeksAgo, [Op.lt]: oneWeekAgo }
          }
        }),
        // New leads this week
        Lead.count({
          where: { createdAt: { [Op.gte]: oneWeekAgo } }
        }),
        // New leads previous week
        Lead.count({
          where: { createdAt: { [Op.gte]: twoWeeksAgo, [Op.lt]: oneWeekAgo } }
        }),
        // Converted leads this week
        Lead.count({
          where: {
            status: 'CONVERTED',
            updatedAt: { [Op.gte]: oneWeekAgo }
          }
        }),
        // Total leads for conversion rate
        Lead.count({
          where: { createdAt: { [Op.gte]: oneWeekAgo } }
        }),
        // Overdue invoices (not collected, date passed)
        Invoice.findAll({
          where: {
            collected: false,
            invoiceDate: { [Op.lt]: now }
          },
          attributes: ['id', 'invoiceNumber', 'amount', 'invoiceDate'],
          raw: true
        }),
        // Opportunities closing soon
        Opportunity.findAll({
          where: {
            stage: { [Op.notIn]: ['WON', 'LOST', 'CONVERTED'] },
            expectedCloseDate: {
              [Op.gte]: now,
              [Op.lte]: sevenDaysAgo // Actually next 7 days
            }
          },
          attributes: ['id', 'name', 'estimatedValue', 'expectedCloseDate'],
          raw: true
        }).catch(() => []), // Graceful fallback
        // Pipeline total value
        Deal.findOne({
          where: { stage: 'PROGRESS' },
          attributes: [[fn('SUM', col('price')), 'total']],
          raw: true
        }),
        // Activity count this week
        DealActivity.count({
          where: { createdAt: { [Op.gte]: oneWeekAgo } }
        })
      ]);

      // Calculate stalled deals (check for recent activities)
      const stalledDealsList: any[] = [];
      for (const deal of stalledDeals as any[]) {
        const lastActivity = await DealActivity.findOne({
          where: { dealId: deal.id },
          order: [['createdAt', 'DESC']],
          attributes: ['createdAt'],
          raw: true
        });

        const daysSince = lastActivity
          ? Math.floor((now.getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince >= 7) {
          stalledDealsList.push({
            ...deal,
            daysSinceActivity: daysSince
          });
        }
      }

      // Build insights
      const insights: Array<{
        id: string;
        type: 'warning' | 'success' | 'info' | 'danger';
        icon: string;
        title: string;
        description: string;
        action?: { label: string; route: string };
        metric?: string;
      }> = [];

      // Insight 1: Stalled deals
      if (stalledDealsList.length > 0) {
        const totalValue = stalledDealsList.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
        insights.push({
          id: 'stalled-deals',
          type: 'warning',
          icon: 'ph:clock-countdown-bold',
          title: 'Stalled Deals Need Attention',
          description: `You have ${stalledDealsList.length} deal${stalledDealsList.length !== 1 ? 's' : ''} worth $${totalValue.toLocaleString()} that haven't been updated in 7+ days.`,
          action: { label: 'View Deals', route: '/sales/deals' },
          metric: `${stalledDealsList.length} deals`
        });
      }

      // Insight 2: Lead conversion trend
      if (totalLeadsThisWeek > 0 || newLeadsPrevWeek > 0) {
        const conversionRate = totalLeadsThisWeek > 0 ? Math.round((convertedLeadsThisWeek / totalLeadsThisWeek) * 100) : 0;
        const leadChange =
          newLeadsPrevWeek > 0 ? Math.round(((newLeadsThisWeek - newLeadsPrevWeek) / newLeadsPrevWeek) * 100) : newLeadsThisWeek > 0 ? 100 : 0;

        if (leadChange > 0) {
          insights.push({
            id: 'lead-growth',
            type: 'success',
            icon: 'ph:trend-up-bold',
            title: 'Lead Generation Up',
            description: `New leads are up ${leadChange}% this week (${newLeadsThisWeek} vs ${newLeadsPrevWeek} last week). Conversion rate: ${conversionRate}%.`,
            action: { label: 'View Leads', route: '/sales/leads' },
            metric: `+${leadChange}%`
          });
        } else if (leadChange < -10) {
          insights.push({
            id: 'lead-decline',
            type: 'warning',
            icon: 'ph:trend-down-bold',
            title: 'Lead Generation Down',
            description: `New leads are down ${Math.abs(leadChange)}% compared to last week (${newLeadsThisWeek} vs ${newLeadsPrevWeek}).`,
            action: { label: 'View Leads', route: '/sales/leads' },
            metric: `${leadChange}%`
          });
        }
      }

      // Insight 3: Overdue invoices
      if (overdueInvoices.length > 0) {
        const totalOverdue = (overdueInvoices as any[]).reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
        insights.push({
          id: 'overdue-invoices',
          type: 'danger',
          icon: 'ph:warning-circle-bold',
          title: 'Overdue Invoices',
          description: `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? 's are' : ' is'} overdue totaling $${totalOverdue.toLocaleString()}.`,
          action: { label: 'View Invoices', route: '/sales/deals' },
          metric: `$${totalOverdue.toLocaleString()}`
        });
      }

      // Insight 4: Pipeline value
      const pipelineTotal = (pipelineValue as any)?.total || 0;
      if (pipelineTotal > 0) {
        insights.push({
          id: 'pipeline-value',
          type: 'info',
          icon: 'ph:chart-line-up-bold',
          title: 'Active Pipeline',
          description: `Your active pipeline is worth $${Number(pipelineTotal).toLocaleString()} across ${stalledDeals.length} deals in progress.`,
          action: { label: 'View Pipeline', route: '/sales/deals' },
          metric: `$${Number(pipelineTotal).toLocaleString()}`
        });
      }

      // Insight 5: Closed deals comparison
      if (recentClosedDeals > 0 || prevWeekClosedDeals > 0) {
        const change =
          prevWeekClosedDeals > 0
            ? Math.round(((recentClosedDeals - prevWeekClosedDeals) / prevWeekClosedDeals) * 100)
            : recentClosedDeals > 0
              ? 100
              : 0;

        if (recentClosedDeals > 0) {
          insights.push({
            id: 'closed-deals',
            type: 'success',
            icon: 'ph:check-circle-bold',
            title: 'Deals Closed This Week',
            description: `${recentClosedDeals} deal${recentClosedDeals !== 1 ? 's' : ''} closed this week${change !== 0 ? ` (${change > 0 ? '+' : ''}${change}% vs last week)` : ''}.`,
            action: { label: 'View Deals', route: '/sales/deals' },
            metric: `${recentClosedDeals} closed`
          });
        }
      }

      // Insight 6: Activity engagement
      if (recentActivitiesCount > 0) {
        insights.push({
          id: 'activity-engagement',
          type: 'info',
          icon: 'ph:activity-bold',
          title: 'Team Activity',
          description: `${recentActivitiesCount} deal activities logged this week. ${recentActivitiesCount > 20 ? 'Great engagement!' : 'Try to increase touchpoints for better outcomes.'}`,
          metric: `${recentActivitiesCount} activities`
        });
      }

      // Return top 4 most relevant insights
      wrapResult(res, {
        insights: insights.slice(0, 4),
        generatedAt: now.toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
};
