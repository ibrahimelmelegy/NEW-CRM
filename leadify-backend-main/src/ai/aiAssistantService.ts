import { Op, fn, col } from 'sequelize';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import Invoice from '../deal/model/invoiceMode';
import Opportunity from '../opportunity/opportunityModel';
import { DealActivity } from '../activity-logs/model/dealActivities';
import { DealStageEnums } from '../deal/dealEnum';
import User from '../user/userModel';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface LeadScoreResult {
  leadId: string;
  leadName: string;
  qualityScore: number;
  tier: 'hot' | 'warm' | 'cold';
  reasoning: string[];
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    score: number;
    detail: string;
  }>;
  recommendations: string[];
  scoredAt: string;
}

export interface EmailDraftResult {
  subject: string;
  body: string;
  tone: string;
  purpose: string;
  generatedAt: string;
}

export interface DealWinProbabilityResult {
  dealId: string;
  dealName: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  positiveSignals: string[];
  riskFactors: string[];
  nextSteps: string[];
  comparisons: {
    avgProbabilityForStage: number;
    pipelineRank: string;
  };
  calculatedAt: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'action' | 'insight' | 'warning' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  confidence: number;
}

export interface SmartSuggestionsResult {
  entityType: string;
  entityId: string;
  entityName: string;
  suggestions: SmartSuggestion[];
  generatedAt: string;
}

// ─── Helper: Get OpenAI client ──────────────────────────────────────────────

