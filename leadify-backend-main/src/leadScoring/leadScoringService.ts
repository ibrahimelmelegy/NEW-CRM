import { LeadScoringRule, EntityScore, ScoringCriterion, ScoreGrade } from './leadScoringModel';
import Lead from '../lead/leadModel';
import Client from '../client/clientModel';
import Opportunity from '../opportunity/opportunityModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';

// Map entity types to their Sequelize models
const entityModelMap: Record<string, any> = {
  lead: Lead,
  client: Client,
  opportunity: Opportunity
};

class LeadScoringService {
  // ---- Rule CRUD ----

  async createRule(data: Record<string, unknown>, userId: number) {
    return LeadScoringRule.create({ ...data, createdBy: userId });
  }

  async updateRule(id: number, data: Record<string, unknown>) {
    const rule = await LeadScoringRule.findByPk(id);
    if (!rule) throw new Error('Scoring rule not found');
    return rule.update(data);
  }

  async deleteRule(id: number) {
    const rule = await LeadScoringRule.findByPk(id);
    if (!rule) throw new Error('Scoring rule not found');
    await rule.destroy();
    return { deleted: true };
  }

  async getRules(query: Record<string, unknown>) {
    const { page, limit, offset } = clampPagination(query, 30);
    const { entityType, isActive, sortBy = 'createdAt', sort = 'DESC' } = query;
    const where: Record<string, any> = {};
    if (entityType) where.entityType = entityType;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const { rows, count } = await LeadScoringRule.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [[sortBy, sort]],
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

  // ---- Score Calculation ----

  async calculateScore(entityType: string, entityId: string) {
    const Model = entityModelMap[entityType];
    if (!Model) throw new Error(`Unsupported entity type: ${entityType}`);

    const entity = await Model.findByPk(entityId);
    if (!entity) throw new Error(`${entityType} not found with id ${entityId}`);

    const rules = await LeadScoringRule.findAll({
      where: { entityType, isActive: true }
    });

    let totalScore = 0;
    const breakdown: Array<{ ruleId: number; ruleName: string; points: number; matchedCriteria: string[] }> = [];

    for (const rule of rules) {
      const criteria = rule.criteria as ScoringCriterion[];
      let rulePoints = 0;
      const matchedCriteria: string[] = [];

      for (const criterion of criteria) {
        const points = this.evaluateCriteria(entity.toJSON(), criterion);
        if (points > 0) {
          rulePoints += points;
          matchedCriteria.push(`${criterion.field} ${criterion.operator} ${JSON.stringify(criterion.value)}`);
        }
      }

      if (rulePoints > 0) {
        totalScore += rulePoints;
        breakdown.push({
          ruleId: rule.id,
          ruleName: rule.name,
          points: rulePoints,
          matchedCriteria
        });
      }
    }

    const grade = this.calculateGrade(totalScore);
    const calculatedAt = new Date();

    const [score] = await EntityScore.upsert({
      entityType,
      entityId,
      score: totalScore,
      grade,
      breakdown,
      calculatedAt
    });

    return score;
  }

  async bulkCalculateScores(entityType: string) {
    const Model = entityModelMap[entityType];
    if (!Model) throw new Error(`Unsupported entity type: ${entityType}`);

    const entities = await Model.findAll({ attributes: ['id'] });
    const results: Array<{ entityId: string; score: number; grade: string }> = [];

    for (const entity of entities) {
      const score = await this.calculateScore(entityType, entity.id);
      results.push({
        entityId: entity.id,
        score: score.score,
        grade: score.grade
      });
    }

    return {
      entityType,
      processed: results.length,
      results
    };
  }

  async getScore(entityType: string, entityId: string) {
    const score = await EntityScore.findOne({
      where: { entityType, entityId }
    });
    if (!score) {
      return { entityType, entityId, score: 0, grade: ScoreGrade.F, breakdown: [], calculatedAt: null };
    }
    return score;
  }

  async getTopScored(entityType: string, limit: number = 20) {
    return EntityScore.findAll({
      where: { entityType },
      order: [['score', 'DESC']],
      limit: Number(limit)
    });
  }

  getGradeThresholds() {
    return {
      A: { min: 80, label: 'Hot' },
      B: { min: 60, label: 'Warm' },
      C: { min: 40, label: 'Moderate' },
      D: { min: 20, label: 'Cool' },
      F: { min: 0, label: 'Cold' }
    };
  }

  // ---- Criteria Evaluation ----

  evaluateCriteria(entity: Record<string, any>, criterion: ScoringCriterion): number {
    const { field, operator, value, points } = criterion;
    const fieldValue = entity[field];

    switch (operator) {
      case 'equals':
        if (fieldValue !== undefined && fieldValue !== null && String(fieldValue).toLowerCase() === String(value).toLowerCase()) {
          return points;
        }
        return 0;

      case 'not_equals':
        if (fieldValue === undefined || fieldValue === null || String(fieldValue).toLowerCase() !== String(value).toLowerCase()) {
          return points;
        }
        return 0;

      case 'in':
        if (Array.isArray(value) && fieldValue !== undefined && fieldValue !== null) {
          const lowerValues = value.map(v => String(v).toLowerCase());
          if (lowerValues.includes(String(fieldValue).toLowerCase())) {
            return points;
          }
        }
        return 0;

      case 'not_in':
        if (Array.isArray(value)) {
          if (fieldValue === undefined || fieldValue === null) return points;
          const lowerValues = value.map(v => String(v).toLowerCase());
          if (!lowerValues.includes(String(fieldValue).toLowerCase())) {
            return points;
          }
        }
        return 0;

      case 'contains':
        if (fieldValue !== undefined && fieldValue !== null && String(fieldValue).toLowerCase().includes(String(value).toLowerCase())) {
          return points;
        }
        return 0;

      case 'is_empty':
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          return points;
        }
        return 0;

      case 'is_not_empty':
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          return points;
        }
        return 0;

      case 'greater_than':
        if (fieldValue !== undefined && fieldValue !== null && Number(fieldValue) > Number(value)) {
          return points;
        }
        return 0;

      case 'less_than':
        if (fieldValue !== undefined && fieldValue !== null && Number(fieldValue) < Number(value)) {
          return points;
        }
        return 0;

      case 'between': {
        if (Array.isArray(value) && value.length === 2 && fieldValue !== undefined && fieldValue !== null) {
          const num = Number(fieldValue);
          let [low, high] = [Number(value[0]), Number(value[1])];
          if (low > high) [low, high] = [high, low];
          if (num >= low && num <= high) {
            return points;
          }
        }
        return 0;
      }

      default:
        return 0;
    }
  }

  // ---- Grade Calculation ----

  private calculateGrade(score: number): ScoreGrade {
    if (score >= 80) return ScoreGrade.A;
    if (score >= 60) return ScoreGrade.B;
    if (score >= 40) return ScoreGrade.C;
    if (score >= 20) return ScoreGrade.D;
    return ScoreGrade.F;
  }
}

export default new LeadScoringService();
