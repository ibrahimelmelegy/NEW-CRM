import { Op, WhereOptions } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import PurchaseOrder, { POStatusEnum } from './models/purchaseOrderModel';
import PurchaseOrderItem from './models/purchaseOrderItemModel';
import Vendor from '../vendor/vendorModel';
import Project from '../project/models/projectModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { createActivityLog } from '../activity-logs/activityService';
import { sequelize } from '../config/db';

class ProcurementService {
  async createPurchaseOrder(input: Record<string, unknown>, user: User): Promise<PurchaseOrder> {
    const transaction = await sequelize.transaction();
    try {
      const { items, ...poData } = input;
      const poCount = await PurchaseOrder.count();
      const poNumber = `PO-${new Date().getFullYear()}-${(poCount + 1).toString().padStart(4, '0')}`;

      const purchaseOrder = await PurchaseOrder.create({ ...poData, poNumber, createdBy: user.id }, { transaction });

      if (items && Array.isArray(items)) {
        if (items.length === 0) {
          throw new BaseError(400, 400, 'Purchase Order must have at least one item');
        }

        const poItems = items.map(item => {
          if (Number(item.unitPrice) < 0) throw new BaseError(400, 400, `Invalid Unit Price for item: ${item.description}`);
          if (Number(item.quantity) <= 0) throw new BaseError(400, 400, `Invalid Quantity for item: ${item.description}`);

          return {
            ...item,
            purchaseOrderId: purchaseOrder.id
          };
        });
        await PurchaseOrderItem.bulkCreate(poItems, { transaction });
      } else {
        throw new BaseError(400, 400, 'Purchase Order must have items');
      }

      await transaction.commit();
      await createActivityLog('purchaseOrder', 'create', purchaseOrder.id, user.id, null, `Purchase Order ${poNumber} created`);
      return purchaseOrder;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updatePurchaseOrderStatus(id: string, status: POStatusEnum, user: User, rejectionReason?: string): Promise<PurchaseOrder> {
    const po = await this.poOrError({ id });
    po.status = status;
    if (rejectionReason) po.rejectionReason = rejectionReason;
    await po.save();

    const action: string = status === POStatusEnum.APPROVED ? 'approve' : status === POStatusEnum.REJECTED ? 'reject' : 'update';
    await createActivityLog('purchaseOrder', action as unknown, po.id, user.id, null, `Purchase Order ${po.poNumber} status updated to ${status}`);
    return po;
  }

  async poOrError(filter: WhereOptions): Promise<PurchaseOrder> {
    const po = await PurchaseOrder.findOne({
      where: filter,
      include: [
        { model: Vendor },
        { model: Project },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: PurchaseOrderItem, as: 'items' }
      ]
    });
    if (!po) throw new BaseError(ERRORS.PURCHASE_ORDER_NOT_FOUND);
    return po;
  }

  async getPurchaseOrders(query: Record<string, unknown>): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, status, projectId, vendorId } = query;

