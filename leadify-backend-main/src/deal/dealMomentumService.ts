import Deal from './model/dealModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

interface MomentumResult {
  score: number;
  velocity: number;
  engagement: number;
  progression: number;
  responsiveness: number;
  trend: number[];
  label: 'Hot' | 'Warm' | 'Cooling' | 'Cold';
  color: string;
}

const PIPELINE_STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSING', 'CLOSED', 'PROGRESS', 'CANCELLED'];

const DEFAULT_AVG_STAGE_DAYS = 14;

class DealMomentumService {
  /**
   * Calculate momentum score for a deal based on velocity, engagement,
   * progression, and responsiveness factors.
   */
  async calculateMomentum(dealId: string, tenantId?: string): Promise<MomentumResult> {
    const deal = await Deal.findByPk(dealId);

    if (!deal) {
      throw new BaseError(ERRORS.DEAL_NOT_FOUND, 404);
    }

    const now = new Date();
    const createdAt = new Date(deal.createdAt);
    const updatedAt = new Date(deal.updatedAt);

    // --- 1. Velocity (0-30): How fast the deal is moving through its current stage ---
    const velocity = this.calculateVelocity(createdAt, updatedAt, now);

    // --- 2. Engagement (0-30): Activity level in last 14 days ---
    const engagement = this.calculateEngagement(createdAt, updatedAt, now);

    // --- 3. Progression (0-20): How far along the pipeline ---
    const progression = this.calculateProgression(deal.stage);

    // --- 4. Responsiveness (0-20): How frequently the deal is updated ---
    const responsiveness = this.calculateResponsiveness(createdAt, updatedAt, now);

    // --- Composite Score ---
    const score = Math.round(Math.min(100, Math.max(0, velocity + engagement + progression + responsiveness)));

    // --- Trend (simulated from score) ---
    const trend = this.generateTrend(score);

    // --- Label & Color ---
    const { label, color } = this.getLabel(score);

    return {
      score,
      velocity: Math.round(velocity * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
      progression: Math.round(progression * 10) / 10,
      responsiveness: Math.round(responsiveness * 10) / 10,
      trend,
      label,
      color
    };
  }

  /**
   * Velocity: Compare days in current stage vs average stage duration.
   * Score = 30 * max(0, 1 - daysInStage / avgDays)
   * We approximate "days in current stage" as days since last update.
   */
  private calculateVelocity(createdAt: Date, updatedAt: Date, now: Date): number {
    const daysSinceUpdate = this.daysBetween(updatedAt, now);
    return 30 * Math.max(0, 1 - daysSinceUpdate / DEFAULT_AVG_STAGE_DAYS);
  }

  /**
   * Engagement: Simulate activity count based on update frequency.
   * Count simulated activities in last 14 days, weighted by recency.
   */
  private calculateEngagement(createdAt: Date, updatedAt: Date, now: Date): number {
    const dealAgeDays = Math.max(1, this.daysBetween(createdAt, now));
    const daysSinceUpdate = this.daysBetween(updatedAt, now);

    // Estimate activity frequency: shorter time between create and last update = more active
    const activeDays = Math.max(1, this.daysBetween(createdAt, updatedAt));
    // Estimate ~1 activity per 2 active days, capped to be reasonable
    const estimatedActivities = Math.min(15, Math.ceil(activeDays / 2));

    // Recency weight: recent updates get higher score
    const recencyFactor = Math.max(0, 1 - daysSinceUpdate / 14);

    // Base points per activity (max 2 points each, up to 30)
    const baseScore = Math.min(30, estimatedActivities * 2);

    return baseScore * recencyFactor;
  }

  /**
   * Progression: stageIndex / totalStages * 20
   */
  private calculateProgression(stage: string): number {
    const stageIndex = PIPELINE_STAGES.indexOf(stage);
    if (stageIndex === -1) {
      // If stage not in pipeline, give middle score
      return 10;
    }
    // CANCELLED gets 0 progression
    if (stage === 'CANCELLED') {
      return 0;
    }
    return (stageIndex / (PIPELINE_STAGES.length - 1)) * 20;
  }

  /**
   * Responsiveness: Average time between activities (approximated).
   * < 1 day avg = 20pts, 1-3 days = 15, 3-7 days = 10, 7+ days = 5
   */
  private calculateResponsiveness(createdAt: Date, updatedAt: Date, now: Date): number {
    const dealAgeDays = Math.max(0.5, this.daysBetween(createdAt, now));
    const activeDays = Math.max(0.5, this.daysBetween(createdAt, updatedAt));

    // Estimate average gap between activities
    const estimatedActivities = Math.max(1, Math.ceil(activeDays / 2));
    const avgGapDays = activeDays / estimatedActivities;

    // Also factor in how recently the deal was touched
    const daysSinceUpdate = this.daysBetween(updatedAt, now);

    // If the deal hasn't been touched recently, penalize responsiveness
    if (daysSinceUpdate > 14) return 3;
    if (daysSinceUpdate > 7) return 5;

    if (avgGapDays < 1) return 20;
    if (avgGapDays <= 3) return 15;
    if (avgGapDays <= 7) return 10;
    return 5;
  }

  /**
   * Generate simulated trend data points based on the current score.
   */
  private generateTrend(score: number): number[] {
    const offsets = [-10, -5, -3, 2, -1, 4, 0];
    return offsets.map(offset => Math.min(100, Math.max(0, score + offset)));
  }

  /**
   * Map score to label and color.
   */
  private getLabel(score: number): { label: 'Hot' | 'Warm' | 'Cooling' | 'Cold'; color: string } {
    if (score >= 76) return { label: 'Hot', color: '#00ff88' };
    if (score >= 51) return { label: 'Warm', color: '#ffaa00' };
    if (score >= 26) return { label: 'Cooling', color: '#ff8800' };
    return { label: 'Cold', color: '#ff4444' };
  }

  /**
   * Calculate days between two dates.
   */
  private daysBetween(start: Date, end: Date): number {
    const diffMs = Math.abs(end.getTime() - start.getTime());
    return diffMs / (1000 * 60 * 60 * 24);
  }
}

export default new DealMomentumService();
