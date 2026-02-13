import { Op } from 'sequelize';
import Invoice from '../deal/model/invoiceMode';
import Deal from '../deal/model/dealModel';
import User from '../user/userModel';

class InvoiceService {
  async getInvoices(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const where: any = {};

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
      include: [{ model: Deal, as: 'deal' }]
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

  async getSummary() {
    const all = await Invoice.findAll({ raw: true });
    const totalAmount = all.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const collectedAmount = all.filter(inv => inv.collected).reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingAmount = totalAmount - collectedAmount;

    return {
      totalInvoices: all.length,
      totalAmount,
      collectedAmount,
      pendingAmount,
      collectedCount: all.filter(inv => inv.collected).length,
      pendingCount: all.filter(inv => !inv.collected).length
    };
  }
}

export default new InvoiceService();