async function getOpenAIClient(): Promise<any | null> {
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

    if (apiKey) {
      return new OpenAI({ apiKey });
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Service Class ──────────────────────────────────────────────────────────

class AIAssistantService {
  // ===================================================================
  // 1. LEAD SCORING - Analyze lead quality and return score 1-100
  // ===================================================================
  async scoreLeadQuality(leadId: string): Promise<LeadScoreResult> {
    const lead = await Lead.findByPk(leadId, { raw: true }) as any;
    if (!lead) throw new Error('Lead not found');

    const factors: LeadScoreResult['factors'] = [];
    const reasoning: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 50; // Base

    // Factor 1: Contact completeness
    let completeness = 0;
    if (lead.name) completeness += 20;
    if (lead.email) completeness += 20;
    if (lead.phone) completeness += 15;
    if (lead.companyName) completeness += 20;
    if (lead.notes) completeness += 10;
    if (lead.leadSource) completeness += 15;

    if (completeness >= 80) {
      factors.push({ name: 'Profile Completeness', impact: 'positive', score: 12, detail: `Lead profile is ${completeness}% complete` });
      totalScore += 12;
      reasoning.push(`Strong profile completeness at ${completeness}%`);
    } else if (completeness >= 50) {
      factors.push({ name: 'Profile Completeness', impact: 'neutral', score: 3, detail: `Lead profile is ${completeness}% complete - missing some information` });
      totalScore += 3;
      recommendations.push('Complete the lead profile by adding missing contact information');
    } else {
      factors.push({ name: 'Profile Completeness', impact: 'negative', score: -8, detail: `Lead profile is only ${completeness}% complete` });
      totalScore -= 8;
      reasoning.push(`Incomplete profile at ${completeness}%`);
      recommendations.push('Prioritize gathering more information about this lead');
    }

    // Factor 2: Lead source quality
    const highValueSources = ['REFERRAL', 'EVENT', 'WEBSITE'];
    const medValueSources = ['EMAIL', 'PHONE'];
    const source = lead.leadSource || '';

    if (highValueSources.includes(source)) {
      factors.push({ name: 'Lead Source', impact: 'positive', score: 10, detail: `High-value source: ${source}` });
      totalScore += 10;
      reasoning.push(`Came from a high-quality source (${source})`);
    } else if (medValueSources.includes(source)) {
      factors.push({ name: 'Lead Source', impact: 'neutral', score: 4, detail: `Medium-value source: ${source}` });
      totalScore += 4;
    } else if (source) {
      factors.push({ name: 'Lead Source', impact: 'neutral', score: 0, detail: `Source: ${source}` });
    } else {
      factors.push({ name: 'Lead Source', impact: 'negative', score: -5, detail: 'No lead source recorded' });
      totalScore -= 5;
      recommendations.push('Identify and record the lead source for better tracking');
    }

    // Factor 3: Lead status / progression
    const status = lead.status || '';
    if (status === 'QUALIFIED') {
      factors.push({ name: 'Status', impact: 'positive', score: 15, detail: 'Lead has been qualified' });
      totalScore += 15;
      reasoning.push('Lead is already qualified');
    } else if (status === 'CONTACTED') {
      factors.push({ name: 'Status', impact: 'positive', score: 8, detail: 'Lead has been contacted' });
      totalScore += 8;
      reasoning.push('Active engagement - lead has been contacted');
    } else if (status === 'NEW') {
      factors.push({ name: 'Status', impact: 'neutral', score: 0, detail: 'Lead is new and uncontacted' });
      recommendations.push('Reach out to this lead within 24 hours for best conversion rate');
    } else if (status === 'CONVERTED') {
      factors.push({ name: 'Status', impact: 'positive', score: 20, detail: 'Lead has been converted' });
      totalScore += 20;
    } else if (status === 'DISQUALIFIED' || status === 'LOST') {
      factors.push({ name: 'Status', impact: 'negative', score: -20, detail: `Lead status is ${status}` });
      totalScore -= 20;
      reasoning.push(`Lead has been ${status.toLowerCase()}`);
    }

    // Factor 4: Recency
    const now = new Date();
    const createdAt = new Date(lead.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreation <= 7) {
      factors.push({ name: 'Recency', impact: 'positive', score: 8, detail: `Created ${daysSinceCreation} day(s) ago - fresh lead` });
      totalScore += 8;
      reasoning.push('Fresh lead, created recently');
    } else if (daysSinceCreation <= 30) {
      factors.push({ name: 'Recency', impact: 'neutral', score: 2, detail: `Created ${daysSinceCreation} days ago` });
      totalScore += 2;
    } else if (daysSinceCreation > 90) {
      factors.push({ name: 'Recency', impact: 'negative', score: -10, detail: `Lead is ${daysSinceCreation} days old - may be stale` });
      totalScore -= 10;
      reasoning.push(`Lead is aging at ${daysSinceCreation} days old`);
      recommendations.push('Re-engage this lead with a fresh touchpoint or consider archiving');
    }

    // Factor 5: Last contact date
    if (lead.lastContactDate) {
      const lastContact = new Date(lead.lastContactDate);
      const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceContact <= 3) {
        factors.push({ name: 'Last Contact', impact: 'positive', score: 8, detail: `Last contacted ${daysSinceContact} day(s) ago` });
        totalScore += 8;
      } else if (daysSinceContact <= 14) {
        factors.push({ name: 'Last Contact', impact: 'neutral', score: 3, detail: `Last contacted ${daysSinceContact} days ago` });
        totalScore += 3;
      } else {
        factors.push({ name: 'Last Contact', impact: 'negative', score: -8, detail: `No contact for ${daysSinceContact} days` });
        totalScore -= 8;
        recommendations.push(`Follow up with this lead - no contact in ${daysSinceContact} days`);
      }
    } else {
      factors.push({ name: 'Last Contact', impact: 'negative', score: -5, detail: 'No contact date recorded' });
      totalScore -= 5;
      recommendations.push('Make initial contact and record the date');
    }

    // Factor 6: Existing score
    if (lead.score && lead.score > 0) {
      if (lead.score >= 80) {
        factors.push({ name: 'Existing Score', impact: 'positive', score: 10, detail: `Pre-existing score of ${lead.score}` });
        totalScore += 10;
      } else if (lead.score >= 50) {
        factors.push({ name: 'Existing Score', impact: 'neutral', score: 3, detail: `Pre-existing score of ${lead.score}` });
        totalScore += 3;
      }
    }

    // Try AI-enhanced analysis
    const aiInsight = await this.getAILeadInsight(lead, totalScore);
    if (aiInsight) {
      reasoning.push(aiInsight.reasoning);
      if (aiInsight.recommendation) {
        recommendations.push(aiInsight.recommendation);
      }
    }

    // Clamp score
    const qualityScore = Math.max(1, Math.min(100, totalScore));

    // Determine tier
    let tier: 'hot' | 'warm' | 'cold';
    if (qualityScore >= 70) tier = 'hot';
    else if (qualityScore >= 40) tier = 'warm';
    else tier = 'cold';

    // Sort factors by absolute score impact
    factors.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

    // Add default recommendations
    if (recommendations.length === 0) {
      if (tier === 'hot') {
        recommendations.push('This is a high-quality lead. Prioritize and fast-track for conversion.');
      } else if (tier === 'warm') {
        recommendations.push('Nurture this lead with consistent engagement to move it to hot status.');
      }
    }

    return {
      leadId: lead.id,
      leadName: lead.name || 'Unknown Lead',
      qualityScore,
      tier,
      reasoning,
      factors,
      recommendations,
      scoredAt: now.toISOString()
    };
  }

  // ===================================================================
  // 2. EMAIL DRAFT GENERATION
  // ===================================================================
  async generateEmailDraft(context: {
    recipientName?: string;
    recipientCompany?: string;
    senderName?: string;
    dealName?: string;
    dealStage?: string;
    dealValue?: number;
    purpose: 'follow-up' | 'introduction' | 'proposal' | 'thank-you' | 'meeting-request' | 'cold-outreach' | 'check-in';
    tone?: 'professional' | 'friendly' | 'formal' | 'casual';
    additionalContext?: string;
  }): Promise<EmailDraftResult> {
    const client = await getOpenAIClient();
    const tone = context.tone || 'professional';
    const purpose = context.purpose;

    if (client) {
      try {
        let contextStr = `Purpose: ${purpose}\nTone: ${tone}`;
        if (context.recipientName) contextStr += `\nRecipient: ${context.recipientName}`;
        if (context.recipientCompany) contextStr += `\nRecipient Company: ${context.recipientCompany}`;
        if (context.senderName) contextStr += `\nSender: ${context.senderName}`;
        if (context.dealName) contextStr += `\nDeal: ${context.dealName}`;
        if (context.dealStage) contextStr += `\nDeal Stage: ${context.dealStage}`;
        if (context.dealValue) contextStr += `\nDeal Value: $${context.dealValue.toLocaleString()}`;
        if (context.additionalContext) contextStr += `\nAdditional: ${context.additionalContext}`;

        const completion = await client.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a professional email writer for a CRM platform. Generate polished, effective business emails. Always respond with valid JSON containing "subject" and "body" fields. Do not use markdown in the body.'
            },
            {
              role: 'user',
              content: `Write a ${tone} ${purpose} email with these details:\n${contextStr}\n\nRespond with JSON: {"subject": "...", "body": "..."}`
            }
          ],
          model: 'gpt-4o',
          temperature: 0.6,
          max_tokens: 800
        });

        const response = completion.choices[0].message.content?.trim();
        if (response) {
          try {
            let cleaned = response;
            if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            const parsed = JSON.parse(cleaned);
            return {
              subject: parsed.subject || 'Follow Up',
              body: parsed.body || '',
              tone,
              purpose,
              generatedAt: new Date().toISOString()
            };
          } catch {
            return {
              subject: `${purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('-', ' ')}`,
              body: response,
              tone,
              purpose,
              generatedAt: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.error('AI email generation error:', error);
      }
    }

    // Fallback: template-based generation
    return this.generateEmailFallback(context);
  }

  // ===================================================================
  // 3. DEAL WIN PROBABILITY
  // ===================================================================
  async calculateDealWinProbability(dealId: string): Promise<DealWinProbabilityResult> {
    const deal = await Deal.findByPk(dealId, {
      include: [
        { model: User, as: 'users' },
        { model: Client, as: 'client' },
        { model: Lead, as: 'lead' },
        { model: Invoice, as: 'invoice' }
      ]
    }) as any;

    if (!deal) throw new Error('Deal not found');

    const now = new Date();
    let probability = 50;
    const positiveSignals: string[] = [];
    const riskFactors: string[] = [];
    const nextSteps: string[] = [];

    // Factor 1: Deal Stage
    if (deal.stage === DealStageEnums.CLOSED) {
      probability = 100;
      positiveSignals.push('Deal is already closed/won');
    } else if (deal.stage === DealStageEnums.CANCELLED) {
      probability = 0;
      riskFactors.push('Deal has been cancelled');
    } else if (deal.stage === DealStageEnums.PROGRESS) {
      probability += 5;
      positiveSignals.push('Deal is actively in progress');
    }

    // Factor 2: Deal age vs average
    const dealAge = Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const avgDealAgeResult = await Deal.findOne({
      where: { stage: DealStageEnums.PROGRESS },
      attributes: [[fn('AVG', col('price')), 'avgPrice']],
      raw: true
    });

    if (dealAge <= 30) {
      probability += 8;
      positiveSignals.push(`Deal is relatively new at ${dealAge} days old`);
    } else if (dealAge > 90) {
      probability -= 12;
      riskFactors.push(`Deal has been open for ${dealAge} days - potential stall risk`);
      nextSteps.push('Review deal timeline and identify blockers preventing close');
    } else if (dealAge > 60) {
      probability -= 5;
      riskFactors.push(`Deal aging at ${dealAge} days`);
    }

    // Factor 3: Recent activity
    const activities = await DealActivity.findAll({
      where: { dealId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const activityCount = activities.length;
    const lastActivity = activities[0]?.createdAt ? new Date(activities[0].createdAt) : null;
    const daysSinceActivity = lastActivity
      ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : dealAge;

    if (daysSinceActivity <= 3) {
      probability += 10;
      positiveSignals.push('Recent activity within the last 3 days');
    } else if (daysSinceActivity <= 7) {
      probability += 5;
      positiveSignals.push('Activity within the past week');
    } else if (daysSinceActivity > 14) {
      probability -= 15;
      riskFactors.push(`No activity for ${daysSinceActivity} days - deal may be stalling`);
      nextSteps.push(`Reach out immediately - no activity in ${daysSinceActivity} days`);
    } else {
      probability -= 3;
      nextSteps.push('Schedule a follow-up to maintain momentum');
    }

    // Factor 4: Activity volume
    if (activityCount >= 15) {
      probability += 10;
      positiveSignals.push(`High engagement with ${activityCount} activities logged`);
    } else if (activityCount >= 8) {
      probability += 5;
      positiveSignals.push(`Good engagement with ${activityCount} activities`);
    } else if (activityCount < 3) {
      probability -= 8;
      riskFactors.push(`Very low engagement - only ${activityCount} activities logged`);
      nextSteps.push('Increase touchpoints with meetings, calls, and emails');
    }

    // Factor 5: Client relationship
    if (deal.clientId) {
      const previousClosedDeals = await Deal.count({
        where: {
          clientId: deal.clientId,
          stage: DealStageEnums.CLOSED,
          id: { [Op.ne]: dealId }
        }
      });

      if (previousClosedDeals > 0) {
        probability += 12;
        positiveSignals.push(`Client has ${previousClosedDeals} previous closed deal(s) - established relationship`);
      }

      const cancelledDeals = await Deal.count({
        where: {
          clientId: deal.clientId,
          stage: DealStageEnums.CANCELLED,
          id: { [Op.ne]: dealId }
        }
      });

      if (cancelledDeals > 0) {
        probability -= 8;
        riskFactors.push(`Client has ${cancelledDeals} previously cancelled deal(s)`);
        nextSteps.push('Address any concerns from previous deals proactively');
      }
    }

    // Factor 6: Has signature date
    if (deal.signatureDate) {
      probability += 10;
      positiveSignals.push('Contract has a signature date set');
    }

    // Factor 7: Invoice status
    const invoices = deal.invoice || [];
    if (invoices.length > 0) {
      const collectedCount = invoices.filter((inv) => inv.collected).length;
      if (collectedCount > 0) {
        probability += 8;
        positiveSignals.push(`${collectedCount} of ${invoices.length} invoices collected`);
      }
    }

    // Factor 8: Deal value vs average
    const avgPriceResult = await Deal.findOne({
      attributes: [[fn('AVG', col('price')), 'avgPrice']],
      raw: true
    }) as any;
    const avgPrice = avgPriceResult?.avgPrice || 10000;
    const dealPrice = deal.price || 0;

    if (dealPrice > 0 && dealPrice <= avgPrice * 1.5) {
      probability += 5;
      positiveSignals.push('Deal value is within the typical range');
    } else if (dealPrice > avgPrice * 3) {
      probability -= 5;
      riskFactors.push('Deal value is significantly above average - may need more stakeholder buy-in');
      nextSteps.push('Ensure executive sponsorship for this high-value deal');
    }

    // Factor 9: User win rate
    if (deal.users && deal.users.length > 0) {
      const userId = deal.users[0].id;
      const [closedCount, totalFinished] = await Promise.all([
        Deal.count({
          include: [{ model: User, as: 'users', where: { id: userId }, through: { attributes: [] } }],
          where: { stage: DealStageEnums.CLOSED }
        }),
        Deal.count({
          include: [{ model: User, as: 'users', where: { id: userId }, through: { attributes: [] } }],
          where: { stage: { [Op.in]: [DealStageEnums.CLOSED, DealStageEnums.CANCELLED] } }
        })
      ]);

      if (totalFinished > 0) {
        const winRate = Math.round((closedCount / totalFinished) * 100);
        if (winRate >= 60) {
          probability += 8;
          positiveSignals.push(`Assigned rep has a ${winRate}% win rate`);
        } else if (winRate < 40) {
          probability -= 5;
          riskFactors.push(`Assigned rep has a ${winRate}% win rate - may need coaching`);
          nextSteps.push('Consider pairing with a senior team member');
        }
      }
    }

    // Calculate stage comparison
    const dealsInSameStage = await Deal.findAll({
      where: { stage: deal.stage },
      attributes: ['id', 'price'],
      raw: true
    });
    const pipelineRank = dealsInSameStage.length > 0
      ? `${Math.min(dealsInSameStage.length, Math.max(1, Math.round(probability / 100 * dealsInSameStage.length)))} of ${dealsInSameStage.length}`
      : '1 of 1';

    // Clamp probability
    probability = Math.max(5, Math.min(95, probability));
    if (deal.stage === DealStageEnums.CLOSED) probability = 100;
    if (deal.stage === DealStageEnums.CANCELLED) probability = 0;

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low';
    if (activityCount >= 10 && daysSinceActivity <= 7) confidence = 'high';
    else if (activityCount >= 5) confidence = 'medium';
    else confidence = 'low';

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (probability >= 80) grade = 'A';
    else if (probability >= 60) grade = 'B';
    else if (probability >= 40) grade = 'C';
    else if (probability >= 20) grade = 'D';
    else grade = 'F';

    // Default next steps
    if (nextSteps.length === 0) {
      if (grade === 'A') nextSteps.push('Push for final close - this deal is looking strong');
      else if (grade === 'B') nextSteps.push('Address remaining concerns and prepare for close');
    }

    return {
      dealId: deal.id,
      dealName: deal.name,
      probability,
      confidence,
      grade,
      positiveSignals,
      riskFactors,
      nextSteps,
      comparisons: {
        avgProbabilityForStage: 50,
        pipelineRank
      },
      calculatedAt: now.toISOString()
    };
  }

  // ===================================================================
  // 4. SMART SUGGESTIONS
  // ===================================================================
  async getSmartSuggestions(entityType: 'lead' | 'deal' | 'client', entityId: string): Promise<SmartSuggestionsResult> {
    const suggestions: SmartSuggestion[] = [];
    let entityName = 'Unknown';
    const now = new Date();

    if (entityType === 'lead') {
      const lead = await Lead.findByPk(entityId, { raw: true }) as any;
      if (!lead) throw new Error('Lead not found');
      entityName = lead.name || 'Unknown Lead';

      const daysSinceCreation = Math.floor((now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const status = lead.status || '';

      // Suggestion: uncontacted lead
      if (status === 'NEW') {
        suggestions.push({
          id: 'lead-contact',
          type: 'action',
          priority: daysSinceCreation > 3 ? 'high' : 'medium',
          title: 'Make first contact',
          description: `This lead has not been contacted yet. Leads contacted within 24 hours have 7x higher conversion rates.`,
          actionLabel: 'Schedule Call',
          actionRoute: `/sales/leads/${entityId}`,
          confidence: 92
        });
      }

      // Suggestion: stale lead
      if (daysSinceCreation > 60 && status !== 'CONVERTED' && status !== 'DISQUALIFIED') {
        suggestions.push({
          id: 'lead-stale',
          type: 'warning',
          priority: 'high',
          title: 'Lead is aging',
          description: `This lead was created ${daysSinceCreation} days ago without conversion. Consider re-qualifying or archiving.`,
          actionLabel: 'Review Lead',
          actionRoute: `/sales/leads/${entityId}`,
          confidence: 85
        });
      }

      // Suggestion: qualified but not converted
      if (status === 'QUALIFIED') {
        suggestions.push({
          id: 'lead-convert',
          type: 'opportunity',
          priority: 'high',
          title: 'Ready for conversion',
          description: 'This lead is qualified. Convert to a deal or opportunity to move forward in the pipeline.',
          actionLabel: 'Convert Lead',
          actionRoute: `/sales/leads/${entityId}`,
          confidence: 88
        });
      }

      // Suggestion: missing info
      if (!lead.email && !lead.phone) {
        suggestions.push({
          id: 'lead-contact-info',
          type: 'warning',
          priority: 'medium',
          title: 'Missing contact information',
          description: 'This lead has no email or phone number. Without contact info, engagement is limited.',
          actionLabel: 'Edit Lead',
          actionRoute: `/sales/leads/${entityId}`,
          confidence: 95
        });
      }

      // Suggestion: email outreach
      if (lead.email && (status === 'NEW' || status === 'CONTACTED')) {
        suggestions.push({
          id: 'lead-email',
          type: 'action',
          priority: 'medium',
          title: 'Send a personalized email',
          description: `Send a tailored email to ${lead.name || 'this lead'} to nurture the relationship and move them closer to qualification.`,
          actionLabel: 'Draft Email',
          actionRoute: `/sales/leads/${entityId}`,
          confidence: 78
        });
      }

    } else if (entityType === 'deal') {
      const deal = await Deal.findByPk(entityId, {
        include: [
          { model: Client, as: 'client' },
          { model: Invoice, as: 'invoice' }
        ]
      }) as any;
      if (!deal) throw new Error('Deal not found');
      entityName = deal.name || 'Unknown Deal';

      const dealAge = Math.floor((now.getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      // Check recent activity
      const lastActivity = await DealActivity.findOne({
        where: { dealId: entityId },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt'],
        raw: true
      }) as any;

      const daysSinceActivity = lastActivity
        ? Math.floor((now.getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : dealAge;

      // Suggestion: stalled deal
      if (daysSinceActivity > 7 && deal.stage === DealStageEnums.PROGRESS) {
        suggestions.push({
          id: 'deal-stalled',
          type: 'warning',
          priority: 'high',
          title: 'Deal needs attention',
          description: `No activity in ${daysSinceActivity} days. Deals with gaps over 7 days close at half the rate.`,
          actionLabel: 'Add Activity',
          actionRoute: `/sales/deals/${entityId}`,
          confidence: 90
        });
      }

      // Suggestion: follow up
      if (deal.stage === DealStageEnums.PROGRESS && daysSinceActivity > 3) {
        suggestions.push({
          id: 'deal-follow-up',
          type: 'action',
          priority: daysSinceActivity > 10 ? 'high' : 'medium',
          title: 'Schedule a follow-up',
          description: 'Maintain deal momentum with a check-in call or meeting.',
          actionLabel: 'Schedule',
          actionRoute: `/sales/deals/${entityId}`,
          confidence: 82
        });
      }

      // Suggestion: overdue invoices
      const invoices = deal.invoice || [];
      const overdueInvoices = invoices.filter((inv) => !inv.collected && new Date(inv.invoiceDate) < now);
      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((s: number, inv: any) => s + (inv.amount || 0), 0);
        suggestions.push({
          id: 'deal-overdue-invoices',
          type: 'warning',
          priority: 'high',
          title: 'Overdue invoices',
          description: `${overdueInvoices.length} invoice(s) totaling $${totalOverdue.toLocaleString()} are overdue. Follow up on collections.`,
          actionLabel: 'View Invoices',
          actionRoute: `/sales/deals/${entityId}`,
          confidence: 95
        });
      }

      // Suggestion: high value deal without contract
      if (deal.price > 50000 && !deal.signatureDate && deal.stage === DealStageEnums.PROGRESS) {
        suggestions.push({
          id: 'deal-contract',
          type: 'opportunity',
          priority: 'medium',
          title: 'Prepare contract for high-value deal',
          description: `This $${deal.price.toLocaleString()} deal has no contract date. Prepare and send the contract to accelerate close.`,
          actionLabel: 'Prepare Contract',
          actionRoute: `/sales/deals/${entityId}`,
          confidence: 75
        });
      }

      // Suggestion: aging deal
      if (dealAge > 90 && deal.stage === DealStageEnums.PROGRESS) {
        suggestions.push({
          id: 'deal-aging',
          type: 'insight',
          priority: 'medium',
          title: 'Re-evaluate deal viability',
          description: `This deal has been open for ${dealAge} days. Consider reviewing the deal strategy or adjusting terms.`,
          actionLabel: 'Review Deal',
          actionRoute: `/sales/deals/${entityId}`,
          confidence: 80
        });
      }

    } else if (entityType === 'client') {
      const client = await Client.findByPk(entityId, { raw: true }) as any;
      if (!client) throw new Error('Client not found');
      entityName = client.clientName || client.companyName || 'Unknown Client';

      // Check client deals
      const [activeDeals, closedDeals, totalDealValue] = await Promise.all([
        Deal.count({ where: { clientId: entityId, stage: DealStageEnums.PROGRESS } }),
        Deal.count({ where: { clientId: entityId, stage: DealStageEnums.CLOSED } }),
        Deal.findOne({
          where: { clientId: entityId },
          attributes: [[fn('SUM', col('price')), 'total']],
          raw: true
        }) as any
      ]);

      const revenue = totalDealValue?.total || 0;

      // Suggestion: upsell opportunity
      if (closedDeals > 0 && activeDeals === 0) {
        suggestions.push({
          id: 'client-upsell',
          type: 'opportunity',
          priority: 'medium',
          title: 'Upsell opportunity',
          description: `This client has ${closedDeals} closed deal(s) but no active deals. Explore new opportunities.`,
          actionLabel: 'Create Deal',
          actionRoute: `/crm/clients/${entityId}`,
          confidence: 80
        });
      }

      // Suggestion: high-value client engagement
      if (revenue > 100000) {
        suggestions.push({
          id: 'client-vip',
          type: 'insight',
          priority: 'medium',
          title: 'High-value client',
          description: `Total revenue from this client is $${Number(revenue).toLocaleString()}. Consider a dedicated account strategy.`,
          confidence: 85
        });
      }

      // Suggestion: inactive client
      if (client.clientStatus === 'INACTIVE') {
        suggestions.push({
          id: 'client-reactivate',
          type: 'action',
          priority: 'low',
          title: 'Re-engage inactive client',
          description: 'This client is marked inactive. Consider a win-back campaign or check-in call.',
          actionLabel: 'Contact Client',
          actionRoute: `/crm/clients/${entityId}`,
          confidence: 70
        });
      }

      // Suggestion: unpaid invoices
      const overdueInvoiceCount = await Invoice.count({
        where: {
          collected: false,
          invoiceDate: { [Op.lt]: now }
        },
        include: [{ model: Deal, as: 'deal', where: { clientId: entityId }, attributes: [] }]
      }).catch(() => 0);

      if (overdueInvoiceCount > 0) {
        suggestions.push({
          id: 'client-overdue',
          type: 'warning',
          priority: 'high',
          title: 'Outstanding invoices',
          description: `This client has ${overdueInvoiceCount} overdue invoice(s). Follow up on collections.`,
          actionLabel: 'View Invoices',
          actionRoute: `/crm/clients/${entityId}`,
          confidence: 92
        });
      }
    }

    // Sort suggestions by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      entityType,
      entityId,
      entityName,
      suggestions,
      generatedAt: now.toISOString()
    };
  }

  // ===================================================================
  // Private helpers
  // ===================================================================

  private async getAILeadInsight(lead: any, currentScore: number): Promise<{ reasoning: string; recommendation?: string } | null> {
    try {
      const client = await getOpenAIClient();
      if (!client) return null;

      const leadSummary = {
        name: lead.name,
        company: lead.companyName,
        source: lead.leadSource,
        status: lead.status,
        score: currentScore,
        hasEmail: !!lead.email,
        hasPhone: !!lead.phone
      };

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a lead qualification expert. Given lead data and a preliminary score, provide a brief one-sentence analysis and optionally one actionable recommendation. Respond with JSON: {"reasoning": "...", "recommendation": "..."}'
          },
          {
            role: 'user',
            content: `Lead data: ${JSON.stringify(leadSummary)}`
          }
        ],
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 150
      });

      const response = completion.choices[0].message.content?.trim();
      if (!response) return null;

      try {
        let cleaned = response;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleaned);
      } catch {
        return { reasoning: response };
      }
    } catch {
      return null;
    }
  }

  private generateEmailFallback(context: {
    recipientName?: string;
    senderName?: string;
    dealName?: string;
    dealStage?: string;
    dealValue?: number;
    purpose: string;
    tone?: string;
    recipientCompany?: string;
    additionalContext?: string;
  }): EmailDraftResult {
    const recipient = context.recipientName || 'there';
    const sender = context.senderName || 'the Team';
    const tone = context.tone || 'professional';
    const purpose = context.purpose;

    const templates: Record<string, { subject: string; body: string }> = {
      'follow-up': {
        subject: `Following Up${context.dealName ? ' - ' + context.dealName : ''}`,
        body: `Dear ${recipient},\n\nI hope this message finds you well. I wanted to follow up on our recent conversation${context.dealName ? ` regarding ${context.dealName}` : ''}.\n\n${context.dealValue ? `As discussed, the proposed investment of $${context.dealValue.toLocaleString()} covers the full scope of our solution. ` : ''}I believe there is a strong opportunity for us to work together, and I would love to discuss the next steps at your convenience.\n\nPlease let me know a time that works for you.\n\nBest regards,\n${sender}`
      },
      'introduction': {
        subject: `Introduction${context.recipientCompany ? ' - ' + context.recipientCompany : ''}`,
        body: `Dear ${recipient},\n\nMy name is ${sender}, and I am reaching out because I believe we could create significant value together${context.recipientCompany ? ` for ${context.recipientCompany}` : ''}.\n\nI would welcome the opportunity to connect and explore how we might collaborate.\n\nLooking forward to hearing from you.\n\nBest regards,\n${sender}`
      },
      'proposal': {
        subject: `Proposal${context.dealName ? ': ' + context.dealName : ''}`,
        body: `Dear ${recipient},\n\nThank you for the opportunity to present our proposal${context.dealName ? ` for ${context.dealName}` : ''}.\n\n${context.dealValue ? `Based on our discussions, our tailored solution is available at an investment of $${context.dealValue.toLocaleString()}. ` : ''}I would love to walk you through the details at your earliest convenience.\n\nBest regards,\n${sender}`
      },
      'thank-you': {
        subject: 'Thank You',
        body: `Dear ${recipient},\n\nI wanted to take a moment to express my sincere gratitude for your time and consideration.\n\nYour insights were very valuable, and I look forward to our continued collaboration.\n\nWarm regards,\n${sender}`
      },
      'meeting-request': {
        subject: `Meeting Request${context.dealName ? ' - ' + context.dealName : ''}`,
        body: `Dear ${recipient},\n\nI would like to request a meeting to discuss ${context.dealName || 'our potential collaboration'}.\n\nI am available this week and would be happy to work around your schedule. Would any of the following times work for you?\n\nPlease let me know your preference.\n\nBest regards,\n${sender}`
      },
      'cold-outreach': {
        subject: `Quick question${context.recipientCompany ? ' for ' + context.recipientCompany : ''}`,
        body: `Dear ${recipient},\n\nI came across ${context.recipientCompany || 'your company'} and was impressed by what you are building. I work with similar organizations to help them ${context.additionalContext || 'achieve better results'}.\n\nWould you be open to a brief 15-minute call to explore if there is a fit?\n\nBest regards,\n${sender}`
      },
      'check-in': {
        subject: `Checking In${context.dealName ? ' - ' + context.dealName : ''}`,
        body: `Dear ${recipient},\n\nI wanted to check in and see how things are going${context.dealName ? ` with ${context.dealName}` : ''}.\n\nPlease let me know if there is anything I can help with or if you have any questions.\n\nBest regards,\n${sender}`
      }
    };

    const template = templates[purpose] || templates['follow-up'];

    return {
      subject: template.subject,
      body: template.body,
      tone,
      purpose,
      generatedAt: new Date().toISOString()
    };
  }
}

export default new AIAssistantService();
