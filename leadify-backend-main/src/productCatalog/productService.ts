import { Op, WhereOptions } from 'sequelize';
import CatalogProduct from './productModel';
import PriceRule from './priceRuleModel';
import { clampPagination } from '../utils/pagination';

class ProductService {
  async getProducts(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, category, isActive } = query;

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

    const { rows: docs, count: totalItems } = await CatalogProduct.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
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

  async createProduct(data: any): Promise<CatalogProduct> {
    return CatalogProduct.create(data);
  }

  async updateProduct(id: string, data: any): Promise<CatalogProduct> {
    const product = await CatalogProduct.findByPk(id);
    if (!product) throw new Error('Product not found');
    return product.update(data);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await CatalogProduct.findByPk(id);
    if (!product) throw new Error('Product not found');
    await PriceRule.destroy({ where: { productId: id } });
    await product.destroy();
  }
}

export default new ProductService();
