import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import cartRecoveryService from '../../src/cartRecovery/cartRecoveryService';
import AbandonedCart from '../../src/cartRecovery/abandonedCartModel';
import Client from '../../src/client/clientModel';

jest.mock('../../src/cartRecovery/abandonedCartModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('CartRecoveryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create an abandoned cart and emit cart:abandoned', async () => {
      const mockCart = { id: 1, totalValue: 150, customerId: 'cust-1' };
      (AbandonedCart.create as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.create(
        { customerId: 'cust-1', items: [{ productId: 'p1', name: 'Shirt', quantity: 2, price: 75 }] },
        'tenant-1'
      );

      expect(AbandonedCart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          tenantId: 'tenant-1'
        })
      );
      expect(result).toEqual(mockCart);
    });

    it('should auto-calculate totalValue from items when not provided', async () => {
      (AbandonedCart.create as jest.Mock<any>).mockResolvedValue({ id: 2 });

      await cartRecoveryService.create({
        customerId: 'cust-2',
        items: [
          { productId: 'p1', name: 'A', quantity: 2, price: 50 },
          { productId: 'p2', name: 'B', quantity: 1, price: 100 }
        ]
      });

      // 2*50 + 1*100 = 200
      expect(AbandonedCart.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalValue: 200 })
      );
    });

    it('should not overwrite totalValue if already provided', async () => {
      (AbandonedCart.create as jest.Mock<any>).mockResolvedValue({ id: 3 });

      await cartRecoveryService.create({
        customerId: 'cust-3',
        items: [{ productId: 'p1', name: 'A', quantity: 2, price: 50 }],
        totalValue: 999
      });

      expect(AbandonedCart.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalValue: 999 })
      );
    });

    it('should set abandonedAt to now when not provided', async () => {
      (AbandonedCart.create as jest.Mock<any>).mockResolvedValue({ id: 4 });

      await cartRecoveryService.create({ customerId: 'cust-4', items: [] });

      expect(AbandonedCart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          abandonedAt: expect.any(Date)
        })
      );
    });

    it('should not throw when io.emit fails', async () => {
      const { io } = require('../../src/server');
      io.emit.mockImplementation(() => { throw new Error('socket error'); });
      (AbandonedCart.create as jest.Mock<any>).mockResolvedValue({ id: 5, totalValue: 0 });

      const result = await cartRecoveryService.create({ customerId: 'c', items: [] });
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('should return paginated carts with customer include', async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      (AbandonedCart.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 2 });

      const result = await cartRecoveryService.getAll({ page: 1, limit: 20 }, 'tenant-1');

      expect(AbandonedCart.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({ model: Client, as: 'customer' })
          ]),
          order: [['abandonedAt', 'DESC']],
          limit: 20,
          offset: 0,
          distinct: true
        })
      );
      expect(result.docs).toEqual(mockRows);
      expect(result.pagination.totalItems).toBe(2);
    });

    it('should filter by recoveryStatus and customerId', async () => {
      (AbandonedCart.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await cartRecoveryService.getAll({
        recoveryStatus: 'ABANDONED',
        customerId: 'cust-1'
      });

      expect(AbandonedCart.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recoveryStatus: 'ABANDONED',
            customerId: 'cust-1'
          })
        })
      );
    });

    it('should filter by minValue and maxValue', async () => {
      (AbandonedCart.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await cartRecoveryService.getAll({ minValue: '100', maxValue: '500' });

      expect(AbandonedCart.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            totalValue: expect.anything()
          })
        })
      );
    });

    it('should filter by date range', async () => {
      (AbandonedCart.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await cartRecoveryService.getAll({
        fromDate: '2026-01-01',
        toDate: '2026-02-28'
      });

      expect(AbandonedCart.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            abandonedAt: expect.anything()
          })
        })
      );
    });

    it('should return empty docs when no carts found', async () => {
      (AbandonedCart.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await cartRecoveryService.getAll({});

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a cart by id with customer include', async () => {
      const mockCart = { id: 1, customerId: 'cust-1' };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.getById(1);

      expect(AbandonedCart.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Client, as: 'customer' })
        ])
      }));
      expect(result).toEqual(mockCart);
    });

    it('should return null if cart not found', async () => {
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cartRecoveryService.getById(999);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update and return the cart', async () => {
      const mockItem: any = { id: 1, update: jest.fn().mockImplementation(() => Promise.resolve(true)) };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await cartRecoveryService.update(1, { recoveryStatus: 'REMINDED' });

      expect(mockItem.update).toHaveBeenCalledWith({ recoveryStatus: 'REMINDED' });
      expect(result).toEqual(mockItem);
    });

    it('should return null if cart not found', async () => {
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cartRecoveryService.update(999, { recoveryStatus: 'REMINDED' });

      expect(result).toBeNull();
    });

    it('should emit cart:updated on success', async () => {
      const { io } = require('../../src/server');
      const mockItem = { id: 7, update: jest.fn() };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      await cartRecoveryService.update(7, {});

      expect(io.emit).toHaveBeenCalledWith('cart:updated', { id: 7 });
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete the cart and return true', async () => {
      const mockItem = { id: 1, destroy: jest.fn() };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockItem);

      const result = await cartRecoveryService.delete(1);

      expect(mockItem.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if cart not found', async () => {
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cartRecoveryService.delete(999);

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // sendRecoveryReminder
  // ---------------------------------------------------------------------------
  describe('sendRecoveryReminder', () => {
    it('should return null if cart not found', async () => {
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cartRecoveryService.sendRecoveryReminder(999);

      expect(result).toBeNull();
    });

    it('should return message if cart already recovered', async () => {
      const mockCart = { id: 1, recoveryStatus: 'RECOVERED' };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.sendRecoveryReminder(1);

      expect(result).toEqual({ message: 'Cart already recovered' });
    });

    it('should return message if cart has expired', async () => {
      const mockCart = { id: 2, recoveryStatus: 'EXPIRED' };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.sendRecoveryReminder(2);

      expect(result).toEqual({ message: 'Cart has expired' });
    });

    it('should update the cart with REMINDED status and increment reminderCount', async () => {
      const mockCart = {
        id: 3,
        recoveryStatus: 'ABANDONED',
        reminderCount: 0,
        customerId: 'cust-1',
        customerEmail: 'cust@test.com',
        update: jest.fn()
      };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.sendRecoveryReminder(3);

      expect(mockCart.update).toHaveBeenCalledWith({
        recoveryStatus: 'REMINDED',
        lastReminder: expect.any(Date),
        reminderCount: 1
      });
      expect(result).toEqual(expect.objectContaining({
        success: true,
        cartId: 3,
        customerId: 'cust-1',
        customerEmail: 'cust@test.com'
      }));
    });

    it('should send reminder for REMINDED carts (re-remind)', async () => {
      const mockCart = {
        id: 4,
        recoveryStatus: 'REMINDED',
        reminderCount: 2,
        customerId: 'cust-2',
        customerEmail: 'cust2@test.com',
        update: jest.fn()
      };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.sendRecoveryReminder(4);

      expect(mockCart.update).toHaveBeenCalledWith(
        expect.objectContaining({ reminderCount: 3 })
      );
      expect(result).toEqual(expect.objectContaining({ success: true }));
    });

    it('should emit cart:reminderSent event', async () => {
      const { io } = require('../../src/server');
      const mockCart = {
        id: 5,
        recoveryStatus: 'ABANDONED',
        reminderCount: 0,
        customerId: 'cust-3',
        update: jest.fn()
      };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      await cartRecoveryService.sendRecoveryReminder(5);

      expect(io.emit).toHaveBeenCalledWith('cart:reminderSent', expect.objectContaining({
        id: 5,
        customerId: 'cust-3'
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // markRecovered
  // ---------------------------------------------------------------------------
  describe('markRecovered', () => {
    it('should return null if cart not found', async () => {
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cartRecoveryService.markRecovered(999);

      expect(result).toBeNull();
    });

    it('should update the cart to RECOVERED status with recoveredAt date', async () => {
      const mockCart = {
        id: 1,
        totalValue: 250,
        update: jest.fn()
      };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      const result = await cartRecoveryService.markRecovered(1);

      expect(mockCart.update).toHaveBeenCalledWith({
        recoveryStatus: 'RECOVERED',
        recoveredAt: expect.any(Date)
      });
      expect(result).toEqual(mockCart);
    });

    it('should emit cart:recovered event', async () => {
      const { io } = require('../../src/server');
      const mockCart = { id: 2, totalValue: 500, update: jest.fn() };
      (AbandonedCart.findByPk as jest.Mock<any>).mockResolvedValue(mockCart);

      await cartRecoveryService.markRecovered(2);

      expect(io.emit).toHaveBeenCalledWith('cart:recovered', { id: 2, totalValue: 500 });
    });
  });

  // ---------------------------------------------------------------------------
  // expireOldCarts
  // ---------------------------------------------------------------------------
  describe('expireOldCarts', () => {
    it('should expire carts older than the specified number of days', async () => {
      (AbandonedCart.update as jest.Mock<any>).mockResolvedValue([5]);

      const result = await cartRecoveryService.expireOldCarts(30, 'tenant-1');

      expect(AbandonedCart.update).toHaveBeenCalledWith(
        { recoveryStatus: 'EXPIRED' },
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1'
          })
        })
      );
      expect(result).toEqual({ expiredCount: 5 });
    });

    it('should use default 30 days when not specified', async () => {
      (AbandonedCart.update as jest.Mock<any>).mockResolvedValue([0]);

      const result = await cartRecoveryService.expireOldCarts();

      expect(AbandonedCart.update).toHaveBeenCalled();
      expect(result).toEqual({ expiredCount: 0 });
    });

    it('should return 0 expired when none match', async () => {
      (AbandonedCart.update as jest.Mock<any>).mockResolvedValue([0]);

      const result = await cartRecoveryService.expireOldCarts(7);

      expect(result).toEqual({ expiredCount: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // getRecoveryStats
  // ---------------------------------------------------------------------------
  describe('getRecoveryStats', () => {
    it('should compute recovery funnel statistics', async () => {
      const mockCarts = [
        { recoveryStatus: 'ABANDONED', totalValue: 100 },
        { recoveryStatus: 'ABANDONED', totalValue: 200 },
        { recoveryStatus: 'REMINDED', totalValue: 150 },
        { recoveryStatus: 'RECOVERED', totalValue: 300 },
        { recoveryStatus: 'EXPIRED', totalValue: 50 }
      ];
      (AbandonedCart.findAll as jest.Mock<any>).mockResolvedValue(mockCarts);

      const result = await cartRecoveryService.getRecoveryStats('tenant-1');

      expect(result.total).toBe(5);
      expect(result.abandoned).toBe(2);
      expect(result.reminded).toBe(1);
      expect(result.recovered).toBe(1);
      expect(result.expired).toBe(1);
      expect(result.recoveryRate).toBe(20); // 1/5 * 100
      expect(result.abandonedValue).toBe(450); // 100+200+150 (ABANDONED+REMINDED)
      expect(result.recoveredValue).toBe(300);
    });

    it('should return zero stats when no carts exist', async () => {
      (AbandonedCart.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await cartRecoveryService.getRecoveryStats();

      expect(result.total).toBe(0);
      expect(result.abandoned).toBe(0);
      expect(result.reminded).toBe(0);
      expect(result.recovered).toBe(0);
      expect(result.expired).toBe(0);
      expect(result.recoveryRate).toBe(0);
      expect(result.abandonedValue).toBe(0);
      expect(result.recoveredValue).toBe(0);
    });

    it('should handle null totalValue gracefully', async () => {
      const mockCarts = [
        { recoveryStatus: 'ABANDONED', totalValue: null },
        { recoveryStatus: 'RECOVERED', totalValue: undefined }
      ];
      (AbandonedCart.findAll as jest.Mock<any>).mockResolvedValue(mockCarts);

      const result = await cartRecoveryService.getRecoveryStats();

      expect(result.total).toBe(2);
      expect(result.abandonedValue).toBe(0);
      expect(result.recoveredValue).toBe(0);
    });

    it('should filter by tenantId when provided', async () => {
      (AbandonedCart.findAll as jest.Mock<any>).mockResolvedValue([]);

      await cartRecoveryService.getRecoveryStats('tenant-2');

      expect(AbandonedCart.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-2' })
        })
      );
    });
  });
});
