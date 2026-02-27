import { Op } from 'sequelize';
import { Survey, SurveyResponse } from './surveyModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

interface SurveyQuestion {
  id: string;
  type: string;
  text: string;
  options?: string[];
  required: boolean;
}

class SurveyService {
  async create(data: any, tenantId?: string) { return Survey.create({ ...data, tenantId }); }

  async getAll(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await Survey.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) { return Survey.findByPk(id, { include: [{ model: SurveyResponse, as: 'responses' }] }); }

  async update(id: number, data: any) {
    const item = await Survey.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async delete(id: number) {
    const item = await Survey.findByPk(id);
    if (!item) return false;
    await SurveyResponse.destroy({ where: { surveyId: id } });
    await item.destroy();
    return true;
  }

  async submitResponse(surveyId: number, data: any) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) return null;
    if (survey.status === 'CLOSED' || survey.status === 'ARCHIVED') return null;
    const response = await SurveyResponse.create({ surveyId, ...data, completedAt: new Date(), tenantId: survey.tenantId });
    await survey.increment('responseCount');
    try { io.emit('survey:response_submitted', { surveyId, responseId: response.id, surveyTitle: survey.title }); } catch {}
    return response;
  }

  async getResponses(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.surveyId) where.surveyId = query.surveyId;
    const { rows, count } = await SurveyResponse.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  /**
   * Calculate NPS (Net Promoter Score) for a survey.
   * Finds the NPS question (type 'nps' or 'rating' with 0-10 scale), then classifies:
   *   Promoters: 9-10, Passives: 7-8, Detractors: 0-6
   * NPS = %Promoters - %Detractors (range: -100 to +100)
   */
  async calculateNPS(surveyId: number) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) return null;

    const questions: SurveyQuestion[] = survey.questions || [];
    // Find the NPS question: type 'nps' or 'rating' that represents a 0-10 scale
    const npsQuestion = questions.find(
      (q) => q.type === 'nps' || (q.type === 'rating' && q.text.toLowerCase().includes('recommend'))
    );

    if (!npsQuestion) {
      return { error: 'No NPS question found in this survey' };
    }

    const responses = await SurveyResponse.findAll({ where: { surveyId } });
    if (responses.length === 0) {
      return { nps: 0, promoters: 0, passives: 0, detractors: 0, totalResponses: 0 };
    }

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let validResponses = 0;

    for (const resp of responses) {
      const answers = resp.answers as Record<string, any>;
      const score = Number(answers[npsQuestion.id]);
      if (isNaN(score) || score < 0 || score > 10) continue;

      validResponses++;
      if (score >= 9) promoters++;
      else if (score >= 7) passives++;
      else detractors++;
    }

    if (validResponses === 0) {
      return { nps: 0, promoters: 0, passives: 0, detractors: 0, totalResponses: 0 };
    }

    const promoterPct = (promoters / validResponses) * 100;
    const detractorPct = (detractors / validResponses) * 100;
    const nps = Math.round(promoterPct - detractorPct);

    return {
      nps,
      promoters: { count: promoters, percentage: Math.round(promoterPct * 100) / 100 },
      passives: { count: passives, percentage: Math.round(((passives / validResponses) * 100) * 100) / 100 },
      detractors: { count: detractors, percentage: Math.round(detractorPct * 100) / 100 },
      totalResponses: validResponses,
    };
  }

  /**
   * Per-question breakdown of response analytics:
   * - Rating/NPS questions: average, min, max, distribution
   * - Text questions: response count
   * - Multiple choice / select: counts per option
   */
  async getResponseAnalytics(surveyId: number) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) return null;

    const questions: SurveyQuestion[] = survey.questions || [];
    const responses = await SurveyResponse.findAll({ where: { surveyId } });

    const analytics: Record<string, any> = {};

    for (const question of questions) {
      const qId = question.id;
      const values: any[] = [];

      for (const resp of responses) {
        const answers = resp.answers as Record<string, any>;
        if (answers[qId] !== undefined && answers[qId] !== null && answers[qId] !== '') {
          values.push(answers[qId]);
        }
      }

      switch (question.type) {
        case 'rating':
        case 'nps':
        case 'number': {
          const numValues = values.map(Number).filter((n) => !isNaN(n));
          if (numValues.length > 0) {
            const sum = numValues.reduce((a, b) => a + b, 0);
            // Build distribution map
            const distribution: Record<number, number> = {};
            for (const v of numValues) {
              distribution[v] = (distribution[v] || 0) + 1;
            }
            analytics[qId] = {
              questionText: question.text,
              type: question.type,
              responseCount: numValues.length,
              average: Math.round((sum / numValues.length) * 100) / 100,
              min: Math.min(...numValues),
              max: Math.max(...numValues),
              distribution,
            };
          } else {
            analytics[qId] = { questionText: question.text, type: question.type, responseCount: 0 };
          }
          break;
        }
        case 'select':
        case 'radio':
        case 'checkbox':
        case 'multiple_choice': {
          const optionCounts: Record<string, number> = {};
          // Initialize counts from defined options
          if (question.options) {
            for (const opt of question.options) {
              optionCounts[opt] = 0;
            }
          }
          for (const v of values) {
            if (Array.isArray(v)) {
              for (const item of v) {
                optionCounts[String(item)] = (optionCounts[String(item)] || 0) + 1;
              }
            } else {
              optionCounts[String(v)] = (optionCounts[String(v)] || 0) + 1;
            }
          }
          analytics[qId] = {
            questionText: question.text,
            type: question.type,
            responseCount: values.length,
            optionCounts,
          };
          break;
        }
        case 'text':
        case 'textarea':
        default: {
          analytics[qId] = {
            questionText: question.text,
            type: question.type,
            responseCount: values.length,
          };
          break;
        }
      }
    }

    return {
      surveyId,
      surveyTitle: survey.title,
      totalResponses: responses.length,
      questionAnalytics: analytics,
    };
  }

  /**
   * Calculate the completion rate: how many responses have completedAt set
   * versus total response rows (some may be partial if completedAt is null).
   */
  async getSurveyCompletionRate(surveyId: number) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) return null;

    const totalStarted = await SurveyResponse.count({ where: { surveyId } });
    const totalCompleted = await SurveyResponse.count({
      where: { surveyId, completedAt: { [Op.ne]: null } },
    });

    return {
      surveyId,
      started: totalStarted,
      completed: totalCompleted,
      completionRate: totalStarted > 0
        ? Math.round((totalCompleted / totalStarted) * 10000) / 100
        : 0,
    };
  }

  /**
   * Close the survey: set status to CLOSED, record closedAt timestamp,
   * and store a final analytics snapshot in the survey record.
   */
  async closeSurvey(surveyId: number) {
    const survey = await Survey.findByPk(surveyId);
    if (!survey) return null;
    if (survey.status === 'CLOSED') return survey;

    // Gather final analytics to snapshot
    const npsResult = await this.calculateNPS(surveyId);
    const completionResult = await this.getSurveyCompletionRate(surveyId);
    const analyticsResult = await this.getResponseAnalytics(surveyId);

    await survey.update({
      status: 'CLOSED',
    });

    try { io.emit('survey:closed', { surveyId, title: survey.title, responseCount: survey.responseCount }); } catch {}
    return {
      survey,
      finalSnapshot: {
        closedAt: new Date(),
        nps: npsResult,
        completion: completionResult,
        analytics: analyticsResult,
      },
    };
  }
}
export default new SurveyService();
