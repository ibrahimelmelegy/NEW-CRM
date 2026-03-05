import { Op, fn, col, literal } from 'sequelize';
import Payment, { PaymentStatusEnum } from './models/paymentModel';
import PaymentReminder, { ReminderStatusEnum } from './models/paymentReminderModel';
import Invoice from '../deal/model/invoiceMode';
import Client from '../client/clientModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { clampPagination } from '../utils/pagination';

class PaymentService {
  /**
   * Generate the next sequential payment number (PAY-0001, PAY-0002, ...)
   */
  public async generatePaymentNumber(): Promise<string> {
    const lastPayment = await Payment.findOne({
      order: [['createdAt', 'DESC']]
    });

    let nextNum = 1;
    if (lastPayment && lastPayment.paymentNumber) {
      const match = lastPayment.paymentNumber.match(/PAY-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `PAY-${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Record a new payment
   */
  public async recordPayment(data: any): Promise<Payment> {
    const paymentNumber = await this.generatePaymentNumber();

    const payment = await Payment.create({
      ...data,
      paymentNumber,
      status: data.status || PaymentStatusEnum.COMPLETED
    });

    // If linked to an invoice, update the invoice collected status
    if (data.invoiceId) {
      await this.updateInvoiceCollectionStatus(data.invoiceId, Number(data.amount));
    }

    return payment;
  }

  /**
   * Update invoice collection status after payment
   */
  private async updateInvoiceCollectionStatus(invoiceId: number, paymentAmount: number): Promise<void> {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) return;

    // Sum all completed payments for this invoice
    const totalPaid = await Payment.sum('amount', {
      where: {
        invoiceId,
        status: PaymentStatusEnum.COMPLETED
      }
    });

    // Mark as collected if total payments cover the invoice amount
    if (totalPaid >= invoice.amount) {
      await invoice.update({
        collected: true,
        collectedDate: new Date()
      });
    }
  }

  /**
   * List payments with filters and pagination
   */
  public async getPayments(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { clientId, method, status, startDate, endDate, searchKey } = query;

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (method) where.method = method;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (searchKey) {
      where[Op.or] = [{ paymentNumber: { [Op.iLike]: `%${searchKey}%` } }, { reference: { [Op.iLike]: `%${searchKey}%` } }];
    }

    const { rows: payments, count: totalItems } = await Payment.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      docs: payments,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  /**
   * Get a single payment by ID
   */
  public async getPaymentById(id: string): Promise<Payment> {
    const payment = await Payment.findByPk(id, {
      include: [{ model: Client, as: 'client', attributes: ['id', 'clientName', 'email', 'phoneNumber', 'companyName'] }]
    });
    if (!payment) throw new BaseError(ERRORS.PAYMENT_NOT_FOUND);
    return payment;
  }

  /**
   * Void a payment and reverse invoice collection if applicable
   */
  public async voidPayment(id: string): Promise<Payment> {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new BaseError(ERRORS.PAYMENT_NOT_FOUND);

    if (payment.status === PaymentStatusEnum.VOIDED) {
      throw new BaseError(ERRORS.PAYMENT_ALREADY_VOIDED);
    }

    await payment.update({ status: PaymentStatusEnum.VOIDED });

    // Reverse invoice collected status if applicable
    if (payment.invoiceId) {
      const invoice = await Invoice.findByPk(payment.invoiceId);
      if (invoice && invoice.collected) {
        // Recalculate total active payments for this invoice
        const totalPaid = await Payment.sum('amount', {
          where: {
            invoiceId: payment.invoiceId,
            status: PaymentStatusEnum.COMPLETED
          }
        });

        if ((totalPaid || 0) < invoice.amount) {
          await invoice.update({
            collected: false,
            collectedDate: null
          });
        }
      }
    }

    return payment;
  }

  /**
   * Collection dashboard data
   */
  public async getCollectionDashboard(): Promise<any> {
    // Total receivable: sum of all uncollected invoice amounts
    const totalReceivableResult = await Invoice.sum('amount', {
      where: { collected: { [Op.or]: [false, null] } }
    });
    const totalReceivable = totalReceivableResult || 0;

    // Total overdue: invoices past due date that are not collected
    const totalOverdueResult = await Invoice.sum('amount', {
      where: {
        collected: { [Op.or]: [false, null] },
        invoiceDate: { [Op.lt]: new Date() }
      }
    });
    const totalOverdue = totalOverdueResult || 0;

    // Collected this month (MTD)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const collectedMTDResult = await Payment.sum('amount', {
      where: {
        status: PaymentStatusEnum.COMPLETED,
        date: { [Op.gte]: startOfMonth }
      }
    });
    const collectedMTD = collectedMTDResult || 0;

    // Top debtors: clients with highest unpaid invoice amounts
    const topDebtors = await Client.findAll({
      attributes: ['id', 'clientName', 'email', [fn('SUM', col('amount')), 'totalOwed']],
      include: [
        {
          model: Invoice,
          as: 'invoices',
          attributes: [],
          where: { collected: { [Op.or]: [false, null] } },
          required: true
        }
      ],
      group: ['Client.id'],
      order: [[literal('"totalOwed"'), 'DESC']],
      limit: 10,
      subQuery: false
    }).catch(() => {
      // Fallback if association not set up: return empty
      return [];
    });

    return {
      totalReceivable,
      overdue: totalOverdue,
      collectedMTD,
      collectionRate: totalReceivable > 0 ? Math.round((collectedMTD / (totalReceivable + collectedMTD)) * 100) : 0,
      topDebtors
    };
  }

  /**
   * Get payment history for a specific client
   */
  public async getClientPaymentHistory(clientId: string): Promise<any> {
    const payments = await Payment.findAll({
      where: { clientId },
      order: [['date', 'DESC']],
      include: [{ model: Client, as: 'client', attributes: ['id', 'clientName'] }]
    });

    const totalPaid = payments.filter(p => p.status === PaymentStatusEnum.COMPLETED).reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      payments,
      summary: {
        totalPayments: payments.length,
        totalPaid,
        lastPaymentDate: payments.length > 0 ? payments[0].date : null
      }
    };
  }

  /**
   * Send a payment reminder for an invoice
   */
  public async sendReminder(invoiceId: number, type: string, method: string): Promise<PaymentReminder> {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new BaseError(ERRORS.INVOICE_NOT_FOUND);

    const reminder = await PaymentReminder.create({
      invoiceId,
      sentAt: new Date(),
      type,
      method,
      status: ReminderStatusEnum.SENT
    });

    return reminder;
  }
}

export default new PaymentService();
