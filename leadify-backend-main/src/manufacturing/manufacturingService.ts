import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../config/db';
import BOM from './bomModel';
import BOMItem from './bomItemModel';
import WorkOrder from './workOrderModel';
import QualityCheck from './qualityCheckModel';
import { tenantWhere, tenantCreate } from '../utils/tenantScope';
import { io } from '../server';

class ManufacturingService {
  // ─── BOM ───────────────────────────────────────────────────────────

  async getBOMs(user: any) {
    return BOM.findAll({
      where: { ...tenantWhere(user) },
      include: [{ model: BOMItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });
  }

  async getBOMById(id: number, user: any) {
    const bom = await BOM.findOne({
      where: { id, ...tenantWhere(user) },
      include: [{ model: BOMItem, as: 'items' }]
    });
    if (!bom) throw new Error('BOM not found');
    return bom;
  }

  async createBOM(data: any, user: any) {
    const t = await sequelize.transaction();
    try {
      const bom = await BOM.create(
        tenantCreate(
          {
            productName: data.productName,
            code: data.code,
            version: data.version || 1,
            isActive: data.isActive ?? false,
            totalCost: 0
          },
          user
        ),
        { transaction: t }
      );

      let totalCost = 0;
      if (data.items?.length) {
        for (const item of data.items) {
          await BOMItem.create(
            {
              bomId: bom.id,
              name: item.name,
              type: item.type || 'RAW',
              quantity: item.quantity || 1,
              unit: item.unit || 'pc',
              unitCost: item.unitCost || 0
            },
            { transaction: t }
          );
          totalCost += (item.quantity || 1) * (item.unitCost || 0);
        }
        await bom.update({ totalCost }, { transaction: t });
      }

      await t.commit();
      return this.getBOMById(bom.id, user);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateBOM(id: number, data: any, user: any) {
    const bom = await BOM.findOne({ where: { id, ...tenantWhere(user) } });
    if (!bom) throw new Error('BOM not found');

    const t = await sequelize.transaction();
    try {
      await bom.update(
        {
          productName: data.productName ?? bom.productName,
          code: data.code ?? bom.code,
          version: data.version ?? bom.version,
          isActive: data.isActive ?? bom.isActive
        },
        { transaction: t }
      );

      if (data.items) {
        await BOMItem.destroy({ where: { bomId: id }, transaction: t });
        let totalCost = 0;
        for (const item of data.items) {
          await BOMItem.create(
            {
              bomId: id,
              name: item.name,
              type: item.type || 'RAW',
              quantity: item.quantity || 1,
              unit: item.unit || 'pc',
              unitCost: item.unitCost || 0
            },
            { transaction: t }
          );
          totalCost += (item.quantity || 1) * (item.unitCost || 0);
        }
        await bom.update({ totalCost }, { transaction: t });
      }

      await t.commit();
      return this.getBOMById(id, user);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async deleteBOM(id: number, user: any) {
    const bom = await BOM.findOne({ where: { id, ...tenantWhere(user) } });
    if (!bom) throw new Error('BOM not found');
    await BOMItem.destroy({ where: { bomId: id } });
    await bom.destroy();
    return { deleted: true };
  }

  async duplicateBOM(id: number, user: any) {
    const original = await this.getBOMById(id, user);
    const data = {
      productName: `${original.productName} (Copy)`,
      code: `${original.code}-COPY`,
      version: 1,
      isActive: false,
      items: original.items?.map(i => ({
        name: i.name,
        type: i.type,
        quantity: i.quantity,
        unit: i.unit,
        unitCost: i.unitCost
      }))
    };
    return this.createBOM(data, user);
  }

  // ─── Work Orders ──────────────────────────────────────────────────

  async generateWONumber(tenantId?: string) {
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;

    const last = await WorkOrder.findOne({
      where,
      order: [['id', 'DESC']]
    });
    const num = last ? parseInt(last.woNumber.replace('WO-', ''), 10) + 1 : 1;
    return `WO-${String(num).padStart(3, '0')}`;
  }

  async getWorkOrders(user: any, query?: Record<string, any>) {
    const where: Record<string, any> = { ...tenantWhere(user) };
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;

    return WorkOrder.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }

  async getWorkOrderById(id: number, user: any) {
    const wo = await WorkOrder.findOne({
      where: { id, ...tenantWhere(user) },
      include: [{ model: BOM, as: 'bom', include: [{ model: BOMItem, as: 'items' }] }]
    });
    if (!wo) throw new Error('Work order not found');
    return wo;
  }

  async createWorkOrder(data: any, user: any) {
    const woNumber = await this.generateWONumber(user?.tenantId);

    let productName = data.productName || '';
    let bomCode = data.bomCode || '';

    if (data.bomId) {
      const bom = await BOM.findByPk(data.bomId);
      if (bom) {
        productName = productName || bom.productName;
        bomCode = bomCode || bom.code;
      }
    }

    return WorkOrder.create(
      tenantCreate(
        {
          woNumber,
          productName,
          bomId: data.bomId || null,
          bomCode,
          planned: data.quantity || data.planned || 0,
          produced: 0,
          priority: data.priority || 'NORMAL',
          status: 'PLANNED',
          dueDate: data.dueDate || null
        },
        user
      )
    );
  }

  async updateWorkOrder(id: number, data: any, user: any) {
    const wo = await WorkOrder.findOne({ where: { id, ...tenantWhere(user) } });
    if (!wo) throw new Error('Work order not found');
    await wo.update(data);
    return wo;
  }

  async updateProduction(id: number, produced: number, user: any) {
    const wo = await WorkOrder.findOne({ where: { id, ...tenantWhere(user) } });
    if (!wo) throw new Error('Work order not found');

    const newProduced = Math.min(produced, wo.planned);
    const status = newProduced >= wo.planned ? 'COMPLETED' : 'IN_PROGRESS';
    await wo.update({ produced: newProduced, status });
    return wo;
  }

  // ─── Quality Checks ───────────────────────────────────────────────

  async getQualityChecks(user: any) {
    return QualityCheck.findAll({
      where: { ...tenantWhere(user) },
      order: [['createdAt', 'DESC']]
    });
  }

  async createQualityCheck(data: any, user: any) {
    const defects = data.inspected - data.passed;
    const passRate = data.inspected > 0 ? data.passed / data.inspected : 0;
    const result = passRate >= 0.95 ? 'PASS' : 'FAIL';

    return QualityCheck.create(
      tenantCreate(
        {
          workOrderId: data.workOrderId || null,
          woNumber: data.woNumber || null,
          product: data.product || null,
          inspector: data.inspector || null,
          inspected: data.inspected || 0,
          passed: data.passed || 0,
          defects,
          result: data.result || result
        },
        user
      )
    );
  }

  // ─── Delete Work Order ──────────────────────────────────────────────

  async deleteWorkOrder(id: number, user: any) {
    const wo = await WorkOrder.findOne({ where: { id, ...tenantWhere(user) } });
    if (!wo) throw new Error('Work order not found');
    if (wo.status === 'IN_PROGRESS') {
      throw new Error('Cannot delete an in-progress work order. Cancel it first.');
    }
    await wo.destroy();
    try {
      io.emit('manufacturing:work_order_deleted', { id, woNumber: wo.woNumber });
    } catch {}
    return { deleted: true };
  }

  // ─── Track Production ──────────────────────────────────────────────

  /**
   * Record a production run against a work order.
   * Adds the produced quantity, validates it does not exceed planned,
   * automatically transitions status, and logs a quality check if defects are reported.
   */
  async trackProduction(id: number, data: { produced: number; defects?: number; inspector?: string; notes?: string }, user: any) {
    const wo = await WorkOrder.findOne({ where: { id, ...tenantWhere(user) } });
    if (!wo) throw new Error('Work order not found');
    if (wo.status === 'COMPLETED') throw new Error('Work order is already completed');
    if (wo.status === 'CANCELLED') throw new Error('Cannot track production on a cancelled work order');

    const increment = Math.max(0, data.produced);
    const newProduced = Math.min(wo.produced + increment, wo.planned);
    const status = newProduced >= wo.planned ? 'COMPLETED' : 'IN_PROGRESS';

    await wo.update({ produced: newProduced, status });

    // If defects are reported, create a quality check record automatically
    let qualityCheck = null;
    if (data.defects !== undefined && data.defects > 0) {
      const passed = increment - Math.min(data.defects, increment);
      const passRate = increment > 0 ? passed / increment : 0;
      qualityCheck = await QualityCheck.create(
        tenantCreate(
          {
            workOrderId: id,
            woNumber: wo.woNumber,
            product: wo.productName,
            inspector: data.inspector || null,
            inspected: increment,
            passed,
            defects: Math.min(data.defects, increment),
            result: passRate >= 0.95 ? 'PASS' : 'FAIL'
          },
          user
        )
      );
    }

    try {
      io.emit('manufacturing:production_tracked', {
        workOrderId: id,
        woNumber: wo.woNumber,
        produced: newProduced,
        planned: wo.planned,
        status,
        percentComplete: wo.planned > 0 ? Math.round((newProduced / wo.planned) * 100) : 0
      });
    } catch {}

    return { workOrder: wo, qualityCheck, percentComplete: wo.planned > 0 ? Math.round((newProduced / wo.planned) * 100) : 0 };
  }

  // ─── Production Metrics ────────────────────────────────────────────

  /**
   * Return detailed production metrics for the tenant:
   * overall efficiency, throughput by status, quality pass rate,
   * overdue work orders, and top products by volume.
   */
  async getProductionMetrics(user: any) {
    const where = tenantWhere(user);

    // Work order counts by status
    const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
    const statusCounts: Record<string, number> = {};
    for (const s of statuses) {
      statusCounts[s] = await WorkOrder.count({ where: { ...where, status: s } });
    }

    // Total planned vs produced across all non-cancelled work orders
    const activeWhere = { ...where, status: { [Op.notIn]: ['CANCELLED'] } };
    const totalPlanned = (await WorkOrder.sum('planned', { where: activeWhere })) || 0;
    const totalProduced = (await WorkOrder.sum('produced', { where: activeWhere })) || 0;
    const overallEfficiency = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0;

    // Quality metrics
    const totalInspected = (await QualityCheck.sum('inspected', { where })) || 0;
    const totalPassed = (await QualityCheck.sum('passed', { where })) || 0;
    const totalDefects = (await QualityCheck.sum('defects', { where })) || 0;
    const qualityPassRate = totalInspected > 0 ? Math.round((totalPassed / totalInspected) * 100) : 100;

    // Overdue work orders (past dueDate, not completed/cancelled)
    const today = new Date().toISOString().slice(0, 10);
    const overdueCount = await WorkOrder.count({
      where: {
        ...where,
        dueDate: { [Op.lt]: today },
        status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] }
      }
    });

    // Top 5 products by total produced quantity
    const topProducts = (await WorkOrder.findAll({
      where: activeWhere,
      attributes: ['productName', [fn('SUM', col('produced')), 'totalProduced'], [fn('SUM', col('planned')), 'totalPlanned']],
      group: ['productName'],
      order: [[literal('"totalProduced"'), 'DESC']],
      limit: 5,
      raw: true
    })) as unknown as Array<{ productName: string; totalProduced: string; totalPlanned: string }>;

    return {
      statusCounts,
      totalPlanned,
      totalProduced,
      overallEfficiency,
      quality: { totalInspected, totalPassed, totalDefects, passRate: qualityPassRate },
      overdueCount,
      topProducts: topProducts.map(p => ({
        productName: p.productName,
        totalProduced: Number(p.totalProduced),
        totalPlanned: Number(p.totalPlanned),
        efficiency: Number(p.totalPlanned) > 0 ? Math.round((Number(p.totalProduced) / Number(p.totalPlanned)) * 100) : 0
      }))
    };
  }

  // ─── Get BOM Cost Breakdown ────────────────────────────────────────

  /**
   * Return a detailed cost breakdown for a BOM, including per-item
   * line cost, percentage of total, and material type summary.
   */
  async getBOMCostBreakdown(id: number, user: any) {
    const bom = await this.getBOMById(id, user);
    const items = bom.items || [];

    const totalCost = Number(bom.totalCost) || 0;
    const breakdown = items.map(item => {
      const lineCost = Number(item.quantity) * Number(item.unitCost);
      return {
        name: item.name,
        type: item.type,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitCost: Number(item.unitCost),
        lineCost,
        percentOfTotal: totalCost > 0 ? Math.round((lineCost / totalCost) * 10000) / 100 : 0
      };
    });

    // Group by material type
    const byType: Record<string, { count: number; totalCost: number }> = {};
    for (const item of breakdown) {
      if (!byType[item.type]) byType[item.type] = { count: 0, totalCost: 0 };
      byType[item.type].count++;
      byType[item.type].totalCost += item.lineCost;
    }

    return {
      bomId: bom.id,
      productName: bom.productName,
      code: bom.code,
      version: bom.version,
      totalCost,
      itemCount: items.length,
      breakdown,
      byType
    };
  }

  // ─── Stats ────────────────────────────────────────────────────────

  async getStats(user: any) {
    const where = tenantWhere(user);

    const [bomCount, woCount, completed, inProgress, qualityIssues] = await Promise.all([
      BOM.count({ where }),
      WorkOrder.count({ where }),
      WorkOrder.count({ where: { ...where, status: 'COMPLETED' } }),
      WorkOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      QualityCheck.count({ where: { ...where, result: 'FAIL' } })
    ]);

    const totalPlanned = (await WorkOrder.sum('planned', { where: { ...where, status: { [Op.in]: ['IN_PROGRESS', 'COMPLETED'] } } })) || 0;
    const totalProduced = (await WorkOrder.sum('produced', { where: { ...where, status: { [Op.in]: ['IN_PROGRESS', 'COMPLETED'] } } })) || 0;
    const efficiency = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0;

    return { bomCount, woCount, completed, inProgress, qualityIssues, efficiency };
  }
}

export default new ManufacturingService();
