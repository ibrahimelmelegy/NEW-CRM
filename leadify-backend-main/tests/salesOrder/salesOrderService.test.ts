
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import salesOrderService from '../../src/salesOrder/salesOrderService';
import SalesOrder from '../../src/salesOrder/models/salesOrderModel';
import SalesOrderItem from '../../src/salesOrder/models/salesOrderItemModel';
import Fulfillment from '../../src/salesOrder/models/fulfillmentModel';
import Client from '../../src/client/clientModel';
import Deal from '../../src/deal/model/dealModel';
import { SalesOrderStatusEnum, PaymentStatusEnum } from '../../src/salesOrder/models/salesOrderModel';
import { FulfillmentStatusEnum } from '../../src/salesOrder/models/fulfillmentModel';
import BaseError from '../../src/utils/error/base-http-exception';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/salesOrder/models/salesOrderModel');
jest.mock('../../src/salesOrder/models/salesOrderItemModel');
jest.mock('../../src/salesOrder/models/fulfillmentModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
};

jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
}));

jest.mock('../../src/utils/pagination', () => ({
    clampPagination: jest.fn((q: any) => ({
        page: q.page || 1,
        limit: q.limit || 10,
        offset: ((q.page || 1) - 1) * (q.limit || 10),
    })),
}));

