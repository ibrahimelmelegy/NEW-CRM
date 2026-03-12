import { Op, WhereOptions, literal } from 'sequelize';
import Product from './productModel';
import StockMovement from './stockMovementModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { clampPagination } from '../utils/pagination';

class InventoryService {
  async getProducts(query: Record<string, unknown>): Promise<unknown> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, category, warehouse, isActive } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      where[Op.or as any] = [
        { name: { [Op.iLike]: `%${searchKey}%` } },
        { sku: { [Op.iLike]: `%${searchKey}%` } },
        { description: { [Op.iLike]: `%${searchKey}%` } }
      ];
    }

    if (category) {
      (where as any).category = category;
    }

    if (warehouse) {
      (where as any).warehouse = warehouse;
    }

    if (isActive !== undefined && isActive !== '') {
      (where as any).isActive = isActive === 'true' || isActive === true;
    }

    const { rows: products, count: totalItems } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      docs: products,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  async getProductById(id: string): Promise<Product> {
    const product = await Product.findByPk(id, {
      include: [{ model: StockMovement, include: [{ model: User, attributes: ['id', 'name'] }] }]
    });
    if (!product) throw new BaseError(ERRORS.PRODUCT_NOT_FOUND);
    return product;
  }

  async createProduct(data: Record<string, unknown>): Promise<Product> {
    return await Product.create(data);
  }

  async updateProduct(id: string, data: Record<string, unknown>): Promise<Product> {
    const product = await this.productOrError({ id });
    product.set(data);
    await product.save();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productOrError({ id });
    await product.destroy();
  }

  async getStockMovements(productId: string): Promise<StockMovement[]> {
    return await StockMovement.findAll({
      where: { productId },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async addStockMovement(data: Record<string, unknown>): Promise<StockMovement> {
    const product = await this.productOrError({ id: data.productId });

    const movement = await StockMovement.create(data);

    // Update product stock based on movement type
    switch (data.type) {
      case 'IN':
        product.currentStock = Number(product.currentStock) + Number(data.quantity);
        break;
      case 'OUT':
        product.currentStock = Number(product.currentStock) - Number(data.quantity);
        break;
      case 'ADJUSTMENT':
        product.currentStock = Number(data.quantity);
        break;
      case 'TRANSFER':
        product.currentStock = Number(product.currentStock) - Number(data.quantity);
        break;
    }

    await product.save();
    return movement;
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await Product.findAll({
      where: literal('"currentStock" <= "minStockLevel"'),
      order: [['currentStock', 'ASC']]
    });
  }

  async getCategories(): Promise<string[]> {
    const results = await Product.findAll({
      attributes: [[literal('DISTINCT "category"'), 'category']],
      where: { category: { [Op.ne]: null } },
      raw: true
    });
    return results.map(r => r.category).filter(Boolean);
  }

  async getWarehouses(): Promise<string[]> {
    const results = await Product.findAll({
      attributes: [[literal('DISTINCT "warehouse"'), 'warehouse']],
      where: { warehouse: { [Op.ne]: null } },
      raw: true
    });
    return results.map(r => r.warehouse).filter(Boolean);
  }

  private async productOrError(filter: WhereOptions): Promise<Product> {
    const product = await Product.findOne({ where: filter });
    if (!product) throw new BaseError(ERRORS.PRODUCT_NOT_FOUND);
    return product;
  }
}

export default new InventoryService();
