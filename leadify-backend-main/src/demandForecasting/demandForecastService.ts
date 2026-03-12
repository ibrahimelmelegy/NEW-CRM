import { Op } from 'sequelize';
import DemandForecast from './forecastModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class DemandForecastService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: Record<string, unknown>, tenantId?: string, createdBy?: number) {
    const forecast = await DemandForecast.create({ ...data, tenantId, createdBy });
    try {
      io.emit('forecast:created', { id: forecast.id, product: forecast.product });
    } catch {}
    return forecast;
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.product) where.product = { [Op.iLike]: `%${query.product}%` };
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.search) where.product = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await DemandForecast.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return DemandForecast.findByPk(id);
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await DemandForecast.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try {
      io.emit('forecast:updated', { id: item.id });
    } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await DemandForecast.findByPk(id);
    if (!item) return false;
    await item.destroy();
    try {
      io.emit('forecast:deleted', { id });
    } catch {}
    return true;
  }

  // ─── Forecast Generation ──────────────────────────────────────────────────────

  /**
   * Generate a demand forecast using Simple Moving Average (SMA).
   * Takes historical demand data and produces a prediction for the next period.
   * Supports methods: MOVING_AVG, WEIGHTED_AVG, EXPONENTIAL.
   */
  async generateForecast(
    data: {
      product: string;
      historicalData: Array<{ period: string; demand: number }>;
      method?: 'MOVING_AVG' | 'WEIGHTED_AVG' | 'EXPONENTIAL';
      windowSize?: number;
      targetPeriod: string;
    },
    tenantId?: string,
    createdBy?: number
  ) {
    const { product, historicalData, targetPeriod } = data;
    const method = data.method || 'MOVING_AVG';
    const windowSize = data.windowSize || 3;

    if (!historicalData || historicalData.length === 0) {
      return { error: 'Historical data is required' };
    }

    // Sort by period ascending
    const sorted = [...historicalData].sort((a, b) => a.period.localeCompare(b.period));
    const demands = sorted.map(d => d.demand);

    const actualWindow = Math.min(windowSize, demands.length);
    if (actualWindow < 2) throw new Error('Not enough historical data for forecasting');

    let predictedDemand: number;
    let confidence: number;

    switch (method) {
      case 'MOVING_AVG': {
        // Simple Moving Average over last N periods
        const window = demands.slice(-actualWindow);
        predictedDemand = window.reduce((sum, v) => sum + v, 0) / window.length;
        // Confidence based on variance in the window
        const mean = predictedDemand;
        const variance = window.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / window.length;
        const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
        confidence = Math.max(0, Math.min(1, 1 - cv));
        break;
      }
      case 'WEIGHTED_AVG': {
        // Weighted moving average: more recent periods weigh more
        const window = demands.slice(-actualWindow);
        const totalWeight = (actualWindow * (actualWindow + 1)) / 2;
        predictedDemand = window.reduce((sum, v, i) => sum + v * (i + 1), 0) / totalWeight;
        confidence = Math.min(1, 0.6 + demands.length / 20);
        break;
      }
      case 'EXPONENTIAL': {
        // Simple exponential smoothing
        const alpha = 0.3;
        let forecast = demands[0];
        for (let i = 1; i < demands.length; i++) {
          forecast = alpha * demands[i] + (1 - alpha) * forecast;
        }
        predictedDemand = forecast;
        confidence = Math.min(1, 0.5 + demands.length / 30);
        break;
      }
      default:
        predictedDemand = demands[demands.length - 1];
        confidence = 0.5;
    }

    predictedDemand = parseFloat(predictedDemand.toFixed(2));
    confidence = parseFloat(confidence.toFixed(2));

    const forecast = await DemandForecast.create({
      product,
      period: targetPeriod,
      predictedDemand,
      confidence,
      method,
      windowSize: actualWindow,
      historicalData: sorted,
      tenantId,
      createdBy
    });

    try {
      io.emit('forecast:generated', { id: forecast.id, product, predictedDemand });
    } catch {}
    return forecast;
  }

  // ─── Accuracy Analysis ────────────────────────────────────────────────────────

  /** Compare predicted vs actual for confirmed forecasts to compute accuracy metrics */
  async getAccuracyReport(tenantId?: string) {
    const where: Record<string, any> = { status: 'CONFIRMED', actualDemand: { [Op.ne]: null } };
    if (tenantId) where.tenantId = tenantId;

    const forecasts = await DemandForecast.findAll({ where, raw: true });

    if (forecasts.length === 0) return { count: 0, mape: null, bias: null, forecasts: [] };

    let totalAbsError = 0;
    let totalBias = 0;

    const details = forecasts.map(f => {
      const error = f.actualDemand! - f.predictedDemand;
      const absPercError = f.actualDemand! > 0 ? Math.abs(error) / f.actualDemand! : 0;
      totalAbsError += absPercError;
      totalBias += error;
      return {
        id: f.id,
        product: f.product,
        period: f.period,
        predicted: f.predictedDemand,
        actual: f.actualDemand,
        error: parseFloat(error.toFixed(2)),
        absPercError: parseFloat((absPercError * 100).toFixed(1))
      };
    });

    return {
      count: forecasts.length,
      mape: parseFloat(((totalAbsError / forecasts.length) * 100).toFixed(1)),
      bias: parseFloat((totalBias / forecasts.length).toFixed(2)),
      forecasts: details
    };
  }
}

export default new DemandForecastService();
