import { Op, fn, col, literal, cast, QueryTypes } from 'sequelize';
import Invoice from '../deal/model/invoiceMode';
import Deal from '../deal/model/dealModel';
import Client from '../client/clientModel';
import User from '../user/userModel';
import { tenantWhere } from '../utils/tenantScope';
import { clampPagination } from '../utils/pagination';
import { sequelize } from '../config/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CalculatedTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

export interface AgingBucket {
  label: string;
  count: number;
  totalAmount: number;
}

export interface RevenueSummaryRow {
  month: string;
  totalRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
}

class InvoiceService {
  // -------------------------------------------------------------------------
  // Existing CRUD methods (unchanged)
  // -------------------------------------------------------------------------

  async getInvoices(query: { page?: number; limit?: number; status?: string; search?: string }, user?: any) {
    const { page, limit, offset } = clampPagination(query, 20);
    const where: any = { ...(user ? tenantWhere(user) : {}) };

    if (query.status === 'collected') where.collected = true;
    else if (query.status === 'pending') where.collected = { [Op.or]: [false, null] };

    if (query.search) {
      where.invoiceNumber = { [Op.iLike]: `%${query.search}%` };
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getInvoiceById(id: number) {
    const invoice = await Invoice.findByPk(id, {
      include: [{ model: Deal, as: 'deal', include: [{ model: Client, as: 'client' }] }]
    });
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async markCollected(id: number, collectedDate?: string) {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) throw new Error('Invoice not found');
    return invoice.update({
      collected: true,
      collectedDate: collectedDate ? new Date(collectedDate) : new Date()
    });
  }

  async markUncollected(id: number) {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) throw new Error('Invoice not found');
    return invoice.update({ collected: false, collectedDate: null });
  }

  async getSummary(user?: any) {
    const result = await Invoice.findOne({
      where: { ...(user ? tenantWhere(user) : {}) },
      attributes: [
        [fn('COUNT', col('id')), 'totalInvoices'],
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'totalAmount'],
        [fn('COALESCE', fn('SUM', literal('CASE WHEN "collected" = true THEN "amount" ELSE 0 END')), 0), 'collectedAmount'],
        [fn('COALESCE', fn('SUM', literal('CASE WHEN "collected" IS NOT TRUE THEN "amount" ELSE 0 END')), 0), 'pendingAmount'],
        [fn('COUNT', literal('CASE WHEN "collected" = true THEN 1 END')), 'collectedCount'],
        [fn('COUNT', literal('CASE WHEN "collected" IS NOT TRUE THEN 1 END')), 'pendingCount']
      ],
      raw: true
    }) as any;

    return {
      totalInvoices: Number(result?.totalInvoices) || 0,
      totalAmount: Number(result?.totalAmount) || 0,
      collectedAmount: Number(result?.collectedAmount) || 0,
      pendingAmount: Number(result?.pendingAmount) || 0,
      collectedCount: Number(result?.collectedCount) || 0,
      pendingCount: Number(result?.pendingCount) || 0
    };
  }

  // -------------------------------------------------------------------------
  // NEW: Financial calculation helpers
  // -------------------------------------------------------------------------

