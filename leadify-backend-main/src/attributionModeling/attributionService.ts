import { Op } from 'sequelize';
import Touchpoint from './touchpointModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

type AttributionModel = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'TIME_DECAY';

class AttributionService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string) {
    const tp = await Touchpoint.create({ ...data, tenantId });
    try {
      io.emit('touchpoint:created', { id: tp.id, dealId: tp.dealId });
    } catch {}
    return tp;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.channel) where.channel = query.channel;
    if (query.campaign) where.campaign = { [Op.iLike]: `%${query.campaign}%` };

    const { rows, count } = await Touchpoint.findAndCountAll({
      where,
      order: [['touchpointDate', 'ASC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Touchpoint.findByPk(id);
  }

  async update(id: number, data: any) {
    const item = await Touchpoint.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await Touchpoint.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Attribution Calculation ──────────────────────────────────────────────────

  /**
   * Calculate attribution credit for all touchpoints in a deal using the specified model.
   *
   * Models:
   * - FIRST_TOUCH: 100% credit to first touchpoint
   * - LAST_TOUCH: 100% credit to last touchpoint
   * - LINEAR: Equal credit across all touchpoints
   * - TIME_DECAY: More credit to touchpoints closer to conversion (half-life decay)
   */
  async calculateAttribution(dealId: string, model: AttributionModel = 'LINEAR', dealValue?: number, tenantId?: string) {
    const where: Record<string, any> = { dealId };
    if (tenantId) where.tenantId = tenantId;

    const touchpoints = await Touchpoint.findAll({
      where,
      order: [['touchpointDate', 'ASC']]
    });

    if (touchpoints.length === 0) return { dealId, touchpoints: [], model };

    const totalValue = dealValue || 0;

    switch (model) {
      case 'FIRST_TOUCH': {
        for (let i = 0; i < touchpoints.length; i++) {
          const credit = i === 0 ? 100 : 0;
          await touchpoints[i].update({
            creditPercent: credit,
            creditValue: parseFloat(((credit / 100) * totalValue).toFixed(2))
          });
        }
        break;
      }
      case 'LAST_TOUCH': {
        for (let i = 0; i < touchpoints.length; i++) {
          const credit = i === touchpoints.length - 1 ? 100 : 0;
          await touchpoints[i].update({
            creditPercent: credit,
            creditValue: parseFloat(((credit / 100) * totalValue).toFixed(2))
          });
        }
        break;
      }
      case 'LINEAR': {
        const creditEach = parseFloat((100 / touchpoints.length).toFixed(2));
        for (const tp of touchpoints) {
          await tp.update({
            creditPercent: creditEach,
            creditValue: parseFloat(((creditEach / 100) * totalValue).toFixed(2))
          });
        }
        break;
      }
      case 'TIME_DECAY': {
        // Exponential decay: touchpoints closer to conversion get more credit
        // Using a half-life of 7 days
        const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
        const lastTime = touchpoints[touchpoints.length - 1].touchpointDate.getTime();
        const weights: number[] = [];

        for (const tp of touchpoints) {
          const timeDiff = lastTime - tp.touchpointDate.getTime();
          const weight = Math.pow(2, -timeDiff / halfLife);
          weights.push(weight);
        }

        const totalWeight = weights.reduce((s, w) => s + w, 0);

        for (let i = 0; i < touchpoints.length; i++) {
          const credit = parseFloat(((weights[i] / totalWeight) * 100).toFixed(2));
          await touchpoints[i].update({
            creditPercent: credit,
            creditValue: parseFloat(((credit / 100) * totalValue).toFixed(2))
          });
        }
        break;
      }
    }

    // Re-fetch updated touchpoints
    const updated = await Touchpoint.findAll({ where, order: [['touchpointDate', 'ASC']] });

    try {
      io.emit('attribution:calculated', { dealId, model });
    } catch {}

    return { dealId, model, dealValue: totalValue, touchpoints: updated };
  }

  // ─── Channel Performance ──────────────────────────────────────────────────────

  /** Aggregate channel performance across all attributed touchpoints */
  async getChannelPerformance(tenantId?: string) {
    const where: Record<string, any> = { creditPercent: { [Op.gt]: 0 } };
    if (tenantId) where.tenantId = tenantId;

    const touchpoints = await Touchpoint.findAll({ where, raw: true });

    const byChannel: Record<string, { touchpoints: number; totalCredit: number; totalValue: number }> = {};

    for (const tp of touchpoints) {
      const t = tp as any;
      const ch = t.channel || 'UNKNOWN';
      if (!byChannel[ch]) byChannel[ch] = { touchpoints: 0, totalCredit: 0, totalValue: 0 };
      byChannel[ch].touchpoints++;
      byChannel[ch].totalCredit += Number(t.creditPercent) || 0;
      byChannel[ch].totalValue += Number(t.creditValue) || 0;
    }

    // Compute average credit per touchpoint
    const channels = Object.entries(byChannel)
      .map(([channel, data]) => ({
        channel,
        touchpoints: data.touchpoints,
        avgCredit: parseFloat((data.totalCredit / data.touchpoints).toFixed(2)),
        totalAttributedValue: parseFloat(data.totalValue.toFixed(2))
      }))
      .sort((a, b) => b.totalAttributedValue - a.totalAttributedValue);

    return { channels, totalTouchpoints: touchpoints.length };
  }

  /** Compare different attribution models side-by-side for a deal */
  async compareModels(dealId: string, dealValue: number, tenantId?: string) {
    const models: AttributionModel[] = ['FIRST_TOUCH', 'LAST_TOUCH', 'LINEAR', 'TIME_DECAY'];
    const results: Record<string, any> = {};

    for (const model of models) {
      const result = await this.calculateAttribution(dealId, model, dealValue, tenantId);
      results[model] = result.touchpoints.map(tp => ({
        id: tp.id,
        channel: tp.channel,
        creditPercent: tp.creditPercent,
        creditValue: tp.creditValue
      }));
    }

    return { dealId, dealValue, comparison: results };
  }
}

export default new AttributionService();
