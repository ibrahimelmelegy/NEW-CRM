import { Op } from 'sequelize';
import Segment from './segmentModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

interface SegmentCriterion {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: unknown;
}

interface SegmentCreateInput {
  name: string;
  description?: string;
  criteria?: SegmentCriterion[];
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  type?: 'STATIC' | 'DYNAMIC';
}

interface SegmentUpdateInput {
  name?: string;
  description?: string;
  criteria?: SegmentCriterion[];
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  type?: 'STATIC' | 'DYNAMIC';
}

interface SegmentQueryInput {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class SegmentService {
  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(data: Record<string, unknown>, tenantId?: string, createdBy?: number) {
    const segment = await Segment.create({ ...data, tenantId, createdBy });
    try {
      io.emit('segment:created', { id: segment.id, name: segment.name });
    } catch {}
    return segment;
  }

  async getAll(query: Record<string, unknown>, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await Segment.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getById(id: number) {
    return Segment.findByPk(id);
  }

  async update(id: number, data: Record<string, unknown>) {
    const item = await Segment.findByPk(id);
    if (!item) return null;
    await item.update(data);
    try {
      io.emit('segment:updated', { id: item.id, name: item.name });
    } catch {}
    return item;
  }

  async delete(id: number) {
    const item = await Segment.findByPk(id);
    if (!item) return false;
    await item.destroy();
    try {
      io.emit('segment:deleted', { id });
    } catch {}
    return true;
  }

  // ─── Evaluate Segment ──────────────────────────────────────────────────────────

  /**
   * Applies segment criteria to filter clients/customers and updates the count.
   * Criteria format: [{ field: 'industry', operator: 'equals', value: 'Tech' }]
   * Supported operators: equals, not_equals, contains, greater_than, less_than, in
   */
  async evaluateSegment(id: number, tenantId?: string) {
    const segment = await Segment.findByPk(id);
    if (!segment) return null;

    const criteria = segment.criteria || [];
    const sequelizeWhere: Record<string, any> = {};
    if (tenantId) sequelizeWhere.tenantId = tenantId;

    for (const rule of criteria) {
      switch (rule.operator) {
        case 'equals':
          sequelizeWhere[rule.field] = rule.value;
          break;
        case 'not_equals':
          sequelizeWhere[rule.field] = { [Op.ne]: rule.value };
          break;
        case 'contains':
          sequelizeWhere[rule.field] = { [Op.iLike]: `%${rule.value}%` };
          break;
        case 'greater_than':
          sequelizeWhere[rule.field] = { [Op.gt]: rule.value };
          break;
        case 'less_than':
          sequelizeWhere[rule.field] = { [Op.lt]: rule.value };
          break;
        case 'in':
          sequelizeWhere[rule.field] = { [Op.in]: Array.isArray(rule.value) ? rule.value : [rule.value] };
          break;
        default:
          break;
      }
    }

    const { count, rows } = await Client.findAndCountAll({ where: sequelizeWhere, attributes: ['id', 'name', 'email'] });

    await segment.update({ customerCount: count, lastEvaluatedAt: new Date() });

    try {
      io.emit('segment:evaluated', { id: segment.id, customerCount: count });
    } catch {}

    return {
      segment,
      matchedCustomers: rows,
      customerCount: count
    };
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────────

  /** Get distribution of customers across all active segments */
  async getDistribution(tenantId?: string) {
    const where: Record<string, any> = { status: 'ACTIVE' };
    if (tenantId) where.tenantId = tenantId;

    const segments = await Segment.findAll({
      where,
      attributes: ['id', 'name', 'customerCount', 'type', 'lastEvaluatedAt'],
      order: [['customerCount', 'DESC']],
      raw: true
    });

    const totalCustomers = segments.reduce((sum, s) => sum + (Number((s as any).customerCount) || 0), 0);

    return {
      segments,
      totalCustomers,
      segmentCount: segments.length
    };
  }
}

export default new SegmentService();