  /**
   * Calculate invoice totals from line items, applying discount and tax.
   *
   * @param items       Array of { description, quantity, unitPrice }
   * @param taxRate     Tax percentage (e.g. 15 for 15%)
   * @param discount    Discount value -- interpretation depends on `discountType`
   * @param discountType  'percentage' applies % to subtotal; 'fixed' subtracts flat amount
   */
  calculateInvoiceTotals(
    items: InvoiceLineInput[],
    taxRate: number = 0,
    discount: number = 0,
    discountType: 'percentage' | 'fixed' = 'fixed'
  ): CalculatedTotals {
    // 1. Compute line totals and subtotal
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = (item.quantity ?? 0) * (item.unitPrice ?? 0);
      return sum + lineTotal;
    }, 0);

    // 2. Apply discount
    let discountAmount: number;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }
    // Discount cannot exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    // 3. Taxable amount = subtotal - discount
    const taxableAmount = subtotal - discountAmount;

    // 4. Tax on post-discount amount
    const taxAmount = taxableAmount * (taxRate / 100);

    // 5. Total
    const total = taxableAmount + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  // -------------------------------------------------------------------------
  // NEW: Aging report -- SQL-based with CASE WHEN buckets
  // -------------------------------------------------------------------------

  /**
   * Categorise unpaid invoices by how overdue they are, using the `dueDate`
   * column.  Falls back to `invoiceDate` when `dueDate` is NULL.
   *
   * Buckets:
   *   - Current        (not yet due)
   *   - 1-30 days      overdue
   *   - 31-60 days     overdue
   *   - 61-90 days     overdue
   *   - 90+ days       overdue
   */
  async getAgingReport(tenantId?: string): Promise<{
    buckets: AgingBucket[];
    totalOutstanding: number;
  }> {
    const tenantFilter = tenantId
      ? `AND "tenantId" = :tenantId`
      : '';

    const query = `
      SELECT
        CASE
          WHEN COALESCE("dueDate", "invoiceDate")::date >= NOW()::date THEN 'current'
          WHEN NOW()::date - COALESCE("dueDate", "invoiceDate")::date <= 30 THEN '1-30'
          WHEN NOW()::date - COALESCE("dueDate", "invoiceDate")::date <= 60 THEN '31-60'
          WHEN NOW()::date - COALESCE("dueDate", "invoiceDate")::date <= 90 THEN '61-90'
          ELSE '90+'
        END AS bucket,
        COUNT(*)::int AS count,
        COALESCE(SUM("amount"), 0) AS "totalAmount"
      FROM "invoices"
      WHERE ("collected" IS NOT TRUE)
        ${tenantFilter}
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN 'current' THEN 1
          WHEN '1-30'    THEN 2
          WHEN '31-60'   THEN 3
          WHEN '61-90'   THEN 4
          WHEN '90+'     THEN 5
        END
    `;

    const replacements: Record<string, any> = {};
    if (tenantId) replacements.tenantId = tenantId;

    const rows: any[] = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    // Map labels
    const labelMap: Record<string, string> = {
      current: 'Current (not yet due)',
      '1-30': '1-30 days overdue',
      '31-60': '31-60 days overdue',
      '61-90': '61-90 days overdue',
      '90+': '90+ days overdue',
    };

    const buckets: AgingBucket[] = rows.map((r) => ({
      label: labelMap[r.bucket] || r.bucket,
      count: Number(r.count) || 0,
      totalAmount: Math.round((Number(r.totalAmount) || 0) * 100) / 100,
    }));

    const totalOutstanding = buckets.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      buckets,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    };
  }

  // -------------------------------------------------------------------------
  // NEW: Revenue summary -- monthly aggregation
  // -------------------------------------------------------------------------

  /**
   * Return total revenue, collected revenue, and outstanding revenue grouped
   * by month for the given period.
   *
   * @param tenantId  Optional tenant scope
   * @param period    Number of months to look back (default 12)
   */
  async getRevenueSummary(tenantId?: string, period: number = 12): Promise<RevenueSummaryRow[]> {
    const safePeriod = Math.max(1, Math.min(120, Math.floor(Number(period) || 12)));
    const tenantFilter = tenantId
      ? `AND "tenantId" = :tenantId`
      : '';

    const query = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', "invoiceDate"), 'YYYY-MM') AS month,
        COALESCE(SUM("amount"), 0)                              AS "totalRevenue",
        COALESCE(SUM(CASE WHEN "collected" = true THEN "amount" ELSE 0 END), 0) AS "collectedRevenue",
        COALESCE(SUM(CASE WHEN "collected" IS NOT TRUE THEN "amount" ELSE 0 END), 0) AS "outstandingRevenue"
      FROM "invoices"
      WHERE "invoiceDate" >= DATE_TRUNC('month', NOW()) - INTERVAL '${safePeriod} months'
        ${tenantFilter}
      GROUP BY DATE_TRUNC('month', "invoiceDate")
      ORDER BY DATE_TRUNC('month', "invoiceDate") ASC
    `;

    const replacements: Record<string, any> = {};
    if (tenantId) replacements.tenantId = tenantId;

    const rows: any[] = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return rows.map((r) => ({
      month: r.month,
      totalRevenue: Math.round((Number(r.totalRevenue) || 0) * 100) / 100,
      collectedRevenue: Math.round((Number(r.collectedRevenue) || 0) * 100) / 100,
      outstandingRevenue: Math.round((Number(r.outstandingRevenue) || 0) * 100) / 100,
    }));
  }

  // -------------------------------------------------------------------------
  // NEW: Overdue invoices
  // -------------------------------------------------------------------------

  /**
   * Return invoices where the due date has passed and the invoice is still
   * uncollected, sorted by most overdue first.
   *
   * Falls back to `invoiceDate` if `dueDate` is NULL.
   */
  async getOverdueInvoices(tenantId?: string): Promise<any[]> {
    const where: any = {
      collected: { [Op.or]: [false, null] },
      [Op.and]: [
        literal(`COALESCE("Invoice"."dueDate", "Invoice"."invoiceDate") < NOW()`)
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const invoices = await Invoice.findAll({
      where,
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'name'] }],
      attributes: {
        include: [
          [
            literal(`(NOW()::date - COALESCE("Invoice"."dueDate", "Invoice"."invoiceDate")::date)`),
            'daysOverdue',
          ],
        ],
      },
      order: [[literal(`COALESCE("Invoice"."dueDate", "Invoice"."invoiceDate")`), 'ASC']],
      raw: false,
    });

    return invoices.map((inv) => {
      const json = inv.toJSON() as any;
      return {
        ...json,
        daysOverdue: Number(json.daysOverdue) || 0,
      };
    });
  }
}

export default new InvoiceService();
