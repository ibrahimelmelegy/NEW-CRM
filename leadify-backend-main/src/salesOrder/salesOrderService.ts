import { Op, WhereOptions, fn, col, literal } from 'sequelize';
import SalesOrder, { SalesOrderStatusEnum, PaymentStatusEnum } from './models/salesOrderModel';
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
  calculateTotals(items: Record<string, any>[]): { subtotal: number; taxAmount: number; discountAmount: number; total: number } {
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
          status: orderData.status || SalesOrderStatusEnum.DRAFT,
          paymentStatus: orderData.paymentStatus || PaymentStatusEnum.PENDING
        },
        { transaction }
      );

      const orderItems = items.map(item => ({
        ...item,
        salesOrderId: salesOrder.id,
        lineTotal: item.lineTotal
      }));

      await SalesOrderItem.bulkCreate(orderItems, { transaction });
      await transaction.commit();

      return await this.getOrderById(salesOrder.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get paginated list of orders with filters
   */
  async getOrders(query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);
    const { searchKey, status, clientId, paymentStatus, startDate, endDate } = query;

    const where: WhereOptions = {};

    if (searchKey) {
      (where as any)[Op.or] = [{ orderNumber: { [Op.iLike]: `%${searchKey}%` } }, { notes: { [Op.iLike]: `%${searchKey}%` } }];
    }
    if (status) {
      (where as any).status = status;
    }
    if (clientId) {
      (where as any).clientId = clientId;
    }
    if (paymentStatus) {
      (where as any).paymentStatus = paymentStatus;
    }

    // Date range filtering
    if (startDate || endDate) {
      (where as any).createdAt = {};
      if (startDate) (where as any).createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where as any).createdAt[Op.lte] = end;
      }
    }

    const { rows: docs, count: totalItems } = await SalesOrder.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email', 'companyName'] },
        { model: SalesOrderItem, as: 'items' }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
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

        const orderItems = items.map(item => ({
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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Valid status transitions (forward only, except CANCELLED is always allowed)
   */
  private static STATUS_ORDER = [
    SalesOrderStatusEnum.DRAFT,
    SalesOrderStatusEnum.CONFIRMED,
    SalesOrderStatusEnum.PROCESSING,
    SalesOrderStatusEnum.SHIPPED,
    SalesOrderStatusEnum.DELIVERED
  ];

  /**
   * Update order status with transition validation
   */
  async updateStatus(id: string, status: SalesOrderStatusEnum): Promise<SalesOrder> {
    const order = await this.getOrderById(id);
    const currentStatus = order.status as SalesOrderStatusEnum;

    // CANCELLED is always allowed
    if (status !== SalesOrderStatusEnum.CANCELLED) {
      const currentIdx = SalesOrderService.STATUS_ORDER.indexOf(currentStatus);
      const targetIdx = SalesOrderService.STATUS_ORDER.indexOf(status);

      // Cannot go backwards (except from CANCELLED)
      if (currentStatus !== SalesOrderStatusEnum.CANCELLED && targetIdx < currentIdx) {
        throw new BaseError(400, 400, `Cannot transition from ${currentStatus} to ${status}. Status can only move forward.`);
      }
    }

    // If delivered, cannot be changed (except to CANCELLED for refund purposes)
    if (currentStatus === SalesOrderStatusEnum.DELIVERED && status !== SalesOrderStatusEnum.CANCELLED) {
      throw new BaseError(400, 400, 'Delivered orders cannot change status (except to Cancelled for refunds).');
    }

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

  /**
   * Update payment status of an order
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatusEnum): Promise<SalesOrder> {
    const order = await this.getOrderById(id);

    // Validate payment status value
    if (!Object.values(PaymentStatusEnum).includes(paymentStatus)) {
      throw new BaseError(400, 400, `Invalid payment status: ${paymentStatus}. Must be one of: ${Object.values(PaymentStatusEnum).join(', ')}`);
    }

    await order.update({ paymentStatus });
    return await this.getOrderById(id);
  }

  /**
   * Delete a sales order and all associated items/fulfillments
   */
  async deleteOrder(id: string): Promise<void> {
    const order = await SalesOrder.findByPk(id);
    if (!order) throw new BaseError(ERRORS.NOT_FOUND, 404, 'Sales order not found');

    await Fulfillment.destroy({ where: { salesOrderId: id } });
    await SalesOrderItem.destroy({ where: { salesOrderId: id } });
    await order.destroy();
  }

  /**
   * Get orders for a specific client
   */
  async getClientOrders(clientId: string, query: any): Promise<any> {
    const { page, limit, offset } = clampPagination(query);

    const { rows: docs, count: totalItems } = await SalesOrder.findAndCountAll({
      where: { clientId },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'clientName', 'email', 'companyName'] },
        { model: SalesOrderItem, as: 'items' }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
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
   * Convert cart to a sales order
   */
  async convertCartToOrder(cartData: any): Promise<SalesOrder> {
    const { clientId, items, currency, notes, shippingAddress, couponDiscount } = cartData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BaseError(400, 400, 'Cart must have at least one item');
    }

    const orderItems = items.map(item => ({
      productId: item.productId,
      description: item.productName || item.description || 'Cart item',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      taxRate: item.taxRate || 15,
      discountRate: item.discountRate || 0
    }));

    const orderData: Record<string, any> = {
      clientId,
      currency: currency || 'SAR',
      notes: notes || 'Converted from cart',
      shippingAddress: shippingAddress || '',
      items: orderItems
    };

    // Apply coupon discount as a global discount
    if (couponDiscount && couponDiscount > 0) {
      orderData.notes = `${orderData.notes} | Coupon discount: ${couponDiscount}`;
    }

    return this.createOrder(orderData);
  }

  /**
   * Order analytics: revenue, counts, averages, status distribution
   */
  async getOrderAnalytics(query?: Record<string, any>): Promise<any> {
    const where: WhereOptions = {};

    // Optional date range
    if (query?.startDate || query?.endDate) {
      (where as any).createdAt = {};
      if (query.startDate) (where as any).createdAt[Op.gte] = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        (where as any).createdAt[Op.lte] = end;
      }
    }

    // Total counts and sums
    const [totalOrders, orderStats, statusCounts, recentOrders] = await Promise.all([
      SalesOrder.count({ where }),
      SalesOrder.findOne({
        attributes: [
          [fn('COALESCE', fn('SUM', col('total')), 0), 'totalRevenue'],
          [fn('COALESCE', fn('AVG', col('total')), 0), 'avgOrderValue'],
          [fn('COALESCE', fn('SUM', col('subtotal')), 0), 'totalSubtotal'],
          [fn('COALESCE', fn('SUM', col('taxAmount')), 0), 'totalTax'],
          [fn('COALESCE', fn('SUM', col('discountAmount')), 0), 'totalDiscount']
        ],
        where,
        raw: true
      }) as any,
      SalesOrder.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['status'],
        raw: true
      }),
      SalesOrder.findAll({
        where,
        include: [
          { model: Client, as: 'client', attributes: ['id', 'clientName', 'email'] },
          { model: SalesOrderItem, as: 'items' }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    // Build status distribution map
    const ordersByStatus: Record<string, number> = {};
    for (const sc of statusCounts || []) {
      ordersByStatus[(sc as any).status] = parseInt((sc as any).count, 10);
    }

    // Revenue grouped by day of week (Mon-Sun) using SQL
    const revenueByDow = (await SalesOrder.findAll({
      attributes: [
        [fn('EXTRACT', literal(`DOW FROM "createdAt"`)), 'dow'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'revenue']
      ],
      where,
      group: [fn('EXTRACT', literal(`DOW FROM "createdAt"`))],
      order: [[fn('EXTRACT', literal(`DOW FROM "createdAt"`)), 'ASC']],
      raw: true
    })) as any[];

    // Map DOW (0=Sun...6=Sat) -> {Mon,Tue,...,Sun}
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDayOfWeek: Record<string, number> = {};
    for (const name of dayNames) revenueByDayOfWeek[name] = 0;
    for (const row of revenueByDow || []) {
      const dowIndex = parseInt(row.dow, 10);
      if (dayNames[dowIndex]) {
        revenueByDayOfWeek[dayNames[dowIndex]!] = parseFloat(row.revenue || 0);
      }
    }

    // Revenue grouped by month for trend
    const revenueByMonth = (await SalesOrder.findAll({
      attributes: [
        [fn('to_char', col('createdAt'), 'YYYY-MM'), 'month'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'revenue'],
        [fn('COUNT', col('id')), 'count']
      ],
      where,
      group: [fn('to_char', col('createdAt'), 'YYYY-MM')],
      order: [[fn('to_char', col('createdAt'), 'YYYY-MM'), 'DESC']],
      limit: 12,
      raw: true
    })) as any[];

    return {
      totalOrders,
      totalRevenue: parseFloat(orderStats?.totalRevenue || 0),
      avgOrderValue: parseFloat(orderStats?.avgOrderValue || 0),
      totalSubtotal: parseFloat(orderStats?.totalSubtotal || 0),
      totalTax: parseFloat(orderStats?.totalTax || 0),
      totalDiscount: parseFloat(orderStats?.totalDiscount || 0),
      ordersByStatus,
      revenueByDayOfWeek,
      revenueByMonth,
      recentOrders
    };
  }
}

export default new SalesOrderService();
