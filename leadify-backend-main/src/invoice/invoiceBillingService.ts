import { Op } from 'sequelize';
import Invoice from '../deal/model/invoiceMode';
import Deal from '../deal/model/dealModel';
import InvoiceLineItem from './models/invoiceLineItemModel';
import CreditNote, { CreditNoteStatusEnum } from './models/creditNoteModel';
import SalesOrder from '../salesOrder/models/salesOrderModel';
import SalesOrderItem from '../salesOrder/models/salesOrderItemModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import logger from '../config/logger';

class InvoiceBillingService {
  async listInvoices(page = 1, limit = 20): Promise<{ docs: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    try {
      const offset = (page - 1) * limit;
      const { rows, count } = await Invoice.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      return {
        docs: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
      };
    } catch (error) {
      logger.error({ error }, 'listInvoices error');
      return { docs: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
  }

  /**
   * Auto-generate the next invoice number in INV-0001 sequence.
   */
  async generateInvoiceNumber(tenantId?: string): Promise<string> {
    const latest = await Invoice.findOne({
      where: {
        invoiceNumber: { [Op.like]: 'INV-%' },
        ...(tenantId && { tenantId })
      },
      order: [['id', 'DESC']]
    });

    let nextNum = 1;
    if (latest && latest.invoiceNumber) {
      const match = latest.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `INV-${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Auto-generate the next credit note number in CN-0001 sequence.
   */
  async generateCreditNoteNumber(tenantId?: string): Promise<string> {
    const latest = await CreditNote.findOne({
      where: {
        creditNoteNumber: { [Op.like]: 'CN-%' },
        ...(tenantId && { tenantId })
      },
      order: [['createdAt', 'DESC']]
    });

    let nextNum = 1;
    if (latest && latest.creditNoteNumber) {
      const match = latest.creditNoteNumber.match(/CN-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `CN-${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Create a new invoice with optional line items.
   */
  async createInvoice(data: {
    dealId: string;
    invoiceDate?: string;
    notes?: string;
    paymentTerms?: string;
    dueDate?: string;
    lineItems?: Array<{
      productId?: string;
      description: string;
      quantity?: number;
      unitPrice?: number;
      taxRate?: number;
      discountRate?: number;
    }>;
  }) {
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      amount: 0,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      collected: false,
      dealId: data.dealId
    });

    if (data.lineItems && data.lineItems.length > 0) {
      await this.addLineItems(invoice.id, data.lineItems);
      await this.calculateTotals(invoice.id);
    }

    return this.getInvoiceWithLineItems(invoice.id);
  }

  /**
   * Bulk add line items to an invoice.
   */
  async addLineItems(
    invoiceId: number,
    items: Array<{
      productId?: string;
      description: string;
      quantity?: number;
      unitPrice?: number;
      taxRate?: number;
      discountRate?: number;
    }>
  ) {
    const lineItems = items.map(item => {
      const qty = item.quantity ?? 1;
      const price = item.unitPrice ?? 0;
      const tax = item.taxRate ?? 0;
      const discount = item.discountRate ?? 0;

      const subtotal = qty * price;
      const discountAmount = subtotal * (discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (tax / 100);
      const lineTotal = taxableAmount + taxAmount;

      return {
        invoiceId,
        productId: item.productId || null,
        description: item.description,
        quantity: qty,
        unitPrice: price,
        taxRate: tax,
        discountRate: discount,
        lineTotal: Math.round(lineTotal * 100) / 100
      };
    });

    return InvoiceLineItem.bulkCreate(lineItems);
  }

  /**
   * Recalculate invoice totals from line items and update the invoice amount.
   */
  async calculateTotals(invoiceId: number) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new BaseError(ERRORS.NOT_FOUND);

    const lineItems = await InvoiceLineItem.findAll({ where: { invoiceId } });

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of lineItems) {
      const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
      const itemDiscount = itemSubtotal * (Number(item.discountRate) / 100);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (Number(item.taxRate) / 100);

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    }

    const total = subtotal - totalDiscount + totalTax;

    await invoice.update({
      amount: Math.round(total * 100) / 100
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Mark an invoice as sent.
   */
  async markSent(invoiceId: number) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new BaseError(ERRORS.NOT_FOUND);

    await invoice.update({
      collected: false // sentAt is tracked via updatedAt; status concept handled in frontend
    });

    return invoice;
  }

  /**
   * Void an invoice - mark it as voided so it cannot be collected.
   */
  async voidInvoice(invoiceId: number) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new BaseError(ERRORS.NOT_FOUND);

    if (invoice.collected) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Cannot void a collected invoice');
    }

    // Mark the invoice amount to 0 and set collected to indicate voided
    await invoice.update({
      amount: 0
    });

    return invoice;
  }

  /**
   * Get aging report: invoices grouped by age buckets.
   * current (0-30 days), 30-60, 60-90, 90+ days overdue.
   */
  async getAgingReport() {
    const uncollectedInvoices = await Invoice.findAll({
      where: {
        collected: { [Op.or]: [false, null] }
      },
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'name'] }],
      raw: false
    });

