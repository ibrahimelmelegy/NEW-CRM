import QuoteLine from './quoteLineModel';
import CatalogProduct from './productModel';

class QuoteService {
  async getQuoteLines(quoteId: string): Promise<QuoteLine[]> {
    return QuoteLine.findAll({
      where: { quoteId },
      include: [{ model: CatalogProduct }],
      order: [['createdAt', 'ASC']]
    });
  }

  async addQuoteLine(data: unknown): Promise<QuoteLine> {
    const total = Number(data.quantity) * Number(data.unitPrice) - Number(data.discount || 0);
    return QuoteLine.create({ ...data, total });
  }

  async updateQuoteLine(id: string, data: unknown): Promise<QuoteLine> {
    const line = await QuoteLine.findByPk(id);
    if (!line) throw new Error('Quote line not found');

    const quantity = data.quantity !== undefined ? Number(data.quantity) : line.quantity;
    const unitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : line.unitPrice;
    const discount = data.discount !== undefined ? Number(data.discount) : line.discount;
    const total = quantity * unitPrice - discount;

    return line.update({ ...data, total });
  }

  async removeQuoteLine(id: string): Promise<void> {
    const line = await QuoteLine.findByPk(id);
    if (!line) throw new Error('Quote line not found');
    await line.destroy();
  }

  async calculateTotal(quoteId: string): Promise<{ subtotal: number; totalDiscount: number; grandTotal: number }> {
    const lines = await QuoteLine.findAll({ where: { quoteId } });

    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const totalDiscount = lines.reduce((sum, l) => sum + l.discount, 0);
    const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);

    return { subtotal, totalDiscount, grandTotal };
  }
}

export default new QuoteService();