describe('SalesOrderService', () => {
    const mockOrder: any = {
        id: 'order-1',
        orderNumber: 'SO-0001',
        status: SalesOrderStatusEnum.DRAFT,
        clientId: 'client-1',
        total: 100,
        subtotal: 100,
        taxAmount: 0,
        discountAmount: 0,
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // calculateTotals
    // --------------------------------------------------------------------------
    describe('calculateTotals', () => {
        it('should calculate subtotal, tax, discount and total correctly', () => {
            const items = [
                { quantity: 2, unitPrice: 100, taxRate: 15, discountRate: 10 },
                { quantity: 1, unitPrice: 50, taxRate: 0, discountRate: 0 },
            ];
            const result = salesOrderService.calculateTotals(items);

            // Item 1: base=200, disc=20, afterDisc=180, tax=27, line=207
            // Item 2: base=50, disc=0, afterDisc=50, tax=0, line=50
            expect(result.subtotal).toBe(250);
            expect(result.discountAmount).toBe(20);
            expect(result.taxAmount).toBe(27);
            expect(result.total).toBe(257);
        });

        it('should handle zero quantity and price gracefully', () => {
            const items = [{ quantity: 0, unitPrice: 0, taxRate: 0, discountRate: 0 }];
            const result = salesOrderService.calculateTotals(items);
            expect(result.total).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // generateOrderNumber
    // --------------------------------------------------------------------------
    describe('generateOrderNumber', () => {
        it('should generate order number based on current count', async () => {
            (SalesOrder.count as jest.Mock<any>).mockResolvedValue(5);
            const result = await salesOrderService.generateOrderNumber();
            expect(result).toBe('SO-0006');
        });

        it('should pad order number to 4 digits', async () => {
            (SalesOrder.count as jest.Mock<any>).mockResolvedValue(0);
            const result = await salesOrderService.generateOrderNumber();
            expect(result).toBe('SO-0001');
        });
    });

    // --------------------------------------------------------------------------
    // createOrder
    // --------------------------------------------------------------------------
    describe('createOrder', () => {
        it('should create an order with items inside a transaction', async () => {
            const input = {
                clientId: 'client-1',
                items: [{ quantity: 1, unitPrice: 100, taxRate: 0, discountRate: 0 }],
            };

            (SalesOrder.count as jest.Mock<any>).mockResolvedValue(0);
            (SalesOrder.create as jest.Mock<any>).mockResolvedValue(mockOrder);
            (SalesOrderItem.bulkCreate as jest.Mock<any>).mockResolvedValue([]);
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(mockOrder);

            const result = await salesOrderService.createOrder(input);
            expect(SalesOrder.create).toHaveBeenCalledWith(
                expect.objectContaining({ orderNumber: 'SO-0001' }),
                expect.anything()
            );
            expect(SalesOrderItem.bulkCreate).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(result).toEqual(mockOrder);
        });

        it('should throw if items array is empty', async () => {
            await expect(salesOrderService.createOrder({ items: [] }))
                .rejects.toThrow('Sales order must have at least one item');
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should throw if items is missing', async () => {
            await expect(salesOrderService.createOrder({}))
                .rejects.toThrow('Sales order must have at least one item');
        });
    });

    // --------------------------------------------------------------------------
    // getOrderById
    // --------------------------------------------------------------------------
    describe('getOrderById', () => {
        it('should return an order when found', async () => {
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(mockOrder);
            const result = await salesOrderService.getOrderById('order-1');
            expect(result).toEqual(mockOrder);
        });

        it('should throw NOT_FOUND when order does not exist', async () => {
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(salesOrderService.getOrderById('missing'))
                .rejects.toThrow(BaseError);
        });
    });

    // --------------------------------------------------------------------------
    // updateStatus
    // --------------------------------------------------------------------------
    describe('updateStatus', () => {
        it('should allow forward status transition', async () => {
            const draftOrder = { ...mockOrder, status: SalesOrderStatusEnum.DRAFT };
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(draftOrder);

            await salesOrderService.updateStatus('order-1', SalesOrderStatusEnum.CONFIRMED);
            expect(draftOrder.update).toHaveBeenCalledWith({ status: SalesOrderStatusEnum.CONFIRMED });
        });

        it('should reject backward status transition', async () => {
            const confirmedOrder = { ...mockOrder, status: SalesOrderStatusEnum.CONFIRMED, update: jest.fn() };
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(confirmedOrder);

            await expect(salesOrderService.updateStatus('order-1', SalesOrderStatusEnum.DRAFT))
                .rejects.toThrow(/Cannot transition/);
        });

        it('should always allow CANCELLED', async () => {
            const processingOrder = { ...mockOrder, status: SalesOrderStatusEnum.PROCESSING, update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(processingOrder);

            await salesOrderService.updateStatus('order-1', SalesOrderStatusEnum.CANCELLED);
            expect(processingOrder.update).toHaveBeenCalledWith({ status: SalesOrderStatusEnum.CANCELLED });
        });
    });

    // --------------------------------------------------------------------------
    // deleteOrder
    // --------------------------------------------------------------------------
    describe('deleteOrder', () => {
        it('should delete order and its related items and fulfillments', async () => {
            (SalesOrder.findByPk as jest.Mock<any>).mockResolvedValue(mockOrder);
            (Fulfillment.destroy as jest.Mock<any>).mockResolvedValue(1);
            (SalesOrderItem.destroy as jest.Mock<any>).mockResolvedValue(2);

            await salesOrderService.deleteOrder('order-1');
            expect(Fulfillment.destroy).toHaveBeenCalledWith({ where: { salesOrderId: 'order-1' } });
            expect(SalesOrderItem.destroy).toHaveBeenCalledWith({ where: { salesOrderId: 'order-1' } });
            expect(mockOrder.destroy).toHaveBeenCalled();
        });

        it('should throw NOT_FOUND when deleting non-existent order', async () => {
            (SalesOrder.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(salesOrderService.deleteOrder('missing'))
                .rejects.toThrow(BaseError);
        });
    });

    // --------------------------------------------------------------------------
    // convertDealToOrder
    // --------------------------------------------------------------------------
    describe('convertDealToOrder', () => {
        it('should convert a deal with a client to a sales order', async () => {
            const mockDeal = { id: 'deal-1', name: 'Big Deal', clientId: 'client-1', price: 5000 };
            (Deal.findOne as jest.Mock<any>).mockResolvedValue(mockDeal);
            (SalesOrder.count as jest.Mock<any>).mockResolvedValue(3);
            (SalesOrder.create as jest.Mock<any>).mockResolvedValue(mockOrder);
            (SalesOrderItem.create as jest.Mock<any>).mockResolvedValue({});
            (SalesOrder.findOne as jest.Mock<any>).mockResolvedValue(mockOrder);

            const result = await salesOrderService.convertDealToOrder('deal-1');
            expect(SalesOrder.create).toHaveBeenCalledWith(
                expect.objectContaining({ dealId: 'deal-1', clientId: 'client-1' })
            );
            expect(result).toEqual(mockOrder);
        });

        it('should throw if deal has no client', async () => {
            (Deal.findOne as jest.Mock<any>).mockResolvedValue({ id: 'deal-1', clientId: null });
            await expect(salesOrderService.convertDealToOrder('deal-1'))
                .rejects.toThrow(/must have a client/);
        });
    });
});