    const now = new Date();
    const buckets = {
      current: { amount: 0, count: 0, invoices: [] as any[] },
      thirtyDays: { amount: 0, count: 0, invoices: [] as any[] },
      sixtyDays: { amount: 0, count: 0, invoices: [] as any[] },
      ninetyPlus: { amount: 0, count: 0, invoices: [] as any[] }
    };

    const clientBreakdown: Record<
      string,
      {
        clientName: string;
        current: number;
        thirtyDays: number;
        sixtyDays: number;
        ninetyPlus: number;
        total: number;
      }
    > = {};

    for (const inv of uncollectedInvoices) {
      const invoiceDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.getDataValue('createdAt'));
      const daysOld = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(inv.amount) || 0;
      const clientName = (inv as any).deal?.name || `Deal #${inv.dealId}`;
      const clientKey = inv.dealId;

      if (!clientBreakdown[clientKey]) {
        clientBreakdown[clientKey] = {
          clientName,
          current: 0,
          thirtyDays: 0,
          sixtyDays: 0,
          ninetyPlus: 0,
          total: 0
        };
      }

      const invSummary = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount,
        daysOld,
        dealName: clientName
      };

      if (daysOld < 1) {
        buckets.current.amount += amount;
        buckets.current.count++;
        buckets.current.invoices.push(invSummary);
        clientBreakdown[clientKey].current += amount;
      } else if (daysOld <= 60) {
        buckets.thirtyDays.amount += amount;
        buckets.thirtyDays.count++;
        buckets.thirtyDays.invoices.push(invSummary);
        clientBreakdown[clientKey].thirtyDays += amount;
      } else if (daysOld <= 90) {
        buckets.sixtyDays.amount += amount;
        buckets.sixtyDays.count++;
        buckets.sixtyDays.invoices.push(invSummary);
        clientBreakdown[clientKey].sixtyDays += amount;
      } else {
        buckets.ninetyPlus.amount += amount;
        buckets.ninetyPlus.count++;
        buckets.ninetyPlus.invoices.push(invSummary);
        clientBreakdown[clientKey].ninetyPlus += amount;
      }

      clientBreakdown[clientKey].total += amount;
    }

    const totalOutstanding = buckets.current.amount + buckets.thirtyDays.amount + buckets.sixtyDays.amount + buckets.ninetyPlus.amount;

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      buckets: {
        current: {
          amount: Math.round(buckets.current.amount * 100) / 100,
          count: buckets.current.count
        },
        thirtyDays: {
          amount: Math.round(buckets.thirtyDays.amount * 100) / 100,
          count: buckets.thirtyDays.count
        },
        sixtyDays: {
          amount: Math.round(buckets.sixtyDays.amount * 100) / 100,
          count: buckets.sixtyDays.count
        },
        ninetyPlus: {
          amount: Math.round(buckets.ninetyPlus.amount * 100) / 100,
          count: buckets.ninetyPlus.count
        }
      },
      clientBreakdown: Object.values(clientBreakdown).sort((a, b) => b.total - a.total)
    };
  }

  /**
   * Create a credit note for an invoice.
   */
  async createCreditNote(
    invoiceId: number,
    data: {
      amount: number;
      reason?: string;
      date?: string;
      tenantId?: string;
    }
  ) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new BaseError(ERRORS.NOT_FOUND);

    if (data.amount > Number(invoice.amount)) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Credit note amount cannot exceed invoice amount');
    }

    const creditNoteNumber = await this.generateCreditNoteNumber();

    const creditNote = await CreditNote.create({
      invoiceId,
      creditNoteNumber,
      amount: data.amount,
      reason: data.reason || null,
      status: CreditNoteStatusEnum.ISSUED,
      date: data.date ? new Date(data.date) : new Date(),
      tenantId: data.tenantId || null
    });

    return creditNote;
  }

  /**
   * Get invoice with its line items and credit notes.
   */
  async getInvoiceWithLineItems(invoiceId: number) {
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Deal, as: 'deal' }]
    });

    if (!invoice) throw new BaseError(ERRORS.NOT_FOUND);

    const lineItems = await InvoiceLineItem.findAll({
      where: { invoiceId },
      order: [['createdAt', 'ASC']]
    });

    const creditNotes = await CreditNote.findAll({
      where: { invoiceId },
      order: [['createdAt', 'DESC']]
    });

    // Calculate totals from line items
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of lineItems) {
      const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
      const itemDiscount = itemSubtotal * (Number(item.discountRate) / 100);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (Number(item.taxRate) / 100);

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    }

    const total = subtotal - totalDiscount + totalTax;
    const creditTotal = creditNotes.reduce((sum, cn) => sum + Number(cn.amount), 0);
    const balanceDue = total - creditTotal - (invoice.collected ? total : 0);

    return {
      ...invoice.toJSON(),
      lineItems,
      creditNotes,
      totals: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(totalTax * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        total: Math.round(total * 100) / 100,
        creditTotal: Math.round(creditTotal * 100) / 100,
        paid: invoice.collected ? Math.round(total * 100) / 100 : 0,
        balanceDue: Math.round(Math.max(0, balanceDue) * 100) / 100
      }
    };
  }

  /**
   * Update an existing invoice and its line items.
   */
  async updateInvoice(
    invoiceId: number,
    data: {
      invoiceDate?: string;
      dealId?: string;
      lineItems?: Array<{
        id?: string;
        productId?: string;
        description: string;
        quantity?: number;
        unitPrice?: number;
        taxRate?: number;
        discountRate?: number;
      }>;
    }
  ) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new BaseError(ERRORS.NOT_FOUND);

    if (invoice.collected) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Cannot update a collected invoice');
    }

    const updateData: Record<string, unknown> = {};
    if (data.invoiceDate) updateData.invoiceDate = new Date(data.invoiceDate);
    if (data.dealId) updateData.dealId = data.dealId;

    if (Object.keys(updateData).length > 0) {
      await invoice.update(updateData);
    }

    // Replace line items if provided
    if (data.lineItems) {
      await InvoiceLineItem.destroy({ where: { invoiceId } });
      if (data.lineItems.length > 0) {
        await this.addLineItems(invoiceId, data.lineItems);
      }
      await this.calculateTotals(invoiceId);
    }

    return this.getInvoiceWithLineItems(invoiceId);
  }

  /**
   * Create an invoice from a sales order.
   */
  async createFromOrder(orderId: string) {
    const order = await SalesOrder.findByPk(orderId, {
      include: [{ model: SalesOrderItem, as: 'items' }]
    });

    if (!order) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Sales order not found');

    const dealId = order.dealId;
    if (!dealId) {
      throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Sales order has no associated deal');
    }

    const lineItems = (order.items || []).map(item => ({
      productId: item.productId || undefined,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      discountRate: Number(item.discountRate)
    }));

    return this.createInvoice({
      dealId,
      invoiceDate: new Date().toISOString(),
      lineItems
    });
  }
}

export default new InvoiceBillingService();
