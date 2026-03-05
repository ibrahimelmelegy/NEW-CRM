import { Op, WhereOptions, fn, col, literal } from 'sequelize';
import CatalogProduct from './productModel';
import PriceRule from './priceRuleModel';
import EcReview from '../ecommerce/review/reviewModel';
import Client from '../client/clientModel';
import { clampPagination } from '../utils/pagination';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class ProductService {
  /**
   * Get paginated products with advanced filtering
   */
  async getProducts(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, category, isActive, minPrice, maxPrice, lowStock, sortBy, sortOrder: sortDir } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      (where as any)[Op.or] = [
        { name: { [Op.iLike]: `%${searchKey}%` } },
        { sku: { [Op.iLike]: `%${searchKey}%` } },
        { description: { [Op.iLike]: `%${searchKey}%` } }
      ];
    }

    if (category) {
      (where as any).category = category;
    }

    if (isActive !== undefined && isActive !== '') {
      (where as any).isActive = isActive === 'true' || isActive === true;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      (where as any).unitPrice = {};
      if (minPrice) (where as any).unitPrice[Op.gte] = Number(minPrice);
      if (maxPrice) (where as any).unitPrice[Op.lte] = Number(maxPrice);
    }

    // Low stock filter
    if (lowStock === 'true') {
      (where as any).stockQuantity = {
        [Op.lte]: literal('"CatalogProduct"."lowStockThreshold"')
      };
    }

    // Sorting
    const orderClause: any[] = [];
    if (sortBy) {
      orderClause.push([sortBy, (sortDir || 'ASC').toUpperCase()]);
    } else {
      orderClause.push(['createdAt', 'DESC']);
    }

    const { rows: docs, count: totalItems } = await CatalogProduct.findAndCountAll({
      where,
      limit,
      offset,
      order: orderClause,
      include: [{ model: PriceRule, required: false }]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  /**
   * Get a single product by ID with all associations
   */
  async getProductById(id: string): Promise<CatalogProduct> {
    const product = await CatalogProduct.findOne({
      where: { id },
      include: [{ model: PriceRule, required: false }]
    });
    if (!product) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Product not found');
    return product;
  }

  /**
   * Create a new product, recording initial price in priceHistory
   */
  async createProduct(data: any): Promise<CatalogProduct> {
    // Build initial price history entry
    if (data.unitPrice !== undefined && data.unitPrice > 0) {
      data.priceHistory = [{ price: data.unitPrice, date: new Date().toISOString() }];
    }
    return CatalogProduct.create(data);
  }

  /**
   * Update a product. If unitPrice changed, append to priceHistory.
   */
  async updateProduct(id: string, data: any): Promise<CatalogProduct> {
    const product = await CatalogProduct.findByPk(id);
    if (!product) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Product not found');

    // Track price changes
    if (data.unitPrice !== undefined && Number(data.unitPrice) !== Number(product.unitPrice)) {
      const history = Array.isArray(product.priceHistory) ? [...product.priceHistory] : [];
      history.push({ price: data.unitPrice, date: new Date().toISOString() });
      data.priceHistory = history;
    }

    return product.update(data);
  }

  /**
   * Delete a product and its price rules
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await CatalogProduct.findByPk(id);
    if (!product) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Product not found');
    await PriceRule.destroy({ where: { productId: id } });
    await product.destroy();
  }

  // ─── Inventory Helpers ──────────────────────────────────────────────────────

  /**
   * Get products that are low in stock
   */
  async getLowStockProducts(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);

    const { rows: docs, count: totalItems } = await CatalogProduct.findAndCountAll({
      where: {
        isActive: true,
        stockQuantity: { [Op.lte]: literal('"CatalogProduct"."lowStockThreshold"') }
      },
      limit,
      offset,
      order: [['stockQuantity', 'ASC']]
    });

    return {
      docs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  /**
   * Update stock quantity for a product
   */
  async updateStock(id: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set'): Promise<CatalogProduct> {
    const product = await CatalogProduct.findByPk(id);
    if (!product) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Product not found');

    let newQuantity: number;
    if (operation === 'add') {
      newQuantity = product.stockQuantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, product.stockQuantity - quantity);
    } else {
      newQuantity = quantity;
    }

    await product.update({ stockQuantity: newQuantity });
    return product;
  }

  // ─── Price Rules CRUD ───────────────────────────────────────────────────────

  /**
   * Get all price rules for a product
   */
  async getProductPriceRules(productId: string): Promise<PriceRule[]> {
    return PriceRule.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Create a price rule for a product
   */
  async createPriceRule(productId: string, data: any): Promise<PriceRule> {
    // Verify product exists
    await this.getProductById(productId);

    return PriceRule.create({
      ...data,
      productId,
      // Map frontend field names to model fields
      type: data.discountType || data.type || 'discount',
      value: data.discountValue ?? data.value ?? 0,
      discountType: data.discountType || data.type || 'percentage',
      discountValue: data.discountValue ?? data.value ?? 0
    });
  }

  /**
   * Update a price rule
   */
  async updatePriceRule(productId: string, ruleId: string, data: any): Promise<PriceRule> {
    const rule = await PriceRule.findOne({ where: { id: ruleId, productId } });
    if (!rule) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Price rule not found');
    return rule.update(data);
  }

  /**
   * Delete a price rule
   */
  async deletePriceRule(productId: string, ruleId: string): Promise<void> {
    const rule = await PriceRule.findOne({ where: { id: ruleId, productId } });
    if (!rule) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Price rule not found');
    await rule.destroy();
  }

  // ─── Product Reviews (proxy to ecommerce reviews filtered by productId) ────

  /**
   * Get reviews for a specific product
   */
  async getProductReviews(productId: string): Promise<any> {
    const reviews = await EcReview.findAll({
      where: { productId },
      include: [{ model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    return { docs: reviews };
  }

  // ─── Product Activity Log ──────────────────────────────────────────────────

  /**
   * Get activity log for a product (derived from price history and timestamps)
   */
  async getProductActivity(productId: string): Promise<any[]> {
    const product = await CatalogProduct.findByPk(productId);
    if (!product) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Product not found');

    const activity: any[] = [];

    // Creation event
    activity.push({
      type: 'created',
      description: `Product "${product.name}" was created`,
      date: product.getDataValue('createdAt'),
      createdAt: product.getDataValue('createdAt')
    });

    // Price change events from history
    const priceHistory = Array.isArray(product.priceHistory) ? product.priceHistory : [];
    for (const entry of priceHistory) {
      const e = entry as any;
      activity.push({
        type: 'price_change',
        description: `Price changed to ${e.price}`,
        date: e.date,
        createdAt: e.date
      });
    }

    // Last updated event (if different from created)
    const createdAt = product.getDataValue('createdAt');
    const updatedAt = product.getDataValue('updatedAt');
    if (createdAt && updatedAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime()) {
      activity.push({
        type: 'updated',
        description: `Product "${product.name}" was updated`,
        date: updatedAt,
        createdAt: updatedAt
      });
    }

    // Sort by date descending
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return activity;
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  /**
   * Bulk import products
   */
  async bulkImport(products: Record<string, any>[]): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        if (!product.name) {
          errors.push(`Row missing required field "name": ${JSON.stringify(product)}`);
          continue;
        }
        await CatalogProduct.create({
          ...product,
          priceHistory: product.unitPrice ? [{ price: product.unitPrice, date: new Date().toISOString() }] : []
        });
        created++;
      } catch (err: any) {
        errors.push(`Failed to create "${product.name}": ${err.message}`);
      }
    }

    return { created, errors };
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  /**
   * Product analytics: stock value, category distribution, etc.
   */
  async getProductAnalytics(): Promise<any> {
    const [totalProducts, activeProducts, lowStockProducts] = await Promise.all([
      CatalogProduct.count(),
      CatalogProduct.count({ where: { isActive: true } }),
      CatalogProduct.count({
        where: {
          isActive: true,
          stockQuantity: { [Op.lte]: literal('"CatalogProduct"."lowStockThreshold"') }
        }
      })
    ]);

    // Stock value (SUM of unitPrice * stockQuantity)
    const stockValueResult = await CatalogProduct.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', literal('"unitPrice" * "stockQuantity"')), 0), 'stockValue']
      ],
      where: { isActive: true },
      raw: true
    });

    // Category distribution
    const categoryDist: Record<string, any>[] = await CatalogProduct.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['category'],
      raw: true,
      order: [[fn('COUNT', col('id')), 'DESC']]
    });

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      lowStockProducts,
      stockValue: parseFloat((stockValueResult as any)?.stockValue || 0),
      categoryDistribution: categoryDist
    };
  }
}

export default new ProductService();
