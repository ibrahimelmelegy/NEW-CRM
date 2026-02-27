import { Op } from 'sequelize';
import { PriceBook, PriceBookEntry } from './cpqModel';
import { clampPagination } from '../utils/pagination';

class CpqService {
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
}

export default new CpqService();
