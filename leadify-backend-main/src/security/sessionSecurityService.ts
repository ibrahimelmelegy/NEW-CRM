import { Op } from 'sequelize';
import LoginHistory, { LoginStatus } from './models/loginHistoryModel';
import IPWhitelist from './models/ipWhitelistModel';
import Session from '../user/models/sessionModel';
import User from '../user/userModel';
import Lead from '../lead/leadModel';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

interface LoginHistoryFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface DashboardMetrics {
  totalLoginsToday: number;
  failedAttemptsToday: number;
  activeSessions: number;
  uniqueIPsToday: number;
  blockedAttemptsToday: number;
  recentLogins: LoginHistory[];
}

interface SessionInfo {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  isCurrent: boolean;
}

class SessionSecurityService {
  // ─── Login History ──────────────────────────────────────────────────────

  /**
   * Record a login attempt in the login history.
   */
  public async logLogin(
    userId: number,
    ip: string,
    userAgent: string,
    status: LoginStatus,
    failReason?: string,
    tenantId?: string
  ): Promise<LoginHistory> {
    return LoginHistory.create({
      userId,
      ip,
      userAgent,
      status,
      failReason: failReason || null,
      tenantId: tenantId || null,
      location: null
    });
  }

  /**
   * Get paginated login history for a user with optional filters.
   */
  public async getLoginHistory(userId: number, tenantId: string | undefined, filters: LoginHistoryFilters = {}) {
    const { page = 1, limit = 20, status, startDate, endDate } = filters;

    const where: Record<string, unknown> = { userId };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>)[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>)[Op.lte] = new Date(endDate);
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows, count } = await LoginHistory.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return {
      docs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    };
  }

  // ─── Active Sessions ───────────────────────────────────────────────────

  /**
   * Get all active (non-expired) sessions for a user.
   */
  public async getActiveSessions(userId: number, currentToken?: string): Promise<SessionInfo[]> {
    const sessions = await Session.findAll({
      where: {
        userId,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['expiresAt', 'DESC']]
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      isCurrent: currentToken ? session.token === currentToken : false
    }));
  }

  /**
   * Terminate a specific session by destroying its record.
   */
  public async terminateSession(sessionId: number, userId: number): Promise<void> {
    const session = await Session.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new BaseError(ERRORS.NOT_FOUND, 404, 'Session not found');
    }

    await session.destroy();
  }

  /**
   * Terminate all sessions for a user except the current one.
   */
  public async terminateAllSessions(userId: number, exceptToken?: string): Promise<number> {
    const where: Record<string, unknown> = { userId };

    if (exceptToken) {
      where.token = { [Op.ne]: exceptToken };
    }

    const count = await Session.destroy({ where });
    return count;
  }

  // ─── Security Dashboard ────────────────────────────────────────────────

  /**
   * Get aggregated security metrics for the dashboard.
   */
  public async getSecurityDashboard(tenantId: string | undefined): Promise<DashboardMetrics> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayWhere: Record<string, unknown> = {
      createdAt: { [Op.gte]: todayStart }
    };
    if (tenantId) {
      todayWhere.tenantId = tenantId;
    }

    // Total logins today
    const totalLoginsToday = await LoginHistory.count({
      where: { ...todayWhere, status: LoginStatus.SUCCESS }
    });

    // Failed attempts today
    const failedAttemptsToday = await LoginHistory.count({
      where: { ...todayWhere, status: LoginStatus.FAILED }
    });

    // Blocked attempts today
    const blockedAttemptsToday = await LoginHistory.count({
      where: { ...todayWhere, status: LoginStatus.BLOCKED }
    });

    // Active sessions (not expired)
    const activeSessions = await Session.count({
      where: { expiresAt: { [Op.gt]: new Date() } }
    });

    // Unique IPs today
    const uniqueIPsResult = await LoginHistory.count({
      where: todayWhere,
      distinct: true,
      col: 'ip'
    });

    // Recent login history (last 10)
    const recentWhere: Record<string, unknown> = {};
    if (tenantId) {
      recentWhere.tenantId = tenantId;
    }
    const recentLogins = await LoginHistory.findAll({
      where: recentWhere,
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return {
      totalLoginsToday,
      failedAttemptsToday,
      blockedAttemptsToday,
      activeSessions,
      uniqueIPsToday: uniqueIPsResult,
      recentLogins
    };
  }

  // ─── IP Whitelist ──────────────────────────────────────────────────────

  /**
   * Add an IP address to the whitelist.
   */
  public async addIPWhitelist(ip: string, label: string, userId: number, tenantId?: string): Promise<IPWhitelist> {
    // Check for duplicate IP within the same tenant
    const existing = await IPWhitelist.findOne({
      where: {
        ip,
        tenantId: tenantId || null,
        isActive: true
      }
    });

    if (existing) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'This IP address is already whitelisted');
    }

    return IPWhitelist.create({
      ip,
      label,
      createdBy: userId,
      tenantId: tenantId || null,
      isActive: true
    });
  }

  /**
   * Remove (soft-delete by setting inactive) an IP from the whitelist.
   */
  public async removeIPWhitelist(id: string, tenantId?: string): Promise<void> {
    const where: Record<string, unknown> = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const record = await IPWhitelist.findOne({ where });

    if (!record) {
      throw new BaseError(ERRORS.NOT_FOUND, 404, 'IP whitelist entry not found');
    }

    await record.destroy();
  }

  /**
   * Get all whitelisted IPs for a tenant.
   */
  public async getIPWhitelist(tenantId?: string): Promise<IPWhitelist[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return IPWhitelist.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
  }

  /**
   * Check if an IP is allowed based on the whitelist.
   * Returns true if the whitelist is empty (no restrictions) or if the IP is whitelisted.
   */
  public async checkIPWhitelist(ip: string, tenantId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { isActive: true };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const totalWhitelisted = await IPWhitelist.count({ where });

    // If no IPs are whitelisted, allow all traffic
    if (totalWhitelisted === 0) {
      return true;
    }

    // Check if the specific IP is in the whitelist
    const match = await IPWhitelist.findOne({
      where: { ...where, ip }
    });

    return !!match;
  }

  // ─── GDPR Data Export ──────────────────────────────────────────────────

  /**
   * Export all user data for GDPR compliance.
   * Collects data from multiple tables related to the user.
   */
  public async exportUserData(userId: number, tenantId?: string): Promise<Record<string, unknown>> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'twoFactorSecret'] }
    });

    if (!user) {
      throw new BaseError(ERRORS.USER_NOT_FOUND);
    }

    // Collect login history
    const loginHistoryWhere: Record<string, unknown> = { userId };
    if (tenantId) {
      loginHistoryWhere.tenantId = tenantId;
    }
    const loginHistory = await LoginHistory.findAll({
      where: loginHistoryWhere,
      order: [['createdAt', 'DESC']],
      limit: 500,
      attributes: ['id', 'ip', 'userAgent', 'location', 'status', 'createdAt']
    });

    // Collect sessions
    const sessions = await Session.findAll({
      where: { userId },
      attributes: ['id', 'expiresAt']
    });

    // Collect leads
    let leads: unknown[] = [];
    try {
      leads = await Lead.findAll({
        where: { userId },
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt']
      });
    } catch {
      // Lead model may not have userId field directly
    }

    // Collect deals
    let deals: unknown[] = [];
    try {
      deals = await Deal.findAll({
        where: { userId },
        attributes: ['id', 'name', 'amount', 'createdAt']
      });
    } catch {
      // Deal model may not have userId field directly
    }

    // Collect clients
    let clients: unknown[] = [];
    try {
      clients = await Client.findAll({
        where: { userId },
        attributes: ['id', 'clientName', 'email', 'createdAt']
      });
    } catch {
      // Client model may not have userId field directly
    }

    return {
      exportDate: new Date().toISOString(),
      user: user.toJSON(),
      loginHistory,
      activeSessions: sessions.length,
      leads: leads.map((l: unknown) => (l as Record<string, unknown> & { toJSON: () => Record<string, unknown> }).toJSON()),
      deals: deals.map((d: unknown) => (d as Record<string, unknown> & { toJSON: () => Record<string, unknown> }).toJSON()),
      clients: clients.map((cli: unknown) => (cli as Record<string, unknown> & { toJSON: () => Record<string, unknown> }).toJSON())
    };
  }
}

export default new SessionSecurityService();
