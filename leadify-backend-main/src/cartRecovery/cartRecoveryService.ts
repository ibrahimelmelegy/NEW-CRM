import { Op } from 'sequelize';
import AbandonedCart from './abandonedCartModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

class CartRecoveryService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: Record<string, unknown>, tenantId?: string) {
    // Auto-calculate totalValue from items if not provided
    if (data.items && Array.isArray(data.items) && !data.totalValue) {
      data.totalValue = data.items.reduce((sum: number, item: Record<string, unknown>) => sum + item.price * item.quantity, 0);
    }
    if (!data.abandonedAt) data.abandonedAt = new Date();
    const cart = await AbandonedCart.create({ ...data, tenantId });
    try {
      io.emit('cart:abandoned', { id: cart.id, totalValue: cart.totalValue });
    } catch (_ignored: unknown) { /* non-critical */ }
    return cart;
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.recoveryStatus) where.recoveryStatus = query.recoveryStatus;
    if (query.customerId) where.customerId = query.customerId;
    if (query.minValue) where.totalValue = { ...(where.totalValue || {}), [Op.gte]: Number(query.minValue) };
    if (query.maxValue) where.totalValue = { ...(where.totalValue || {}), [Op.lte]: Number(query.maxValue) };
    if (query.fromDate || query.toDate) {
      where.abandonedAt = {};
      if (query.fromDate) where.abandonedAt[Op.gte] = new Date(query.fromDate);
      if (query.toDate) where.abandonedAt[Op.lte] = new Date(query.toDate);
    }

    try {
      const { rows, count } = await AbandonedCart.findAndCountAll({
        where,
        include: [{ model: Client, as: 'customer', attributes: ['id', 'clientName', 'email'], required: false }],
        order: [['abandonedAt', 'DESC']],
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
    return AbandonedCart.findByPk(id, {
      include: [{ model: Client, as: 'customer', attributes: ['id', 'clientName', 'email'] }]
    });
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await AbandonedCart.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try {
      io.emit('cart:updated', { id: item.id });
    } catch (_ignored: unknown) { /* non-critical */ }
    return item;
  }

  async delete(id: number) {
    const item = await AbandonedCart.findByPk(id);
    if (!item) return false;
    await item.destroy();
    return true;
  }

  // ─── Recovery Actions ──────────────────────────────────────────────────────────

  /**
   * Simulate sending a recovery reminder email.
   * Updates the cart's reminder count and status.
   */
  async sendRecoveryReminder(id: number) {
    const cart = await AbandonedCart.findByPk(id);
    if (!cart) return null;
    if (cart.recoveryStatus === 'RECOVERED') return { message: 'Cart already recovered' };
    if (cart.recoveryStatus === 'EXPIRED') return { message: 'Cart has expired' };

    const now = new Date();
    await cart.update({
      recoveryStatus: 'REMINDED',
      lastReminder: now,
      reminderCount: cart.reminderCount + 1
    });

    try {
      io.emit('cart:reminderSent', { id: cart.id, customerId: cart.customerId, reminderCount: cart.reminderCount });
    } catch (_ignored: unknown) { /* non-critical */ }

    return {
      success: true,
      cartId: cart.id,
      customerId: cart.customerId,
      customerEmail: cart.customerEmail,
      reminderCount: cart.reminderCount,
      sentAt: now
    };
  }

  /** Mark a cart as recovered (customer completed purchase) */
  async markRecovered(id: number) {
    const cart = await AbandonedCart.findByPk(id);
    if (!cart) return null;

    await cart.update({
      recoveryStatus: 'RECOVERED',
      recoveredAt: new Date()
    });

    try {
      io.emit('cart:recovered', { id: cart.id, totalValue: cart.totalValue });
    } catch (_ignored: unknown) { /* non-critical */ }
    return cart;
  }

  /** Expire old abandoned carts beyond a threshold (e.g. 30 days) */
  async expireOldCarts(days = 30, tenantId?: string) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const where: Record<string, unknown> = {
      recoveryStatus: { [Op.in]: ['ABANDONED', 'REMINDED'] },
      abandonedAt: { [Op.lt]: cutoff }
    };
    if (tenantId) where.tenantId = tenantId;

    const [affectedCount] = await AbandonedCart.update({ recoveryStatus: 'EXPIRED' }, { where });

    return { expiredCount: affectedCount };
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────────

  /** Get recovery funnel statistics */
  async getRecoveryStats(tenantId?: string) {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;

    const all = await AbandonedCart.findAll({ where, raw: true });

    let totalAbandoned = 0,
      totalReminded = 0,
      totalRecovered = 0,
      totalExpired = 0;
    let abandonedValue = 0,
      recoveredValue = 0;

    for (const c of all) {
      const cart = c as Record<string, unknown>;
      const val = Number(cart.totalValue) || 0;
      switch (cart.recoveryStatus) {
        case 'ABANDONED':
          totalAbandoned++;
          abandonedValue += val;
          break;
        case 'REMINDED':
          totalReminded++;
          abandonedValue += val;
          break;
        case 'RECOVERED':
          totalRecovered++;
          recoveredValue += val;
          break;
        case 'EXPIRED':
          totalExpired++;
          break;
      }
    }

    const recoveryRate = all.length > 0 ? parseFloat(((totalRecovered / all.length) * 100).toFixed(1)) : 0;

    return {
      total: all.length,
      abandoned: totalAbandoned,
      reminded: totalReminded,
      recovered: totalRecovered,
      expired: totalExpired,
      recoveryRate,
      abandonedValue: parseFloat(abandonedValue.toFixed(2)),
      recoveredValue: parseFloat(recoveredValue.toFixed(2))
    };
  }
}

export default new CartRecoveryService();
