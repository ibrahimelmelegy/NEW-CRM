import { Op, fn, col } from 'sequelize';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Lead from '../lead/leadModel';
import User from '../user/userModel';
import Invoice from '../deal/model/invoiceMode';
import { DealActivity } from '../activity-logs/model/dealActivities';
import { DealStageEnums } from '../deal/dealEnum';

export interface ScoreFactor {
  factor: string;
  impact: 'positive' | 'negative';
  description: string;
  weight: number;
}

export interface DealScore {
  dealId: string;
  dealName: string;
  winProbability: number;
  score: 'A' | 'B' | 'C' | 'D';
  factors: ScoreFactor[];
  suggestions: string[];
  scoredAt: string;
}

class DealScoringService {
  async scoreDeal(dealId: string): Promise<DealScore> {
    const deal = await Deal.findByPk(dealId, {
      include: [
        { model: User, as: 'users' },
        { model: Client, as: 'client' },
        { model: Lead, as: 'lead' },
        { model: Invoice, as: 'invoice' }
      ]
    });

    if (!deal) throw new Error('Deal not found');

    const factors: ScoreFactor[] = [];
    const suggestions: string[] = [];
    let totalScore = 50; // Base score

    // ===== Factor 1: Deal Age =====
    const now = new Date();
    const dealAge = Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const avgAge = await this.getAvgDealAge();

    if (dealAge <= avgAge * 0.7) {
      factors.push({
        factor: 'Deal Age',
        impact: 'positive',
        description: `Deal is ${dealAge} days old, younger than average (${Math.round(avgAge)} days)`,
        weight: 8
      });
      totalScore += 8;
    } else if (dealAge > avgAge * 1.5) {
      factors.push({
        factor: 'Deal Age',
        impact: 'negative',
        description: `Deal has been open ${dealAge} days, significantly longer than average (${Math.round(avgAge)} days)`,
        weight: -12
      });
      totalScore -= 12;
      suggestions.push('This deal is aging. Consider scheduling an urgent follow-up or re-evaluating the opportunity.');
    } else if (dealAge > avgAge) {
      factors.push({
        factor: 'Deal Age',
        impact: 'negative',
        description: `Deal is ${dealAge} days old, above average (${Math.round(avgAge)} days)`,
        weight: -5
      });
      totalScore -= 5;
    } else {
      factors.push({
        factor: 'Deal Age',
        impact: 'positive',
        description: `Deal age (${dealAge} days) is within normal range`,
        weight: 3
      });
      totalScore += 3;
    }

    // ===== Factor 2: Deal Price vs Average =====
    const avgPrice = await this.getAvgDealPrice();
    const price = deal.price || 0;

    if (price > 0 && price <= avgPrice * 1.5) {
      factors.push({
        factor: 'Deal Value',
        impact: 'positive',
        description: `Deal value ($${price.toLocaleString()}) is within the achievable range (avg: $${Math.round(avgPrice).toLocaleString()})`,
        weight: 7
      });
      totalScore += 7;
    } else if (price > avgPrice * 3) {
      factors.push({
        factor: 'Deal Value',
        impact: 'negative',
        description: `Deal value ($${price.toLocaleString()}) is significantly higher than average ($${Math.round(avgPrice).toLocaleString()}), which may require more effort to close`,
        weight: -8
      });
      totalScore -= 8;
      suggestions.push('High-value deals often need executive sponsorship. Consider involving senior leadership.');
    } else if (price > avgPrice * 1.5) {
      factors.push({
        factor: 'Deal Value',
        impact: 'negative',
        description: `Deal value ($${price.toLocaleString()}) is above average ($${Math.round(avgPrice).toLocaleString()})`,
        weight: -3
      });
      totalScore -= 3;
    }

    // ===== Factor 3: Stage Progression Speed =====
    const activities = await DealActivity.findAll({
      where: { dealId },
      order: [['createdAt', 'DESC']]
    });

    const activityCount = activities.length;
    const lastActivity = activities[0]?.createdAt ? new Date(activities[0].createdAt) : null;
    const daysSinceActivity = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    if (daysSinceActivity <= 3) {
      factors.push({
        factor: 'Recent Activity',
        impact: 'positive',
        description: `Deal had activity ${daysSinceActivity === 0 ? 'today' : daysSinceActivity + ' day(s) ago'} - showing active engagement`,
        weight: 10
      });
      totalScore += 10;
    } else if (daysSinceActivity <= 7) {
      factors.push({
        factor: 'Recent Activity',
        impact: 'positive',
        description: `Last activity ${daysSinceActivity} days ago - reasonable cadence`,
        weight: 5
      });
      totalScore += 5;
    } else if (daysSinceActivity > 14) {
      factors.push({
        factor: 'Recent Activity',
        impact: 'negative',
        description: `No activity for ${daysSinceActivity} days - deal may be stalling`,
        weight: -15
      });
      totalScore -= 15;
      suggestions.push(`No activity in ${daysSinceActivity} days. Reach out immediately to re-engage the prospect.`);
    } else {
      factors.push({
        factor: 'Recent Activity',
        impact: 'negative',
        description: `Last activity ${daysSinceActivity} days ago - consider increasing engagement`,
        weight: -5
      });
      totalScore -= 5;
      suggestions.push('Activity cadence is slowing. Schedule a check-in call or send an update email.');
    }

    // ===== Factor 4: Activity Volume =====
    if (activityCount >= 15) {
      factors.push({
        factor: 'Engagement Level',
        impact: 'positive',
        description: `High engagement with ${activityCount} logged activities`,
        weight: 10
      });
      totalScore += 10;
    } else if (activityCount >= 8) {
      factors.push({
        factor: 'Engagement Level',
        impact: 'positive',
        description: `Good engagement with ${activityCount} logged activities`,
        weight: 6
      });
      totalScore += 6;
    } else if (activityCount >= 3) {
      factors.push({
        factor: 'Engagement Level',
        impact: 'positive',
        description: `Moderate engagement with ${activityCount} activities`,
        weight: 2
      });
      totalScore += 2;
    } else {
      factors.push({
        factor: 'Engagement Level',
        impact: 'negative',
        description: `Low engagement - only ${activityCount} activities logged`,
        weight: -8
      });
      totalScore -= 8;
      suggestions.push('Increase touchpoints with the prospect. Log calls, meetings, and emails to build the relationship.');
    }

    // ===== Factor 5: Client History =====
    if (deal.clientId) {
      const previousDeals = await Deal.count({
        where: {
          clientId: deal.clientId,
          stage: DealStageEnums.CLOSED,
          id: { [Op.ne]: dealId }
        }
      });

      if (previousDeals > 0) {
        factors.push({
          factor: 'Client History',
          impact: 'positive',
          description: `Client has ${previousDeals} previous closed deal(s) - established relationship`,
          weight: 12
        });
        totalScore += 12;
      } else {
        // Check for cancelled deals
        const cancelledDeals = await Deal.count({
          where: {
            clientId: deal.clientId,
            stage: DealStageEnums.CANCELLED,
            id: { [Op.ne]: dealId }
          }
        });

        if (cancelledDeals > 0) {
          factors.push({
            factor: 'Client History',
            impact: 'negative',
            description: `Client has ${cancelledDeals} previously cancelled deal(s)`,
            weight: -10
          });
          totalScore -= 10;
          suggestions.push('This client has cancelled deals before. Address any previous concerns proactively.');
        }
      }
    }

    // ===== Factor 6: Assigned User Win Rate =====
    if (deal.users && deal.users.length > 0) {
      const userId = deal.users[0].id;
      const userWinRate = await this.getUserWinRate(userId);

      if (userWinRate !== null) {
        if (userWinRate >= 60) {
          factors.push({
            factor: 'Rep Performance',
            impact: 'positive',
            description: `Assigned rep has a ${userWinRate}% win rate - strong closer`,
            weight: 8
          });
          totalScore += 8;
        } else if (userWinRate >= 40) {
          factors.push({
            factor: 'Rep Performance',
            impact: 'positive',
            description: `Assigned rep has a ${userWinRate}% win rate`,
            weight: 3
          });
          totalScore += 3;
        } else {
          factors.push({
            factor: 'Rep Performance',
            impact: 'negative',
            description: `Assigned rep has a ${userWinRate}% win rate - may need support`,
            weight: -5
          });
          totalScore -= 5;
          suggestions.push('Consider pairing this rep with a senior team member for coaching on this deal.');
        }
      }
    }

    // ===== Factor 7: Deal Stage =====
    if (deal.stage === DealStageEnums.PROGRESS) {
      factors.push({
        factor: 'Deal Stage',
        impact: 'positive',
        description: 'Deal is actively in progress',
        weight: 5
      });
      totalScore += 5;
    } else if (deal.stage === DealStageEnums.CLOSED) {
      totalScore = 100;
      factors.push({
        factor: 'Deal Stage',
        impact: 'positive',
        description: 'Deal is already closed/won',
        weight: 50
      });
    } else if (deal.stage === DealStageEnums.CANCELLED) {
      totalScore = 0;
      factors.push({
        factor: 'Deal Stage',
        impact: 'negative',
        description: 'Deal has been cancelled',
        weight: -50
      });
    }

    // ===== Factor 8: Invoice/Payment Progress =====
    const invoices = deal.invoice || [];
    if (invoices.length > 0) {
      const collectedCount = invoices.filter((inv: any) => inv.collected).length;
      if (collectedCount > 0) {
        factors.push({
          factor: 'Payment Progress',
          impact: 'positive',
          description: `${collectedCount} of ${invoices.length} invoices collected`,
          weight: 8
        });
        totalScore += 8;
      } else {
        factors.push({
          factor: 'Payment Progress',
          impact: 'negative',
          description: `${invoices.length} invoice(s) issued but none collected yet`,
          weight: -3
        });
        totalScore -= 3;
      }
    }

    // ===== Factor 9: Has Signature Date =====
    if (deal.signatureDate) {
      factors.push({
        factor: 'Contract Signed',
        impact: 'positive',
        description: 'Contract has a signature date set',
        weight: 10
      });
      totalScore += 10;
    }

    // ===== Generate AI-enhanced suggestions =====
    const aiSuggestions = await this.getAISuggestions(deal, factors, totalScore);
    if (aiSuggestions.length > 0) {
      suggestions.push(...aiSuggestions);
    }

    // Ensure score is within bounds
    const winProbability = Math.max(5, Math.min(95, totalScore));

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D';
    if (winProbability >= 75) grade = 'A';
    else if (winProbability >= 55) grade = 'B';
    else if (winProbability >= 35) grade = 'C';
    else grade = 'D';

    // Add general suggestions if none exist
    if (suggestions.length === 0) {
      if (grade === 'A') {
        suggestions.push('Deal is looking strong. Maintain momentum and push for close.');
      } else if (grade === 'B') {
        suggestions.push('Good progress. Focus on addressing any remaining concerns to move to close.');
      }
    }

    // Sort factors by absolute weight
    factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

    return {
      dealId: deal.id,
      dealName: deal.name,
      winProbability,
      score: grade,
      factors,
      suggestions: [...new Set(suggestions)], // Deduplicate
      scoredAt: new Date().toISOString()
    };
  }