    const { rows: pos, count: totalItems } = await PurchaseOrder.findAndCountAll({
      where: {
        ...(searchKey && {
          [Op.or]: [{ poNumber: { [Op.iLike]: `%${searchKey}%` } }]
        }),
        ...(status && { status }),
        ...(projectId && { projectId }),
        ...(vendorId && { vendorId })
      },
      include: [
        { model: Vendor, attributes: ['id', 'name'] },
        { model: Project, attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      docs: pos,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async getPOById(id: string): Promise<PurchaseOrder> {
    return await this.poOrError({ id });
  }

  async getDashboardStats(): Promise<unknown> {
    // 1. KPI: Total POs and Total Spend
    const totalPos = await PurchaseOrder.count();
    const totalSpendResult = await PurchaseOrder.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']],
      raw: true
    });
    const totalSpend = (totalSpendResult[0] as Record<string, unknown>)?.total || 0;

    // 2. KPI: Pending Queue
    const pendingCount = await PurchaseOrder.count({ where: { status: POStatusEnum.PENDING } });

    // 3. Top Suppliers by Volume (Spend)
    const topVendors = await PurchaseOrder.findAll({
      attributes: [
        [sequelize.col('vendor.name'), 'name'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'value']
      ],
      include: [{ model: Vendor, attributes: [] }],
      group: ['vendor.id', 'vendor.name'],
      order: [[sequelize.fn('SUM', sequelize.col('totalAmount')), 'DESC']],
      limit: 5,
      raw: true
    });

    // 4. Procurement Trend (Last 6 Months)
    // Simplified: Group by month of createdAt.
    // Note: For production, generate a date range series and left join, but for now strict grouping is fine.
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 5);

    const monthlyTrend = await PurchaseOrder.findAll({
      attributes: [
        // Extract month/year. Syntax depends on DB (Postgres here).
        [sequelize.fn('to_char', sequelize.col('createdAt'), 'Mon'), 'month'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'value']
      ],
      where: {
        createdAt: { [Op.gte]: threeMonthsAgo }
      },
      group: [sequelize.fn('to_char', sequelize.col('createdAt'), 'Mon'), sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // 5. Recent Transactions
    const recentTransactions = await PurchaseOrder.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Vendor, attributes: ['name'] }],
      attributes: ['id', 'poNumber', 'totalAmount', 'status', 'createdAt']
    });

    return {
      kpi: {
        totalPos,
        totalSpend: Number(totalSpend),
        pendingCount
      },
      charts: {
        topVendors,
        monthlyTrend
      },
      recentTransactions
    };
  }
  /**
   * Receive a purchase order: validates it is in APPROVED status,
   * then transitions to "Received" (Archived) status. Records the receipt
   * and computes any variance between ordered and received quantities.
   */
  async receivePurchaseOrder(id: string, receivedItems: Array<{ itemId: number; receivedQuantity: number }>, user: User): Promise<PurchaseOrder> {
    const po = await this.poOrError({ id });

    if (po.status !== POStatusEnum.APPROVED) {
      throw new BaseError(400, 400, `Cannot receive a PO with status "${po.status}". Only Approved POs can be received.`);
    }

    const transaction = await sequelize.transaction();
    try {
      // If received items are provided, compute variance per line item
      const variances: Array<{ itemId: number; ordered: number; received: number; variance: number }> = [];
      if (receivedItems && receivedItems.length > 0) {
        for (const ri of receivedItems) {
          const poItem = po.items?.find(item => item.id === ri.itemId);
          if (poItem) {
            const variance = ri.receivedQuantity - poItem.quantity;
            variances.push({
              itemId: ri.itemId,
              ordered: poItem.quantity,
              received: ri.receivedQuantity,
              variance
            });
          }
        }
      }

      po.status = POStatusEnum.ARCHIVED;
      await po.save({ transaction });

      await transaction.commit();

      await createActivityLog('purchaseOrder', 'update', po.id, user.id, null, `PO ${po.poNumber} received. ${variances.length} items checked.`);

      return Object.assign(po, { variances });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Compare vendors based on their PO history:
   * total POs, total spend, average order value, on-time delivery count,
   * rejection rate. Returns vendors sorted by total spend descending.
   */
  async getVendorComparison(): Promise<unknown> {
    const vendors = await Vendor.findAll({ attributes: ['id', 'name'] });

    const comparison = await Promise.all(
      vendors.map(async (vendor: Record<string, unknown>) => {
        const allPOs = await PurchaseOrder.findAll({
          where: { vendorId: vendor.id }
        });

        const totalPOs = allPOs.length;
        if (totalPOs === 0) return null;

        const totalSpend = allPOs.reduce((sum: number, po: Record<string, unknown>) => sum + Number(po.totalAmount || 0), 0);
        const avgOrderValue = totalPOs > 0 ? Math.round((totalSpend / totalPOs) * 100) / 100 : 0;

        const approvedCount = allPOs.filter(po => po.status === POStatusEnum.APPROVED || po.status === POStatusEnum.ARCHIVED).length;
        const rejectedCount = allPOs.filter(po => po.status === POStatusEnum.REJECTED).length;
        const pendingCount = allPOs.filter(po => po.status === POStatusEnum.PENDING).length;
        const rejectionRate = totalPOs > 0 ? Math.round((rejectedCount / totalPOs) * 10000) / 100 : 0;

        // On-time: POs that were archived (received) before or on dueDate
        const onTimeCount = allPOs.filter(po => {
          if (po.status !== POStatusEnum.ARCHIVED || !po.dueDate) return false;
          return new Date(po.updatedAt) <= new Date(po.dueDate);
        }).length;

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          totalPOs,
          totalSpend,
          avgOrderValue,
          approvedCount,
          rejectedCount,
          pendingCount,
          rejectionRate,
          onTimeCount,
          fulfillmentRate: totalPOs > 0 ? Math.round((approvedCount / totalPOs) * 10000) / 100 : 0
        };
      })
    );

    return comparison.filter(Boolean).sort((a: unknown, b: unknown) => b.totalSpend - a.totalSpend);
  }

  async removePurchaseOrder(id: string, user: User): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const po = await this.poOrError({ id });

      // Delete items first
      await PurchaseOrderItem.destroy({ where: { purchaseOrderId: id }, transaction });
      await po.destroy({ transaction });

      await transaction.commit();
      await createActivityLog('purchaseOrder', 'delete', id, user.id, null, `Purchase Order ${po.poNumber} deleted`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new ProcurementService();
