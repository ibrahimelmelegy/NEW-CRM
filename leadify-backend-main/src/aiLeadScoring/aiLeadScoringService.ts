import { Op } from 'sequelize';
import ScoringModelConfig from './scoringModelConfig';
import Lead from '../lead/leadModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class AiLeadScoringService {
  // ─── Model Config CRUD ────────────────────────────────────────────────────────

  async create(data: any, tenantId?: string, createdBy?: number) {
    const model = await ScoringModelConfig.create({ ...data, tenantId, createdBy });
    try {
      io.emit('scoringModel:created', { id: model.id, name: model.name });
    } catch {}
    return model;
  }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    try {
      const { rows, count } = await ScoringModelConfig.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });
      return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
    } catch {
      return { docs: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
    }
  }

  async getById(id: number) {
    return ScoringModelConfig.findByPk(id);
  }

  async update(id: number, data: any) {
    const item = await ScoringModelConfig.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try {
      io.emit('scoringModel:updated', { id: item.id });
    } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await ScoringModelConfig.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Lead Scoring Engine ──────────────────────────────────────────────────────

  /**
   * Score leads using a specific model's rule-based parameters.
   * Each parameter defines: feature (lead field), condition, value, weight, and points.
   * The engine evaluates each rule against each lead and produces a weighted score (0-100).
   */
  async scoreLeads(modelId: number, leadIds?: string[], tenantId?: string) {
    const model = await ScoringModelConfig.findByPk(modelId);
    if (!model) return null;

    const parameters = model.parameters || [];
    if (parameters.length === 0) return { modelId, scored: 0, results: [], error: 'No scoring parameters defined' };

    // Fetch leads to score
    const leadWhere: Record<string, any> = {};
    if (leadIds && leadIds.length > 0) leadWhere.id = { [Op.in]: leadIds };
    if (tenantId) leadWhere.tenantId = tenantId;

    const leads = await Lead.findAll({ where: leadWhere, raw: true });

    const maxPossibleScore = parameters.reduce((sum, p) => sum + Math.abs(p.points), 0);
    const results: Array<{ leadId: string; leadName: string; score: number; matchedRules: string[] }> = [];

    for (const lead of leads) {
      const l = lead as any;
      let rawScore = 0;
      const matchedRules: string[] = [];

      for (const param of parameters) {
        const fieldValue = l[param.feature];
        let matched = false;

        switch (param.condition) {
          case 'exists':
            matched = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
            break;
          case 'equals':
            matched = fieldValue === param.value;
            break;
          case 'not_equals':
            matched = fieldValue !== param.value;
            break;
          case 'contains':
            matched = typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(String(param.value).toLowerCase());
            break;
          case 'greater_than':
            matched = typeof fieldValue === 'number' && fieldValue > Number(param.value);
            break;
          case 'less_than':
            matched = typeof fieldValue === 'number' && fieldValue < Number(param.value);
            break;
          case 'in':
            matched = Array.isArray(param.value) && param.value.includes(fieldValue);
            break;
          case 'days_since_less_than':
            if (fieldValue) {
              const days = Math.floor((Date.now() - new Date(fieldValue).getTime()) / (1000 * 60 * 60 * 24));
              matched = days < Number(param.value);
            }
            break;
          default:
            break;
        }

        if (matched) {
          rawScore += param.points * (param.weight || 1);
          matchedRules.push(`${param.feature} ${param.condition} ${param.value || ''}`);
        }
      }

      // Normalise to 0-100
      const normalisedScore = maxPossibleScore > 0 ? Math.max(0, Math.min(100, Math.round((rawScore / maxPossibleScore) * 100))) : 0;

      results.push({
        leadId: l.id,
        leadName: l.name,
        score: normalisedScore,
        matchedRules
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Update the model's leadsScored count
    await model.update({ leadsScored: (model.leadsScored || 0) + results.length });

    try {
      io.emit('scoringModel:leadsScored', { modelId, count: results.length });
    } catch {}

    return {
      modelId,
      modelName: model.name,
      scored: results.length,
      results
    };
  }

  // ─── Feature Importance ───────────────────────────────────────────────────────

  /**
   * Calculate feature importance for a model based on how often each feature's rule matches.
   * This is a simplified importance analysis based on rule coverage.
   */
  async getFeatureImportance(modelId: number, tenantId?: string) {
    const model = await ScoringModelConfig.findByPk(modelId);
    if (!model) return null;

    const parameters = model.parameters || [];
    if (parameters.length === 0) return { modelId, features: [] };

    // Fetch sample leads to test rules against
    const leadWhere: Record<string, any> = {};
    if (tenantId) leadWhere.tenantId = tenantId;

    const leads = await Lead.findAll({ where: leadWhere, limit: 100, raw: true });
    if (leads.length === 0) return { modelId, features: [], sampleSize: 0 };

    const featureStats: Record<string, { matchCount: number; totalPoints: number; weight: number }> = {};

    for (const param of parameters) {
      if (!featureStats[param.feature]) {
        featureStats[param.feature] = { matchCount: 0, totalPoints: 0, weight: param.weight || 1 };
      }

      for (const lead of leads) {
        const l = lead as any;
        const fieldValue = l[param.feature];
        let matched = false;

        switch (param.condition) {
          case 'exists':
            matched = !!fieldValue;
            break;
          case 'equals':
            matched = fieldValue === param.value;
            break;
          case 'greater_than':
            matched = typeof fieldValue === 'number' && fieldValue > Number(param.value);
            break;
          default:
            break;
        }

        if (matched) featureStats[param.feature].matchCount++;
      }

      featureStats[param.feature].totalPoints += Math.abs(param.points);
    }

    // Calculate importance as combination of coverage and point weight
    const features = Object.entries(featureStats)
      .map(([feature, stats]) => {
        const coverage = leads.length > 0 ? stats.matchCount / leads.length : 0;
        const importance = parseFloat((coverage * stats.totalPoints * stats.weight).toFixed(2));
        return {
          feature,
          coverage: parseFloat((coverage * 100).toFixed(1)),
          totalPoints: stats.totalPoints,
          weight: stats.weight,
          importance
        };
      })
      .sort((a, b) => b.importance - a.importance);

    // Normalise importance to 0-100
    const maxImportance = features.length > 0 ? features[0].importance : 1;
    for (const f of features) {
      f.importance = maxImportance > 0 ? parseFloat(((f.importance / maxImportance) * 100).toFixed(1)) : 0;
    }

    // Save feature importance to model
    const importanceMap: Record<string, number> = {};
    for (const f of features) importanceMap[f.feature] = f.importance;
    await model.update({ featureImportance: importanceMap });

    return { modelId, modelName: model.name, sampleSize: leads.length, features };
  }

  // ─── Model Comparison ─────────────────────────────────────────────────────────

  /** Compare accuracy and coverage of multiple scoring models side-by-side */
  async compareModels(modelIds: number[], _tenantId?: string) {
    const models = await ScoringModelConfig.findAll({
      where: { id: { [Op.in]: modelIds } },
      raw: true
    });

    const comparison = models.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      status: m.status,
      accuracy: m.accuracy,
      leadsScored: m.leadsScored || 0,
      parameterCount: (m.parameters || []).length,
      features: (m.parameters || []).map(p => p.feature).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
      lastTrainedAt: m.lastTrainedAt
    }));

    return { models: comparison, count: comparison.length };
  }
}

export default new AiLeadScoringService();