  private async getAISuggestions(deal: any, factors: ScoreFactor[], score: number): Promise<string[]> {
    try {
      const OpenAI = require('openai').default;
      const Integration = require('../integration/integrationModel').default;

      const integration = await Integration.findOne({ where: { provider: 'openai', isActive: true } });
      let apiKey = process.env.OPENAI_API_KEY;

      if (integration?.config?.apiKey) {
        try {
          const { decrypt } = require('../utils/encryption');
          apiKey = decrypt(integration.config.apiKey);
        } catch {
          apiKey = integration.config.apiKey;
        }
      }

      if (!apiKey) return [];

      const client = new OpenAI({ apiKey });

      const dealSummary = {
        name: deal.name,
        price: deal.price,
        stage: deal.stage,
        age: Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        clientName: deal.client?.clientName,
        score
      };

      const negativeFactors = factors.filter(f => f.impact === 'negative').map(f => f.description);

      if (negativeFactors.length === 0) return [];

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a sales coach. Given deal data and risk factors, provide 1-2 specific, actionable suggestions to improve the deal outcome. Be concise - each suggestion should be one sentence. Return as JSON array of strings.'
          },
          {
            role: 'user',
            content: `Deal: ${JSON.stringify(dealSummary)}\nRisk factors: ${JSON.stringify(negativeFactors)}`
          }
        ],
        model: 'gpt-4o',
        temperature: 0.4,
        max_tokens: 200
      });

      const response = completion.choices[0].message.content?.trim();
      if (!response) return [];

      try {
        let cleaned = response;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  }

  private async getAvgDealAge(): Promise<number> {
    const deals = await Deal.findAll({
      where: { stage: DealStageEnums.PROGRESS },
      attributes: ['createdAt']
    });
    if (deals.length === 0) return 30;

    const now = new Date();
    const totalAge = deals.reduce((sum, d) => sum + Math.floor((now.getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)), 0);
    return totalAge / deals.length;
  }

  private async getAvgDealPrice(): Promise<number> {
    const result: any = await Deal.findOne({
      attributes: [[fn('AVG', col('price')), 'avgPrice']],
      raw: true
    });
    return result?.avgPrice || 10000;
  }

  private async getUserWinRate(userId: number): Promise<number | null> {
    const [closedCount, totalCount] = await Promise.all([
      Deal.count({
        include: [
          {
            model: User,
            as: 'users',
            where: { id: userId },
            through: { attributes: [] }
          }
        ],
        where: { stage: DealStageEnums.CLOSED }
      }),
      Deal.count({
        include: [
          {
            model: User,
            as: 'users',
            where: { id: userId },
            through: { attributes: [] }
          }
        ],
        where: {
          stage: { [Op.in]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED] }
        }
      })
    ]);

    if (totalCount === 0) return null;
    return Math.round((closedCount / totalCount) * 100);
  }
}

export default new DealScoringService();
