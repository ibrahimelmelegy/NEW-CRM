import { Op } from 'sequelize';
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
    const { userId, period, page = 1, limit = 20 } = query;
    const where: any = {};

    if (userId) where.userId = userId;
    if (period) where.period = period;

    const offset = (page - 1) * limit;
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
}

export default new ForecastService();
