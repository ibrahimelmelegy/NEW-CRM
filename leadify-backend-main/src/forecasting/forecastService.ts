import { Op } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import ForecastPeriod from './forecastModel';
import Deal from '../deal/model/dealModel';
import { DealStageEnums } from '../deal/dealEnum';

interface ForecastQuery {
  userId?: string;
  period?: string;
  page?: number;
  limit?: number;
}

class ForecastService {
  async getForecasts(query: ForecastQuery) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { userId, period } = query;
    const where: Record<string, any> = {};

    if (userId) where.userId = userId;
    if (period) where.period = period;
    const { rows: docs, count: totalItems } = await ForecastPeriod.findAndCountAll({
      where,
      order: [['startDate', 'DESC']],
      limit,
      offset
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async getByPeriod(period: string, startDate: string, endDate: string) {
    return ForecastPeriod.findAll({
      where: {
        period,
        startDate: { [Op.gte]: new Date(startDate) },
        endDate: { [Op.lte]: new Date(endDate) }
      },
      order: [['startDate', 'ASC']]
    });
  }

  async getByUser(userId: string) {
    return ForecastPeriod.findAll({
      where: { userId },
      order: [['startDate', 'DESC']]
    });
  }

  async createForecast(data: any) {
    return ForecastPeriod.create(data);
  }

  async updateForecast(id: string, data: any) {
    const forecast = await ForecastPeriod.findByPk(id);
    if (!forecast) throw new Error('Forecast not found');
    return forecast.update(data);
  }

  async calculateFromPipeline(userId: string, period: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      }
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        throw new Error('Invalid period. Must be monthly, quarterly, or yearly');
    }

    // Fetch deals for the user within the period
    const deals = await Deal.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    // Filter deals associated with this user via the join table
    let closedWon = 0;
    let closedLost = 0;
    let pipeline = 0;

    for (const deal of deals) {
      const price = deal.price || 0;
      if (deal.stage === DealStageEnums.CLOSED || deal.stage === DealStageEnums.CONVERTED) {
        closedWon += price;
      } else if (deal.stage === DealStageEnums.CANCELLED) {
        closedLost += price;
      } else {
        pipeline += price;
      }
    }

    const actual = closedWon;
    const predicted = closedWon + pipeline * 0.5; // 50% weighted pipeline

    // Upsert the forecast for this period
    const [forecast] = await ForecastPeriod.findOrCreate({
      where: { userId, period, startDate },
      defaults: {
        userId,
        period,
        startDate,
        endDate,
        target: 0,
        predicted,
        actual,
        closedWon,
        closedLost,
        pipeline
      } as any
    });

    if (forecast.id) {
      await forecast.update({ predicted, actual, closedWon, closedLost, pipeline, endDate });
    }

    return forecast;
  }

  async getHistoricalComparison(period: string, startDate: string, endDate: string) {
    // Get current period data
    const current = await this.getByPeriod(period, startDate, endDate);

    // Calculate previous period dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();

    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start);

    // Get previous period data
    const previous = await this.getByPeriod(
      period,
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0]
    );

    // Calculate totals
    const currentTotals = current.reduce(
      (acc, f) => ({
        target: acc.target + (f.target || 0),
        actual: acc.actual + (f.actual || 0),
        pipeline: acc.pipeline + (f.pipeline || 0)
      }),
      { target: 0, actual: 0, pipeline: 0 }
    );

    const previousTotals = previous.reduce(
      (acc, f) => ({
        target: acc.target + (f.target || 0),
        actual: acc.actual + (f.actual || 0),
        pipeline: acc.pipeline + (f.pipeline || 0)
      }),
      { target: 0, actual: 0, pipeline: 0 }
    );

    // Calculate growth percentages
    const growth = {
      target: previousTotals.target ? ((currentTotals.target - previousTotals.target) / previousTotals.target) * 100 : 0,
      actual: previousTotals.actual ? ((currentTotals.actual - previousTotals.actual) / previousTotals.actual) * 100 : 0,
      pipeline: previousTotals.pipeline ? ((currentTotals.pipeline - previousTotals.pipeline) / previousTotals.pipeline) * 100 : 0
    };

    return {
      current: { data: current, totals: currentTotals },
      previous: { data: previous, totals: previousTotals },
      growth
    };
  }

  async getScenarioProjection(userId: string, winRateAdjustment: number, dealValueAdjustment: number) {
    // Get all open deals for the user
    const deals = await Deal.findAll({
      where: {
        stage: { [Op.notIn]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED, DealStageEnums.CONVERTED] }
      }
    });

    const baseWinRate = 0.5; // Default 50% win rate
    const adjustedWinRate = Math.max(0, Math.min(1, baseWinRate + winRateAdjustment / 100));

    let projectedRevenue = 0;
    for (const deal of deals) {
      const baseValue = deal.price || 0;
      const adjustedValue = baseValue * (1 + dealValueAdjustment / 100);
      projectedRevenue += adjustedValue * adjustedWinRate;
    }

    return {
      baseWinRate: baseWinRate * 100,
      adjustedWinRate: adjustedWinRate * 100,
      dealValueAdjustment,
      projectedRevenue,
      dealsInPipeline: deals.length
    };
  }

  async getTeamBreakdown(period: string, startDate: string, endDate: string) {
    const forecasts = await ForecastPeriod.findAll({
      where: {
        period,
        startDate: { [Op.gte]: new Date(startDate) },
        endDate: { [Op.lte]: new Date(endDate) }
      },
      order: [['userId', 'ASC']]
    });

    // Group by user
    const byUser: Record<string, any> = {};
    for (const f of forecasts) {
      const uid = f.userId;
      if (!byUser[uid]) {
        byUser[uid] = {
          userId: uid,
          target: 0,
          actual: 0,
          pipeline: 0,
          closedWon: 0,
          closedLost: 0
        };
      }
      byUser[uid].target += f.target || 0;
      byUser[uid].actual += f.actual || 0;
      byUser[uid].pipeline += f.pipeline || 0;
      byUser[uid].closedWon += f.closedWon || 0;
      byUser[uid].closedLost += f.closedLost || 0;
    }

    return Object.values(byUser);
  }
}

export default new ForecastService();
