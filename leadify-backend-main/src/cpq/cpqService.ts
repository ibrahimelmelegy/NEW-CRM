import { Op } from 'sequelize';
import { PriceBook, PriceBookEntry } from './cpqModel';
import { clampPagination } from '../utils/pagination';
import { io } from '../server';

/** A single line item request when generating a quote */
interface QuoteItemRequest {
  entryId: number;
  quantity: number;
}

/** Discount rule that can be applied to a subtotal */
interface DiscountRule {
  type: 'percentage' | 'fixed' | 'volume' | 'bundle';
  value: number;               // percentage (e.g. 10 for 10%) or fixed amount
  minQuantity?: number;         // for volume discounts — minimum total qty across all items
  minItems?: number;            // for bundle discounts — minimum distinct line items
}

/** Result of a single line in the generated quote */
interface QuoteLineResult {
  entryId: number;
  productName: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  quantityDiscount: number;     // percentage discount from quantity tiers
  lineTotal: number;            // after quantity discount
}

class CpqService {
  // ─── Existing CRUD ──────────────────────────────────────────────────────────

  async createPriceBook(data: any, tenantId?: string) {
    return PriceBook.create({ ...data, tenantId });
  }

  async getPriceBooks(query: any, tenantId?: string) {
    const { page, limit, offset } = clampPagination(query);
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const { rows, count } = await PriceBook.findAndCountAll({
      where,
      include: [{ model: PriceBookEntry, as: 'entries' }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true
    });
    return { docs: rows, pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async updatePriceBook(id: number, data: any) {
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

  async addEntry(data: any, tenantId?: string) {
    return PriceBookEntry.create({ ...data, tenantId });
  }

  async updateEntry(id: number, data: any) {
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

  // ─── Business Logic ─────────────────────────────────────────────────────────

  /**
   * Validate that all price book entries are valid for quoting.
   * Checks: entries exist, have positive prices, quantities meet minimums, price book is active.
   */
  async validatePricing(priceBookId: number, items: QuoteItemRequest[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check price book exists and is active
    const book = await PriceBook.findByPk(priceBookId);
    if (!book) {
      return { valid: false, errors: [`Price book ${priceBookId} not found`] };
    }
    if (!book.isActive) {
      errors.push(`Price book "${book.name}" is not active`);
    }
    // Check expiry date
    if (book.expiryDate && new Date(book.expiryDate) < new Date()) {
      errors.push(`Price book "${book.name}" has expired (${book.expiryDate})`);
    }

    if (!items || items.length === 0) {
      errors.push('No items provided');
      return { valid: false, errors };
    }

    // Fetch all requested entries
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

  /**
   * Apply discount rules to a subtotal.
   * Supports: percentage, fixed, volume (based on totalQty), bundle (based on distinct items).
   * Returns the total discount amount.
   */
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
          amount = Math.min(rule.value, subtotal - totalDiscount); // don't exceed remaining
          break;

        case 'volume':
          // Apply only if total quantity across all items meets threshold
          if (context?.totalQuantity && rule.minQuantity && context.totalQuantity >= rule.minQuantity) {
            amount = parseFloat(((subtotal * rule.value) / 100).toFixed(2));
          }
          break;

        case 'bundle':
          // Apply only if the number of distinct line items meets threshold
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

    // Never discount more than the subtotal
    if (totalDiscount > subtotal) totalDiscount = subtotal;

    return { totalDiscount: parseFloat(totalDiscount.toFixed(2)), appliedRules };
  }

  /**
   * Generate a full quote from a price book.
   * Looks up prices from PriceBookEntry, applies quantity-based tier discounts:
   *   - 10+ units: 5% off
   *   - 50+ units: 10% off
   *   - 100+ units: 15% off
   * Then applies optional discount rules and tax.
   * Returns a full quote breakdown.
   */
  async generateQuote(
    priceBookId: number,
    items: QuoteItemRequest[],
    options?: { discountRules?: DiscountRule[]; taxRate?: number }
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
    const lines: QuoteLineResult[] = [];
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
      const lineTotal = parseFloat((discountedPrice * qty).toFixed(2));

      lines.push({
        entryId: entry.id,
        productName: entry.productName,
        sku: entry.sku || null,
        unitPrice,
        quantity: qty,
        quantityDiscount: qtyDiscount,
        lineTotal
      });

      subtotal += lineTotal;
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // Apply additional discount rules
    let discountAmount = 0;
    let appliedRules: { rule: DiscountRule; amount: number }[] = [];
    if (options?.discountRules && options.discountRules.length > 0) {
      const discountResult = this.applyDiscountRules(subtotal, options.discountRules, {
        totalQuantity,
        distinctItems: lines.length
      });
      discountAmount = discountResult.totalDiscount;
      appliedRules = discountResult.appliedRules;
    }

    const afterDiscount = parseFloat((subtotal - discountAmount).toFixed(2));

    // Tax (default 15% VAT for Saudi Arabia)
    const taxRate = options?.taxRate ?? 15;
    const taxAmount = parseFloat(((afterDiscount * taxRate) / 100).toFixed(2));
    const grandTotal = parseFloat((afterDiscount + taxAmount).toFixed(2));

    const quote = {
      success: true,
      quote: {
        priceBook: { id: book!.id, name: book!.name, currency: book!.currency },
        lines,
        summary: {
          subtotal,
          quantityDiscountSavings: parseFloat((lines.reduce((sum, l) => sum + (l.unitPrice * l.quantity - l.lineTotal), 0)).toFixed(2)),
          additionalDiscount: discountAmount,
          appliedRules,
          afterDiscount,
          taxRate,
          taxAmount,
          grandTotal,
          totalItems: lines.length,
          totalQuantity
        }
      }
    };

    try { io.emit('cpq:quote_generated', { priceBookId, grandTotal, totalItems: lines.length }); } catch {}
    return quote;
  }
}

export default new CpqService();
