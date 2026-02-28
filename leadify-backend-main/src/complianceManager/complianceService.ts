import { Op } from 'sequelize';
import ConsentRecord from './consentRecordModel';
import DataRequest from './dataRequestModel';
import User from '../user/userModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class ComplianceService {
  // ─── Consent Record CRUD ──────────────────────────────────────────────────────

  async createConsent(data: any, tenantId?: string) {
    if (!data.consentDate) data.consentDate = new Date();
    const record = await ConsentRecord.create({ ...data, tenantId });
    try { io.emit('consent:created', { id: record.id, contactId: record.contactId }); } catch {}
    return record;
  }

  async getAllConsents(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.contactId) where.contactId = query.contactId;
    if (query.regulation) where.regulation = query.regulation;
    if (query.search) where.contactEmail = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await ConsentRecord.findAndCountAll({
      where, order: [['consentDate', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getConsentById(id: number) {
    return ConsentRecord.findByPk(id);
  }

  async updateConsent(id: number, data: any) {
    const item = await ConsentRecord.findByPk(id);
    if (!item) return null;
    // If withdrawing consent, set withdrawnAt
    if (data.status === 'WITHDRAWN' && item.status !== 'WITHDRAWN') {
      data.withdrawnAt = new Date();
    }
    await item.update(data);
    try { io.emit('consent:updated', { id: item.id, status: item.status }); } catch {}
    return item;
  }

  async deleteConsent(id: number) {
    const item = await ConsentRecord.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Data Request CRUD ────────────────────────────────────────────────────────

  async createDataRequest(data: any, tenantId?: string) {
    // Default deadline: 30 days from now (GDPR requirement)
    if (!data.deadline) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      data.deadline = deadline;
    }
    const request = await DataRequest.create({ ...data, tenantId });
    try { io.emit('dataRequest:created', { id: request.id, type: request.type }); } catch {}
    return request;
  }

  async getAllDataRequests(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.requesterId) where.requesterId = query.requesterId;

    const { rows, count } = await DataRequest.findAndCountAll({
      where,
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }],
      order: [['deadline', 'ASC']],
      limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getDataRequestById(id: number) {
    return DataRequest.findByPk(id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });
  }

  async processDataRequest(id: number, data: { status: string; resolution?: string; assignedTo?: number }) {
    const request = await DataRequest.findByPk(id);
    if (!request) return null;

    const updateData: any = { status: data.status };
    if (data.resolution) updateData.resolution = data.resolution;
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();

    await request.update(updateData);
    try { io.emit('dataRequest:processed', { id: request.id, status: data.status }); } catch {}
    return request;
  }

  // ─── Compliance Audit ─────────────────────────────────────────────────────────

  /**
   * Run a compliance audit across all consent records and data requests.
   * Checks for expired consents, overdue data requests, and missing consent coverage.
   */
  async runAudit(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const now = new Date();
    const issues: Array<{ type: string; severity: string; description: string; entityId: number }> = [];

    // Check for expired consents still marked as active
    const expiredConsents = await ConsentRecord.findAll({
      where: { ...where, status: 'ACTIVE', expiryDate: { [Op.lt]: now } }
    });
    for (const c of expiredConsents) {
      issues.push({ type: 'EXPIRED_CONSENT', severity: 'HIGH', description: `Consent ${c.id} for contact ${c.contactId} has expired but is still active`, entityId: c.id });
      await c.update({ status: 'EXPIRED' });
    }

    // Check for overdue data requests
    const overdueRequests = await DataRequest.findAll({
      where: { ...where, status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }, deadline: { [Op.lt]: now } }
    });
    for (const r of overdueRequests) {
      issues.push({ type: 'OVERDUE_REQUEST', severity: 'CRITICAL', description: `Data request ${r.id} (${r.type}) is past deadline`, entityId: r.id });
      await r.update({ status: 'OVERDUE' });
    }

    // Check for data requests approaching deadline (within 5 days)
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const approachingDeadline = await DataRequest.findAll({
      where: { ...where, status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }, deadline: { [Op.between]: [now, fiveDaysFromNow] } }
    });
    for (const r of approachingDeadline) {
      issues.push({ type: 'APPROACHING_DEADLINE', severity: 'MEDIUM', description: `Data request ${r.id} (${r.type}) deadline approaching`, entityId: r.id });
    }

    try { io.emit('compliance:auditCompleted', { issueCount: issues.length }); } catch {}

    return {
      auditDate: now,
      issuesFound: issues.length,
      issues,
      expiredConsentsFixed: expiredConsents.length,
      overdueRequestsMarked: overdueRequests.length
    };
  }

  // ─── Compliance Score ─────────────────────────────────────────────────────────

  /** Calculate an overall compliance score based on consent coverage and request resolution */
  async getComplianceScore(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const totalConsents = await ConsentRecord.count({ where });
    const activeConsents = await ConsentRecord.count({ where: { ...where, status: 'ACTIVE' } });
    const expiredConsents = await ConsentRecord.count({ where: { ...where, status: 'EXPIRED' } });
    const withdrawnConsents = await ConsentRecord.count({ where: { ...where, status: 'WITHDRAWN' } });

    const totalRequests = await DataRequest.count({ where });
    const completedRequests = await DataRequest.count({ where: { ...where, status: 'COMPLETED' } });
    const overdueRequests = await DataRequest.count({ where: { ...where, status: 'OVERDUE' } });
    const pendingRequests = await DataRequest.count({ where: { ...where, status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] } } });

    // Score calculation (0-100)
    let score = 100;

    // Deduct for expired consents (up to -30 pts)
    if (totalConsents > 0) {
      score -= Math.min(30, (expiredConsents / totalConsents) * 60);
    }

    // Deduct for overdue data requests (up to -40 pts)
    if (totalRequests > 0) {
      score -= Math.min(40, (overdueRequests / totalRequests) * 80);
    }

    // Bonus for high completion rate (up to +10 pts)
    if (totalRequests > 0) {
      const completionRate = completedRequests / totalRequests;
      score += completionRate * 10;
    }

    score = Math.max(0, Math.min(100, parseFloat(score.toFixed(0))));

    return {
      score,
      consent: { total: totalConsents, active: activeConsents, expired: expiredConsents, withdrawn: withdrawnConsents },
      dataRequests: { total: totalRequests, completed: completedRequests, overdue: overdueRequests, pending: pendingRequests },
      rating: score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'NEEDS_IMPROVEMENT' : 'CRITICAL'
    };
  }
}

export default new ComplianceService();
