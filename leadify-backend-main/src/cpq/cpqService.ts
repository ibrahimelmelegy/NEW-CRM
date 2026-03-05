import { Op } from 'sequelize';
import { PriceBook, PriceBookEntry, CpqQuote, PricingRule } from './cpqModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';
import Client from '../client/clientModel';
import User from '../user/userModel';

/** A single line item request when generating a quote */
interface QuoteItemRequest {
  entryId: number;
  quantity: number;
}

/** Discount rule that can be applied to a subtotal */
interface DiscountRule {
  type: 'percentage' | 'fixed' | 'volume' | 'bundle';
  value: number;
  minQuantity?: number;
  minItems?: number;
}

/** Result of a single line in the generated quote */
interface QuoteLineResult {
  entryId: number;
  productName: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  quantityDiscount: number;
  lineTotal: number;
}

class CpqService {
  // ─── Price Book CRUD ─────────────────────────────────────────────────────────

  async createPriceBook(data: unknown, tenantId?: string) {
    return PriceBook.create({ ...data, tenantId });
  }

  async getPriceBooks(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await PriceBook.findAndCountAll({
      where,
      include: [{ model: PriceBookEntry, as: 'entries' }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getPriceBookById(id: number) {
    return PriceBook.findByPk(id, {
      include: [{ model: PriceBookEntry, as: 'entries' }]
    });
  }

  async updatePriceBook(id: number, data: unknown) {
    const book = await PriceBook.findByPk(id);
    if (!book) return null;
    await book.update(data);
    return book;
  }

  async deletePriceBook(id: number) {
    await PriceBookEntry.destroy({ where: { priceBookId: id } });
    const book = await PriceBook.findByPk(id);
    if (!book) return false;
    await book.destroy();
    return true;
  }

  // ─── Price Book Entry CRUD ───────────────────────────────────────────────────

  async getEntries(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.search) {
      where[Op.or as any] = [
        { productName: { [Op.iLike]: `%${query.search}%` } },
        { sku: { [Op.iLike]: `%${query.search}%` } }
      ];
    }
    if (query.priceBookId) where.priceBookId = Number(query.priceBookId);

    const { rows, count } = await PriceBookEntry.findAndCountAll({
      where,
      include: [{ model: PriceBook, as: 'priceBook', attributes: ['id', 'name', 'currency'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async addEntry(data: unknown, tenantId?: string) {
    return PriceBookEntry.create({ ...data, tenantId });
  }

  async updateEntry(id: number, data: unknown) {
    const entry = await PriceBookEntry.findByPk(id);
    if (!entry) return null;
    await entry.update(data);
    return entry;
  }

  async deleteEntry(id: number) {
    const entry = await PriceBookEntry.findByPk(id);
    if (!entry) return false;
    await entry.destroy();
    return true;
  }

  // ─── Pricing Rule CRUD ───────────────────────────────────────────────────────

  async createPricingRule(data: unknown, tenantId?: string) {
    return PricingRule.create({ ...data, tenantId });
  }

  async getPricingRules(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const { rows, count } = await PricingRule.findAndCountAll({
      where,
      order: [['priority', 'ASC'], ['createdAt', 'DESC']], limit, offset
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updatePricingRule(id: number, data: unknown) {
    const rule = await PricingRule.findByPk(id);
    if (!rule) return null;
    await rule.update(data);
    return rule;
  }

  async deletePricingRule(id: number) {
    const rule = await PricingRule.findByPk(id);
    if (!rule) return false;
    await rule.destroy();
    return true;
  }

  // ─── CPQ Quote CRUD ──────────────────────────────────────────────────────────

  private async generateQuoteNumber(tenantId?: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;

    const lastQuote = await CpqQuote.findOne({
      where,
      order: [['createdAt', 'DESC']],
      attributes: ['quoteNumber']
    });

    let nextNum = 1;
    if (lastQuote?.quoteNumber) {
      const match = lastQuote.quoteNumber.match(/QT-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    return `QT-${String(nextNum).padStart(4, '0')}`;
  }

  async createQuote(data: unknown, tenantId?: string, userId?: number) {
    const quoteNumber = await this.generateQuoteNumber(tenantId);
    const quote = await CpqQuote.create({
      ...data,
      quoteNumber,
      tenantId,
      createdBy: userId
    });
    try { io.emit('cpq:quote_created', { id: quote.id, quoteNumber }); } catch {}
    return quote;
  }

  async getQuotes(query: unknown, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.search) {
      where[Op.or as any] = [
        { title: { [Op.iLike]: `%${query.search}%` } },
        { quoteNumber: { [Op.iLike]: `%${query.search}%` } }
      ];
    }
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = Number(query.clientId);

    const { rows, count } = await CpqQuote.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'companyName'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
      ],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async getQuoteById(id: number) {
    return CpqQuote.findByPk(id, {
      include: [
        { model: Client, as: 'client', required: false },
        { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
        { model: PriceBook, as: 'priceBookRef', required: false }
      ]
    });
  }

  async updateQuote(id: number, data: unknown) {
    const quote = await CpqQuote.findByPk(id);
    if (!quote) return null;
    await quote.update(data);
    try { io.emit('cpq:quote_updated', { id: quote.id, status: quote.status }); } catch {}
    return quote;
  }

  async deleteQuote(id: number) {
    const quote = await CpqQuote.findByPk(id);
    if (!quote) return false;
    await quote.destroy();
    return true;
  }

  async approveQuote(id: number) {
    const quote = await CpqQuote.findByPk(id);
    if (!quote) return null;
    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') return null;
    await quote.update({ status: 'APPROVED' });
    try { io.emit('cpq:quote_approved', { id: quote.id, quoteNumber: quote.quoteNumber }); } catch {}
    return quote;
  }

  async rejectQuote(id: number) {
    const quote = await CpqQuote.findByPk(id);
    if (!quote) return null;
    await quote.update({ status: 'REJECTED' });
    try { io.emit('cpq:quote_rejected', { id: quote.id, quoteNumber: quote.quoteNumber }); } catch {}
    return quote;
  }

  async sendQuote(id: number) {
    const quote = await CpqQuote.findByPk(id);
    if (!quote) return null;
    await quote.update({ status: 'SENT' });
    try { io.emit('cpq:quote_sent', { id: quote.id, quoteNumber: quote.quoteNumber }); } catch {}
    return quote;
  }

  // ─── Quote Expiry Handling ───────────────────────────────────────────────────

  async expireOverdueQuotes(tenantId?: string) {
    const where: Record<string, unknown> = {
      status: { [Op.in]: ['DRAFT', 'SENT'] },
      validUntil: { [Op.lt]: new Date().toISOString().slice(0, 10) }
    };
    if (tenantId) where.tenantId = tenantId;

    const [affectedCount] = await CpqQuote.update(
      { status: 'EXPIRED' },
      { where }
    );
    return { expired: affectedCount };
  }

  // ─── Quote-to-Deal Conversion ────────────────────────────────────────────────

  async convertQuoteToDeal(quoteId: number) {
    const quote = await CpqQuote.findByPk(quoteId, {
      include: [{ model: Client, as: 'client', required: false }]
    });
    if (!quote) return null;
    if (quote.status !== 'APPROVED') return { error: 'Only approved quotes can be converted to deals' };

    // Return deal data for the frontend/caller to create a deal
    return {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      dealData: {
        title: quote.title,
        clientId: quote.clientId,
        value: Number(quote.total),
        currency: quote.currency,
        source: `Quote ${quote.quoteNumber}`,
        notes: quote.notes
      }
    };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getAnalytics(tenantId?: string) {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;

    const allQuotes = await CpqQuote.findAll({ where, attributes: ['id', 'status', 'total', 'discountTotal', 'subtotal'] });

    const totalQuotes = allQuotes.length;
    const statusCounts: Record<string, number> = { DRAFT: 0, SENT: 0, APPROVED: 0, REJECTED: 0, EXPIRED: 0 };
    let totalRevenue = 0;
    let totalDiscountGiven = 0;
    let approvedCount = 0;

    for (const q of allQuotes) {
      statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
      totalDiscountGiven += Number(q.discountTotal || 0);
      if (q.status === 'APPROVED') {
        approvedCount++;
        totalRevenue += Number(q.total || 0);
      }
    }

    const quoteToCloseRatio = totalQuotes > 0 ? parseFloat(((approvedCount / totalQuotes) * 100).toFixed(1)) : 0;
    const avgDiscount = totalQuotes > 0 ? parseFloat((totalDiscountGiven / totalQuotes).toFixed(2)) : 0;

    return {
      totalQuotes,
      statusCounts,
      quoteToCloseRatio,
      avgDiscount,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      approvedCount
    };
  }

  // ─── Price Validation ────────────────────────────────────────────────────────

  async validatePricing(priceBookId: number, items: QuoteItemRequest[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const book = await PriceBook.findByPk(priceBookId);
    if (!book) {
      return { valid: false, errors: [`Price book ${priceBookId} not found`] };
    }
    if (!book.isActive) {
      errors.push(`Price book "${book.name}" is not active`);
    }
    if (book.expiryDate && new Date(book.expiryDate) < new Date()) {
      errors.push(`Price book "${book.name}" has expired (${book.expiryDate})`);
    }

    if (!items || items.length === 0) {
      errors.push('No items provided');
      return { valid: false, errors };
    }

    const entryIds = items.map(i => i.entryId);
    const entries = await PriceBookEntry.findAll({
      where: { id: { [Op.in]: entryIds }, priceBookId }
    });
    const entryMap = new Map(entries.map(e => [e.id, e]));

    for (const item of items) {
      const entry = entryMap.get(item.entryId);
      if (!entry) {
        errors.push(`Entry ${item.entryId} not found in price book ${priceBookId}`);
        continue;
      }
      if (Number(entry.unitPrice) <= 0) {
        errors.push(`Entry "${entry.productName}" has invalid price (${entry.unitPrice})`);
      }
      if (item.quantity <= 0) {
        errors.push(`Quantity for "${entry.productName}" must be greater than 0`);
      }
      if (entry.minQty && item.quantity < entry.minQty) {
        errors.push(`"${entry.productName}" requires minimum quantity of ${entry.minQty}, got ${item.quantity}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Discount Rules Engine ───────────────────────────────────────────────────

  applyDiscountRules(subtotal: number, rules: DiscountRule[], context?: { totalQuantity?: number; distinctItems?: number }): { totalDiscount: number; appliedRules: { rule: DiscountRule; amount: number }[] } {
    let totalDiscount = 0;
    const appliedRules: { rule: DiscountRule; amount: number }[] = [];

    for (const rule of rules) {
      let amount = 0;

      switch (rule.type) {
        case 'percentage':
          amount = parseFloat(((subtotal * rule.value) / 100).toFixed(2));
          break;

        case 'fixed':
          amount = Math.min(rule.value, subtotal - totalDiscount);
          break;

        case 'volume':
          if (context?.totalQuantity && rule.minQuantity && context.totalQuantity >= rule.minQuantity) {
            amount = parseFloat(((subtotal * rule.value) / 100).toFixed(2));
          }
          break;

        case 'bundle':
          if (context?.distinctItems && rule.minItems && context.distinctItems >= rule.minItems) {
            amount = parseFloat(((subtotal * rule.value) / 100).toFixed(2));
          }
          break;
      }

      if (amount > 0) {
        totalDiscount += amount;
        appliedRules.push({ rule, amount });
      }
    }

    if (totalDiscount > subtotal) totalDiscount = subtotal;

    return { totalDiscount: parseFloat(totalDiscount.toFixed(2)), appliedRules };
  }

  // ─── Auto-apply Pricing Rules from DB ────────────────────────────────────────

  async getApplicablePricingRules(tenantId?: string, totalQty?: number, distinctItems?: number): Promise<DiscountRule[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (tenantId) where.tenantId = tenantId;

    const dbRules = await PricingRule.findAll({ where, order: [['priority', 'ASC']] });
    const rules: DiscountRule[] = [];

    for (const r of dbRules) {
      const discountValue = Number(r.discountPercent || 0) || Number(r.discountAmount || 0);
      if (discountValue <= 0) continue;

      switch (r.type) {
        case 'DISCOUNT':
          rules.push({ type: 'percentage', value: Number(r.discountPercent || 0) });
          break;
        case 'VOLUME':
          if (totalQty && r.minQuantity && totalQty >= r.minQuantity) {
            rules.push({ type: 'volume', value: Number(r.discountPercent || 0), minQuantity: r.minQuantity });
          }
          break;
        case 'BUNDLE':
          rules.push({ type: 'bundle', value: Number(r.discountPercent || 0), minItems: r.minQuantity || 2 });
          break;
        case 'MARKUP':
          // Markup rules increase price -- handled differently, skip discount logic
          break;
      }
    }
    return rules;
  }

  // ─── Generate Quote (Calculation Engine) ─────────────────────────────────────

  /**
   * Generate a full quote from a price book.
   * Response structure is normalized for the frontend:
   *   { lineItems, subtotal, discount, tax, total }
   */
  async generateQuote(
    priceBookId: number,
    items: QuoteItemRequest[],
    options?: { discountRules?: DiscountRule[]; taxRate?: number },
    tenantId?: string
  ) {
    // Validate first
    const validation = await this.validatePricing(priceBookId, items);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const book = await PriceBook.findByPk(priceBookId);
    const entryIds = items.map(i => i.entryId);
    const entries = await PriceBookEntry.findAll({
      where: { id: { [Op.in]: entryIds }, priceBookId }
    });
    const entryMap = new Map(entries.map(e => [e.id, e]));

    // Build line items
    const lineItems: Array<{
      entryId: number;
      productName: string;
      sku: string | null;
      unitPrice: number;
      quantity: number;
      quantityDiscount: number;
      amount: number;
    }> = [];
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const entry = entryMap.get(item.entryId)!;
      const unitPrice = Number(entry.unitPrice);
      const qty = item.quantity;
      totalQuantity += qty;

      // Quantity-based tier discount
      let qtyDiscount = 0;
      if (qty >= 100) qtyDiscount = 15;
      else if (qty >= 50) qtyDiscount = 10;
      else if (qty >= 10) qtyDiscount = 5;

      // Respect the entry's maxDiscount cap
      const maxDiscount = entry.maxDiscount ? Number(entry.maxDiscount) : 100;
      if (qtyDiscount > maxDiscount) qtyDiscount = maxDiscount;

      const discountedPrice = unitPrice * (1 - qtyDiscount / 100);
      const amount = parseFloat((discountedPrice * qty).toFixed(2));

      lineItems.push({
        entryId: entry.id,
        productName: entry.productName,
        sku: entry.sku || null,
        unitPrice,
        quantity: qty,
        quantityDiscount: qtyDiscount,
        amount
      });

      subtotal += amount;
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // Merge manually provided discount rules with auto-applied rules from DB
    let allRules: DiscountRule[] = [];
    if (options?.discountRules && options.discountRules.length > 0) {
      allRules = options.discountRules;
    }

    // Also try to load pricing rules from DB
    try {
      const dbRules = await this.getApplicablePricingRules(tenantId, totalQuantity, lineItems.length);
      allRules = [...allRules, ...dbRules];
    } catch {}

    // Apply additional discount rules
    let discountAmount = 0;
    let appliedRules: { rule: DiscountRule; amount: number }[] = [];
    if (allRules.length > 0) {
      const discountResult = this.applyDiscountRules(subtotal, allRules, {
        totalQuantity,
        distinctItems: lineItems.length
      });
      discountAmount = discountResult.totalDiscount;
      appliedRules = discountResult.appliedRules;
    }

    const afterDiscount = parseFloat((subtotal - discountAmount).toFixed(2));

    // Tax (default 15% VAT for Saudi Arabia)
    const taxRate = options?.taxRate ?? 15;
    const taxAmount = parseFloat(((afterDiscount * taxRate) / 100).toFixed(2));
    const grandTotal = parseFloat((afterDiscount + taxAmount).toFixed(2));

    // Return the normalized response that the frontend expects
    const result = {
      lineItems,
      subtotal,
      discount: discountAmount,
      quantityDiscountSavings: parseFloat((lineItems.reduce((sum, l) => sum + (l.unitPrice * l.quantity - l.amount), 0)).toFixed(2)),
      appliedRules,
      tax: taxAmount,
      taxRate,
      total: grandTotal,
      totalItems: lineItems.length,
      totalQuantity,
      currency: book!.currency,
      priceBook: { id: book!.id, name: book!.name, currency: book!.currency }
    };

    try { io.emit('cpq:quote_generated', { priceBookId, grandTotal, totalItems: lineItems.length }); } catch {}
    return result;
  }
}

export default new CpqService();
