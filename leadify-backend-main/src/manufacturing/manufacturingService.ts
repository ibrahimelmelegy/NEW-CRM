import { Op } from 'sequelize';
import { sequelize } from '../config/db';
import BOM from './bomModel';
import BOMItem from './bomItemModel';
import WorkOrder from './workOrderModel';
import QualityCheck from './qualityCheckModel';
import { tenantWhere, tenantCreate } from '../utils/tenantScope';

class ManufacturingService {
  // ─── BOM ───────────────────────────────────────────────────────────

  async getBOMs(user: any) {
    return BOM.findAll({
      where: { ...tenantWhere(user) },
      include: [{ model: BOMItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getBOMById(id: number, user: any) {
    const bom = await BOM.findOne({
      where: { id, ...tenantWhere(user) },
      include: [{ model: BOMItem, as: 'items' }],
    });
    if (!bom) throw new Error('BOM not found');
    return bom;
  }

  async createBOM(data: any, user: any) {
    const t = await sequelize.transaction();
    try {
      const bom = await BOM.create(
        tenantCreate({
          productName: data.productName,
          code: data.code,
          version: data.version || 1,
          isActive: data.isActive ?? false,
          totalCost: 0,
        }, user),
        { transaction: t },
      );

      let totalCost = 0;
      if (data.items?.length) {
        for (const item of data.items) {
          await BOMItem.create({
            bomId: bom.id,
            name: item.name,
            type: item.type || 'RAW',
            quantity: item.quantity || 1,
            unit: item.unit || 'pc',
            unitCost: item.unitCost || 0,
          }, { transaction: t });
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
      await bom.update({
        productName: data.productName ?? bom.productName,
        code: data.code ?? bom.code,
        version: data.version ?? bom.version,
        isActive: data.isActive ?? bom.isActive,
      }, { transaction: t });

      if (data.items) {
        await BOMItem.destroy({ where: { bomId: id }, transaction: t });
        let totalCost = 0;
        for (const item of data.items) {
          await BOMItem.create({
            bomId: id,
            name: item.name,
            type: item.type || 'RAW',
            quantity: item.quantity || 1,
            unit: item.unit || 'pc',
            unitCost: item.unitCost || 0,
          }, { transaction: t });
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
      items: original.items?.map((i: any) => ({
        name: i.name, type: i.type, quantity: i.quantity, unit: i.unit, unitCost: i.unitCost,
      })),
    };
    return this.createBOM(data, user);
  }

  // ─── Work Orders ──────────────────────────────────────────────────

  async generateWONumber(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const last = await WorkOrder.findOne({
      where,
      order: [['id', 'DESC']],
    });
    const num = last ? parseInt(last.woNumber.replace('WO-', ''), 10) + 1 : 1;
    return `WO-${String(num).padStart(3, '0')}`;
  }

  async getWorkOrders(user: any, query?: any) {
    const where: any = { ...tenantWhere(user) };
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;

    return WorkOrder.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async getWorkOrderById(id: number, user: any) {
    const wo = await WorkOrder.findOne({
      where: { id, ...tenantWhere(user) },
      include: [{ model: BOM, as: 'bom', include: [{ model: BOMItem, as: 'items' }] }],
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
      tenantCreate({
        woNumber,
        productName,
        bomId: data.bomId || null,
        bomCode,
        planned: data.quantity || data.planned || 0,
        produced: 0,
        priority: data.priority || 'NORMAL',
        status: 'PLANNED',
        dueDate: data.dueDate || null,
      }, user),
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
      order: [['createdAt', 'DESC']],
    });
  }

  async createQualityCheck(data: any, user: any) {
    const defects = data.inspected - data.passed;
    const passRate = data.inspected > 0 ? data.passed / data.inspected : 0;
    const result = passRate >= 0.95 ? 'PASS' : 'FAIL';

    return QualityCheck.create(
      tenantCreate({
        workOrderId: data.workOrderId || null,
        woNumber: data.woNumber || null,
        product: data.product || null,
        inspector: data.inspector || null,
        inspected: data.inspected || 0,
        passed: data.passed || 0,
        defects,
        result: data.result || result,
      }, user),
    );
  }

  // ─── Stats ────────────────────────────────────────────────────────

  async getStats(user: any) {
    const where = tenantWhere(user);

    const [bomCount, woCount, completed, inProgress, qualityIssues] = await Promise.all([
      BOM.count({ where }),
      WorkOrder.count({ where }),
      WorkOrder.count({ where: { ...where, status: 'COMPLETED' } }),
      WorkOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      QualityCheck.count({ where: { ...where, result: 'FAIL' } }),
    ]);

    const totalPlanned = await WorkOrder.sum('planned', { where: { ...where, status: { [Op.in]: ['IN_PROGRESS', 'COMPLETED'] } } }) || 0;
    const totalProduced = await WorkOrder.sum('produced', { where: { ...where, status: { [Op.in]: ['IN_PROGRESS', 'COMPLETED'] } } }) || 0;
    const efficiency = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0;

    return { bomCount, woCount, completed, inProgress, qualityIssues, efficiency };
  }
}

export default new ManufacturingService();
