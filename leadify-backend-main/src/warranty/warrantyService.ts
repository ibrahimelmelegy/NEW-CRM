import { Op, fn, col } from 'sequelize';
import { Warranty, WarrantyClaim } from './warrantyModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class WarrantyService {
  async createWarranty(data: unknown, tenantId?: string) { return Warranty.create({ ...data, tenantId }); }

  async getWarranties(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.productName = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await Warranty.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: WarrantyClaim, as: 'claims' }
      ],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateWarranty(id: number, data: unknown) {
    const item = await Warranty.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return item;
  }

  async deleteWarranty(id: number) {
    await WarrantyClaim.destroy({ where: { warrantyId: id } });
    const item = await Warranty.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  async createClaim(data: unknown, tenantId?: string) {
    const claim = await WarrantyClaim.create({ ...data, tenantId });
    try { io.emit('warranty:claim_created', { id: claim.id, warrantyId: claim.warrantyId, status: claim.status }); } catch {}
    return claim;
  }

  async getClaims(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.warrantyId) where.warrantyId = query.warrantyId;
    if (query.status) where.status = query.status;
    const { rows, count } = await WarrantyClaim.findAndCountAll({
      where,
      include: [{ model: Warranty, as: 'warranty', attributes: ['id', 'productName', 'serialNumber'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updateClaim(id: number, data: unknown) {
    const claim = await WarrantyClaim.findByPk(id);
    if (!claim) return null;
    if (data.status === 'RESOLVED' && !claim.resolvedAt) data.resolvedAt = new Date();
    await claim.update(data);
    return claim;
  }

  // ─── Business Logic ──────────────────────────────────────────────────────────

  /**
   * Extend a warranty's end date by a given number of days.
   * Optionally upgrades the warranty type to EXTENDED.
   * Only ACTIVE warranties can be extended.
   */
  async extendWarranty(id: number, data: { extensionDays: number; reason?: string; upgradeType?: boolean }) {
    const warranty = await Warranty.findByPk(id);
    if (!warranty) throw new Error('Warranty not found');
    if (warranty.status !== 'ACTIVE') {
      throw new Error(`Cannot extend warranty with status "${warranty.status}". Only ACTIVE warranties can be extended.`);
    }
    if (!data.extensionDays || data.extensionDays <= 0) {
      throw new Error('extensionDays must be a positive number');
    }

    const currentEnd = new Date(warranty.endDate);
    currentEnd.setDate(currentEnd.getDate() + data.extensionDays);
    const newEndDate = currentEnd.toISOString().slice(0, 10);

    const updateData: Record<string, unknown> = { endDate: newEndDate };
    if (data.upgradeType) {
      updateData.type = 'EXTENDED';
    }
    if (data.reason) {
      updateData.terms = warranty.terms
        ? `${warranty.terms}\n[Extension ${new Date().toISOString().slice(0, 10)}]: ${data.reason}`
        : `[Extension ${new Date().toISOString().slice(0, 10)}]: ${data.reason}`;
    }

    await warranty.update(updateData);
    try {
      io.emit('warranty:extended', {
        id: warranty.id,
        productName: warranty.productName,
        previousEndDate: warranty.endDate,
        newEndDate,
        extensionDays: data.extensionDays
      });
    } catch {}

    return warranty;
  }

  /**
   * Bulk-expire warranties whose endDate has passed.
   * Returns the count of warranties moved from ACTIVE to EXPIRED.
   */
  async expireOverdueWarranties(tenantId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const where: Record<string, unknown> = { status: 'ACTIVE', endDate: { [Op.lt]: today } };
    if (tenantId) where.tenantId = tenantId;

    const [affectedCount] = await Warranty.update(
      { status: 'EXPIRED' },
      { where }
    );

    if (affectedCount > 0) {
      try { io.emit('warranty:bulk_expired', { tenantId, count: affectedCount }); } catch {}
    }

    return { expiredCount: affectedCount };
  }

  /**
   * Check whether a warranty covers a claim on a given date.
   * Returns coverage status, days remaining, and the coverage type.
   */
  async checkWarrantyCoverage(warrantyId: number, claimDate?: string) {
    const warranty = await Warranty.findByPk(warrantyId);
    if (!warranty) throw new Error('Warranty not found');

    const checkDate = claimDate ? new Date(claimDate) : new Date();
    const start = new Date(warranty.startDate);
    const end = new Date(warranty.endDate);
    const now = checkDate.getTime();

    const covered = warranty.status === 'ACTIVE' && now >= start.getTime() && now <= end.getTime();
    const daysRemaining = covered
      ? Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24))
      : 0;

    // For LIFETIME warranties, set a large remaining value
    const isLifetime = warranty.type === 'LIFETIME';

    return {
      warrantyId: warranty.id,
      productName: warranty.productName,
      serialNumber: warranty.serialNumber,
      coverageType: warranty.type,
      status: warranty.status,
      startDate: warranty.startDate,
      endDate: warranty.endDate,
      claimDate: checkDate.toISOString().slice(0, 10),
      covered,
      daysRemaining: isLifetime && covered ? 999999 : daysRemaining,
      reason: !covered
        ? warranty.status !== 'ACTIVE'
          ? `Warranty status is ${warranty.status}`
          : now < start.getTime()
            ? 'Warranty has not started yet'
            : 'Warranty has expired'
        : null
    };
  }

  /**
   * Create a warranty claim with automatic coverage validation.
   * If the warranty is not active or the claim date falls outside coverage, throws an error.
   */
  async createClaimWithValidation(data: unknown, tenantId?: string) {
    const { warrantyId } = data;
    if (!warrantyId) throw new Error('warrantyId is required');

    const coverage = await this.checkWarrantyCoverage(warrantyId);
    if (!coverage.covered) {
      const err: Record<string, unknown> = new Error(`Warranty does not cover this claim: ${coverage.reason}`);
      err.statusCode = 400;
      err.coverage = coverage;
      throw err;
    }

    const claim = await WarrantyClaim.create({ ...data, tenantId });
    try { io.emit('warranty:claim_created', { id: claim.id, warrantyId: claim.warrantyId, status: claim.status }); } catch {}
    return claim;
  }

  /**
   * Return warranties expiring within the next N days (default 30).
   */
  async getExpiringWarranties(tenantId: string, daysAhead = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const todayStr = today.toISOString().slice(0, 10);
    const futureStr = futureDate.toISOString().slice(0, 10);

    const warranties = await Warranty.findAll({
      where: {
        tenantId,
        status: 'ACTIVE',
        endDate: { [Op.between]: [todayStr, futureStr] }
      },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] }
      ],
      order: [['endDate', 'ASC']]
    });

    const results = warranties.map(w => {
      const daysLeft = Math.ceil(
        (new Date(w.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: w.id,
        productName: w.productName,
        serialNumber: w.serialNumber,
        type: w.type,
        endDate: w.endDate,
        daysRemaining: daysLeft,
        client: w.client
      };
    });

    if (results.length > 0) {
      try { io.emit('warranty:expiring', { tenantId, daysAhead, count: results.length, warranties: results.slice(0, 10) }); } catch {}
    }
    return results;
  }

  /**
   * Compute warranty analytics for a tenant:
   * total active, total expired, claims filed / resolved, average resolution time.
   */
  async getWarrantyAnalytics(tenantId: string) {
    const where: Record<string, unknown> = { tenantId };

    // Count by status
    const statusCounts = await Warranty.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    }) as unknown as Array<{ status: string; count: string }>;

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) byStatus[row.status] = Number(row.count);

    const totalActive = byStatus['ACTIVE'] || 0;
    const totalExpired = byStatus['EXPIRED'] || 0;

    // Claims
    const totalClaims = await WarrantyClaim.count({ where });
    const claimStatusCounts = await WarrantyClaim.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    }) as unknown as Array<{ status: string; count: string }>;

    const claimsByStatus: Record<string, number> = {};
    for (const row of claimStatusCounts) claimsByStatus[row.status] = Number(row.count);

    // Average resolution time (for resolved claims)
    const resolvedClaims = await WarrantyClaim.findAll({
      where: { ...where, status: 'RESOLVED', resolvedAt: { [Op.ne]: null } }
    });

    let totalResolutionDays = 0;
    for (const claim of resolvedClaims) {
      if (claim.resolvedAt && claim.createdAt) {
        const days = Math.ceil(
          (new Date(claim.resolvedAt).getTime() - new Date(claim.createdAt as any).getTime()) / (1000 * 60 * 60 * 24)
        );
        totalResolutionDays += days;
      }
    }

    const avgResolutionDays = resolvedClaims.length > 0
      ? Number((totalResolutionDays / resolvedClaims.length).toFixed(1))
      : null;

    return {
      warranties: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        active: totalActive,
        expired: totalExpired,
        byStatus
      },
      claims: {
        total: totalClaims,
        resolved: claimsByStatus['RESOLVED'] || 0,
        open: claimsByStatus['OPEN'] || 0,
        inReview: claimsByStatus['IN_REVIEW'] || 0,
        approved: claimsByStatus['APPROVED'] || 0,
        rejected: claimsByStatus['REJECTED'] || 0,
        byStatus: claimsByStatus,
        avgResolutionDays
      }
    };
  }
}
export default new WarrantyService();
