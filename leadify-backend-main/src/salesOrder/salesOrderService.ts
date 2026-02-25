import { Op, WhereOptions } from 'sequelize';
import SalesOrder, { SalesOrderStatusEnum } from './models/salesOrderModel';
import SalesOrderItem from './models/salesOrderItemModel';
import Fulfillment, { FulfillmentStatusEnum } from './models/fulfillmentModel';
import Client from '../client/clientModel';
import Deal from '../deal/model/dealModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { sequelize } from '../config/db';
import { clampPagination } from '../utils/pagination';

class SalesOrderService {
  /**
   * Generate a sequential order number like SO-0001
   */
  async generateOrderNumber(): Promise<string> {
    const count = await SalesOrder.count();
    return `SO-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Calculate totals from line items
   */
  calculateTotals(items: any[]): { subtotal: number; taxAmount: number; discountAmount: number; total: number } {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const discountRate = Number(item.discountRate) || 0;

      const lineBase = qty * price;
      const lineDiscount = lineBase * (discountRate / 100);
      const lineAfterDiscount = lineBase - lineDiscount;
      const lineTax = lineAfterDiscount * (taxRate / 100);
      const lineTotal = lineAfterDiscount + lineTax;

      subtotal += lineBase;
      taxAmount += lineTax;
      discountAmount += lineDiscount;

      item.lineTotal = parseFloat(lineTotal.toFixed(2));
    }

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat((subtotal - discountAmount + taxAmount).toFixed(2))
    };
  }

  /**
   * Create a new sales order
   */
  async createOrder(input: any): Promise<SalesOrder> {
    const transaction = await sequelize.transaction();
    try {
      const { items, ...orderData } = input;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BaseError(400, 400, 'Sales order must have at least one item');
      }

      const orderNumber = await this.generateOrderNumber();
      const totals = this.calculateTotals(items);

      const salesOrder = await SalesOrder.create(
        {
          ...orderData,
          orderNumber,
          ...totals,
          status: orderData.status || SalesOrderStatusEnum.DRAFT
        },
        { transaction }
      );

      const orderItems = items.map((item: any) => ({
        ...item,
        salesOrderId: salesOrder.id,
        lineTotal: item.lineTotal
      }));

      await SalesOrderItem.bulkCreate(orderItems, { transaction });
      await transaction.commit();

      return await this.getOrderById(salesOrder.id);
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get paginated list of orders with filters
   */
  async getOrders(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, status, clientId } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      (where as any)[Op.or] = [{ orderNumber: { [Op.iLike]: `%${searchKey}%` } }];
    }
    if (status) {
      (where as any).status = status;
    }
    if (clientId) {
      (where as any).clientId = clientId;
    }

    const { rows: docs, count: totalItems } = await SalesOrder.findAndCountAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['id', 'clientName', 'email', 'companyName'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
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
   * Get a single order by ID with all associations
   */
  async getOrderById(id: string): Promise<SalesOrder> {
    const order = await SalesOrder.findOne({
      where: { id },
      include: [
        { model: Client, as: 'client' },
        { model: SalesOrderItem, as: 'items' },
        { model: Fulfillment, as: 'fulfillments' }
      ]
    });
    if (!order) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Sales order not found');
    return order;
  }

  /**
   * Update a sales order
   */
  async updateOrder(id: string, input: any): Promise<SalesOrder> {
    const transaction = await sequelize.transaction();
    try {
      const order = await this.getOrderById(id);
      const { items, ...orderData } = input;

      if (items && Array.isArray(items)) {
        const totals = this.calculateTotals(items);

        // Remove old items and recreate
        await SalesOrderItem.destroy({ where: { salesOrderId: id }, transaction });

        const orderItems = items.map((item: any) => ({
          ...item,
          salesOrderId: id,
          lineTotal: item.lineTotal
        }));

        await SalesOrderItem.bulkCreate(orderItems, { transaction });

        await order.update({ ...orderData, ...totals }, { transaction });
      } else {
        await order.update(orderData, { transaction });
      }

      await transaction.commit();
      return await this.getOrderById(id);
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: SalesOrderStatusEnum): Promise<SalesOrder> {
    const order = await this.getOrderById(id);
    await order.update({ status });
    return await this.getOrderById(id);
  }

  /**
   * Convert a deal to a sales order
   */
  async convertDealToOrder(dealId: string): Promise<SalesOrder> {
    const deal = await Deal.findOne({
      where: { id: dealId },
      include: [{ model: Client, as: 'client' }]
    });

    if (!deal) throw new BaseError(ERRORS.DEAL_NOT_FOUND, 404, 'Deal not found');

    if (!deal.clientId) {
      throw new BaseError(400, 400, 'Deal must have a client assigned before converting to a sales order');
    }

    const orderNumber = await this.generateOrderNumber();

    const salesOrder = await SalesOrder.create({
      orderNumber,
      status: SalesOrderStatusEnum.DRAFT,
      dealId: deal.id,
      clientId: deal.clientId,
      subtotal: deal.price || 0,
      taxAmount: 0,
      discountAmount: 0,
      total: deal.price || 0,
      currency: 'SAR',
      notes: `Converted from deal: ${deal.name}`
    });

    // Create a single line item from the deal
    await SalesOrderItem.create({
      salesOrderId: salesOrder.id,
      description: deal.name || 'Deal conversion item',
      quantity: 1,
      unitPrice: deal.price || 0,
      taxRate: 0,
      discountRate: 0,
      lineTotal: deal.price || 0
    });

    return await this.getOrderById(salesOrder.id);
  }

  /**
   * Add a fulfillment record to an order
   */
  async addFulfillment(orderId: string, data: any): Promise<Fulfillment> {
    // Verify order exists
    await this.getOrderById(orderId);

    const fulfillment = await Fulfillment.create({
      ...data,
      salesOrderId: orderId,
      status: data.status || FulfillmentStatusEnum.PENDING
    });

    return fulfillment;
  }

  /**
   * Update a fulfillment record
   */
  async updateFulfillment(orderId: string, fulfillmentId: string, data: any): Promise<Fulfillment> {
    // Verify order exists
    await this.getOrderById(orderId);

    const fulfillment = await Fulfillment.findOne({
      where: { id: fulfillmentId, salesOrderId: orderId }
    });

    if (!fulfillment) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Fulfillment not found');

    // If status changed to SHIPPED, set shippedDate
    if (data.status === FulfillmentStatusEnum.SHIPPED && !fulfillment.shippedDate) {
      data.shippedDate = new Date();
    }
    // If status changed to DELIVERED, set deliveredDate
    if (data.status === FulfillmentStatusEnum.DELIVERED && !fulfillment.deliveredDate) {
      data.deliveredDate = new Date();
    }

    await fulfillment.update(data);
    return fulfillment;
  }
}

export default new SalesOrderService();
