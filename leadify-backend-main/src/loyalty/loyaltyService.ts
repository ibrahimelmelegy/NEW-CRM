import { Op, fn, col } from 'sequelize';
import { LoyaltyProgram, LoyaltyPoints } from './loyaltyModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

interface TierDefinition {
  name: string;
  minPoints: number;
  maxPoints: number;
}

const DEFAULT_TIERS: TierDefinition[] = [
  { name: 'BRONZE', minPoints: 0, maxPoints: 999 },
  { name: 'SILVER', minPoints: 1000, maxPoints: 4999 },
  { name: 'GOLD', minPoints: 5000, maxPoints: 19999 },
  { name: 'PLATINUM', minPoints: 20000, maxPoints: Infinity }
];

class LoyaltyService {
  async createProgram(data: Record<string, unknown>, tenantId?: string) {
    return LoyaltyProgram.create({ ...data, tenantId });
  }

  async getPrograms(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await LoyaltyProgram.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateProgram(id: number, data: Record<string, unknown>) {
    const item = await LoyaltyProgram.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteProgram(id: number) {
    const item = await LoyaltyProgram.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  async addPoints(data: Record<string, unknown>, tenantId?: string) {
    return LoyaltyPoints.create({ ...data, tenantId });
  }

  async getPointsHistory(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.programId) where.programId = query.programId;
    const { rows, count } = await LoyaltyPoints.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getClientBalance(clientId: string, programId: number) {
    const earned = (await LoyaltyPoints.sum('points', { where: { clientId, programId, transactionType: 'EARN' } })) || 0;
    const redeemed = (await LoyaltyPoints.sum('points', { where: { clientId, programId, transactionType: 'REDEEM' } })) || 0;
    return { balance: earned - Math.abs(redeemed), earned, redeemed };
  }

  /**
   * Calculate the tier for a client based on their total earned points.
   * BRONZE (0-999), SILVER (1000-4999), GOLD (5000-19999), PLATINUM (20000+).
   * Returns the current tier and the threshold needed to reach the next tier.
   */
  async calculateTier(clientId: string, programId?: number) {
    const where: Record<string, unknown> = { clientId, transactionType: 'EARN' };
    if (programId) where.programId = programId;

    const totalEarned = (await LoyaltyPoints.sum('points', { where })) || 0;

    let currentTier = DEFAULT_TIERS[0];
    let nextTier: TierDefinition | null = null;

    for (let i = 0; i < DEFAULT_TIERS.length; i++) {
      if (totalEarned >= DEFAULT_TIERS[i].minPoints) {
        currentTier = DEFAULT_TIERS[i];
        nextTier = i < DEFAULT_TIERS.length - 1 ? DEFAULT_TIERS[i + 1] : null;
      }
    }

    return {
      clientId,
      totalEarned,
      currentTier: currentTier.name,
      nextTier: nextTier ? nextTier.name : null,
      pointsToNextTier: nextTier ? nextTier.minPoints - totalEarned : 0,
      nextTierThreshold: nextTier ? nextTier.minPoints : null
    };
  }

  /**
   * Check for point transactions older than 12 months that have not been redeemed.
   * Mark them as EXPIRED and return the total expired points.
   */
  async checkExpiration(clientId: string, programId?: number) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const where: Record<string, unknown> = {
      clientId,
      transactionType: 'EARN',
      createdAt: { [Op.lt]: twelveMonthsAgo }
    };
    if (programId) where.programId = programId;

    // Find all old EARN transactions
    const oldTransactions = await LoyaltyPoints.findAll({ where });

    let totalExpiredPoints = 0;
    const expiredTransactionIds: number[] = [];

    for (const tx of oldTransactions) {
      // Check if this specific earn transaction has already been marked as expired
      const alreadyExpired = await LoyaltyPoints.findOne({
        where: {
          clientId,
          transactionType: 'EXPIRE',
          referenceId: String(tx.id)
        }
      });

      if (!alreadyExpired) {
        // Create an EXPIRE transaction to offset the old EARN
        await LoyaltyPoints.create({
          clientId: tx.clientId,
          programId: tx.programId,
          points: tx.points,
          transactionType: 'EXPIRE',
          description: `Expiration of points earned on ${tx.createdAt}`,
          referenceId: String(tx.id),
          tenantId: tx.tenantId
        });
        totalExpiredPoints += tx.points;
        expiredTransactionIds.push(tx.id);
      }
    }

    return {
      clientId,
      totalExpiredPoints,
      expiredTransactions: expiredTransactionIds.length
    };
  }

  /**
   * Redeem points for a client. Validates sufficient balance before creating
   * the REDEEM transaction. Returns the new balance.
   */
  async redeemPoints(clientId: string, programId: number, amount: number, description?: string) {
    if (amount <= 0) {
      throw new Error('Redemption amount must be positive');
    }

    // Calculate current effective balance (earned - redeemed - expired)
    const earned =
      (await LoyaltyPoints.sum('points', {
        where: { clientId, programId, transactionType: 'EARN' }
      })) || 0;

    const redeemed =
      (await LoyaltyPoints.sum('points', {
        where: { clientId, programId, transactionType: 'REDEEM' }
      })) || 0;

    const expired =
      (await LoyaltyPoints.sum('points', {
        where: { clientId, programId, transactionType: 'EXPIRE' }
      })) || 0;

    const balance = earned - Math.abs(redeemed) - Math.abs(expired);

    if (balance < amount) {
      throw new Error(`Insufficient points balance. Available: ${balance}, requested: ${amount}`);
    }

    // Create the redemption transaction (stored as positive; balance calculation uses Math.abs)
    const transaction = await LoyaltyPoints.create({
      clientId,
      programId,
      points: amount,
      transactionType: 'REDEEM',
      description: description || 'Points redemption'
    });

    const newBalance = balance - amount;

    return {
      transaction,
      previousBalance: balance,
      redeemedAmount: amount,
      newBalance
    };
  }

  /**
   * Automatically earn points based on a deal value.
   * Default: 1 point per $10 (or use program's pointsPerCurrency setting).
   * Creates an EARN transaction and checks if a tier upgrade was triggered.
   */
  async autoEarnPoints(clientId: string, dealValue: number, programId: number) {
    const program = await LoyaltyProgram.findByPk(programId);
    if (!program) throw new Error('Loyalty program not found');
    if (program.status !== 'ACTIVE') throw new Error('Loyalty program is not active');

    // pointsPerCurrency: how many points per 1 unit of currency
    // Default 1 point per $10 = 0.1 points per dollar
    const rate = Number(program.pointsPerCurrency) || 0.1;
    const pointsEarned = Math.floor(dealValue * rate);

    if (pointsEarned <= 0) {
      return { pointsEarned: 0, tierChanged: false, currentTier: null };
    }

    // Get tier before earning
    const tierBefore = await this.calculateTier(clientId, programId);

    // Create the EARN transaction
    const transaction = await LoyaltyPoints.create({
      clientId,
      programId,
      points: pointsEarned,
      transactionType: 'EARN',
      description: `Auto-earn from deal value $${dealValue.toFixed(2)}`,
      tenantId: program.tenantId
    });

    // Get tier after earning
    const tierAfter = await this.calculateTier(clientId, programId);
    const tierChanged = tierBefore.currentTier !== tierAfter.currentTier;

    try {
      io.emit('loyalty:points_earned', { clientId, programId, pointsEarned, totalEarned: tierAfter.totalEarned });
    } catch {}
    if (tierChanged) {
      try {
        io.emit('loyalty:tier_upgrade', { clientId, programId, previousTier: tierBefore.currentTier, currentTier: tierAfter.currentTier });
      } catch {}
    }

    return {
      transaction,
      pointsEarned,
      dealValue,
      tierChanged,
      previousTier: tierBefore.currentTier,
      currentTier: tierAfter.currentTier,
      pointsToNextTier: tierAfter.pointsToNextTier
    };
  }

  /**
   * Dashboard analytics for loyalty across a tenant: total active members,
   * points issued/redeemed, average balance, and tier distribution.
   */
  async getLoyaltyDashboard(tenantId: string) {
    // Total distinct active members (clients who have any point transactions)
    const memberRows = (await LoyaltyPoints.findAll({
      where: { tenantId },
      attributes: [[fn('DISTINCT', col('clientId')), 'clientId']],
      raw: true
    })) as unknown as Array<{ clientId: string }>;
    const totalMembers = memberRows.length;
    const clientIds = memberRows.map(r => r.clientId);

    // Total points issued
    const totalIssued =
      (await LoyaltyPoints.sum('points', {
        where: { tenantId, transactionType: 'EARN' }
      })) || 0;

    // Total points redeemed
    const totalRedeemed =
      (await LoyaltyPoints.sum('points', {
        where: { tenantId, transactionType: 'REDEEM' }
      })) || 0;

    // Total points expired
    const totalExpired =
      (await LoyaltyPoints.sum('points', {
        where: { tenantId, transactionType: 'EXPIRE' }
      })) || 0;

    // Calculate tier distribution
    const tierDistribution: Record<string, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0
    };

    let totalBalance = 0;

    for (const cId of clientIds) {
      const earned =
        (await LoyaltyPoints.sum('points', {
          where: { clientId: cId, tenantId, transactionType: 'EARN' }
        })) || 0;
      const redeemed =
        (await LoyaltyPoints.sum('points', {
          where: { clientId: cId, tenantId, transactionType: 'REDEEM' }
        })) || 0;
      const expired =
        (await LoyaltyPoints.sum('points', {
          where: { clientId: cId, tenantId, transactionType: 'EXPIRE' }
        })) || 0;

      const balance = earned - Math.abs(redeemed) - Math.abs(expired);
      totalBalance += balance;

      // Tier based on total earned
      let tier = 'BRONZE';
      for (const t of DEFAULT_TIERS) {
        if (earned >= t.minPoints) tier = t.name;
      }
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    }

    return {
      totalMembers,
      totalPointsIssued: totalIssued,
      totalPointsRedeemed: Math.abs(totalRedeemed),
      totalPointsExpired: Math.abs(totalExpired),
      averageBalance: totalMembers > 0 ? Math.round(totalBalance / totalMembers) : 0,
      tierDistribution
    };
  }
}
export default new LoyaltyService();
