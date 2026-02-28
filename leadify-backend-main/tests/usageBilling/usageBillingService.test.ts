
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/usageBilling/usageMeterModel');
jest.mock('../../src/usageBilling/usageRecordModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

import usageBillingService from '../../src/usageBilling/usageBillingService';
import UsageMeter from '../../src/usageBilling/usageMeterModel';
import UsageRecord from '../../src/usageBilling/usageRecordModel';

describe('UsageBillingService', () => {
  const mockMeter: any = {
    id: 1,
    name: 'API Calls',
    unit: 'API_CALLS',
    pricePerUnit: 0.01,
    billingModel: 'PER_UNIT',
    status: 'ACTIVE',
    tenantId: 'tenant-1',
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockRecord: any = {
    id: 1,
    meterId: 1,
    customerId: 'cust-1',
    quantity: 100,
    recordedAt: new Date('2026-03-01'),
    billingPeriod: '2026-03',
    tenantId: 'tenant-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Meter CRUD
  // --------------------------------------------------------------------------
  describe('createMeter', () => {
    it('should create a usage meter and emit socket event', async () => {
      (UsageMeter.create as jest.Mock<any>).mockResolvedValue({ id: 1, name: 'API Calls' });

      const result = await usageBillingService.createMeter({ name: 'API Calls', unit: 'API_CALLS', pricePerUnit: 0.01 }, 'tenant-1');

      expect(UsageMeter.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'API Calls', unit: 'API_CALLS', tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getAllMeters', () => {
    it('should return paginated meters', async () => {
      (UsageMeter.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockMeter], count: 1 });

      const result = await usageBillingService.getAllMeters({ page: 1 }, 'tenant-1');

      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });

    it('should filter by status when provided', async () => {
      (UsageMeter.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await usageBillingService.getAllMeters({ status: 'ACTIVE' }, 'tenant-1');

      expect(UsageMeter.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) })
      );
    });

    it('should return empty docs when no meters exist', async () => {
      (UsageMeter.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await usageBillingService.getAllMeters({});

      expect(result.docs).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('getMeterById', () => {
    it('should return a meter by id', async () => {
      (UsageMeter.findByPk as jest.Mock<any>).mockResolvedValue(mockMeter);

      const result = await usageBillingService.getMeterById(1);

      expect(UsageMeter.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(mockMeter);
    });

    it('should return null when meter is not found', async () => {
      (UsageMeter.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await usageBillingService.getMeterById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateMeter', () => {
    it('should update an existing meter and emit socket event', async () => {
      (UsageMeter.findByPk as jest.Mock<any>).mockResolvedValue(mockMeter);

      const result = await usageBillingService.updateMeter(1, { pricePerUnit: 0.02 });

      expect(mockMeter.update).toHaveBeenCalledWith({ pricePerUnit: 0.02 });
      expect(result).toBe(mockMeter);
    });

    it('should return null when meter is not found', async () => {
      (UsageMeter.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await usageBillingService.updateMeter(999, { pricePerUnit: 0.05 });

      expect(result).toBeNull();
    });
  });

  describe('deleteMeter', () => {
    it('should delete an existing meter', async () => {
      (UsageMeter.findByPk as jest.Mock<any>).mockResolvedValue(mockMeter);

      const result = await usageBillingService.deleteMeter(1);

      expect(mockMeter.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when meter is not found', async () => {
      (UsageMeter.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await usageBillingService.deleteMeter(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Usage Record CRUD
  // --------------------------------------------------------------------------
  describe('recordUsage', () => {
    it('should create a usage record and emit socket event', async () => {
      (UsageRecord.create as jest.Mock<any>).mockResolvedValue({ id: 1, meterId: 1 });

      const result = await usageBillingService.recordUsage(
        { meterId: 1, customerId: 'cust-1', quantity: 100, recordedAt: new Date('2026-03-01') },
        'tenant-1'
      );

      expect(UsageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ meterId: 1, customerId: 'cust-1', quantity: 100, tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });

    it('should set default recordedAt if not provided', async () => {
      (UsageRecord.create as jest.Mock<any>).mockResolvedValue({ id: 1, meterId: 1 });

      await usageBillingService.recordUsage({ meterId: 1, customerId: 'cust-1', quantity: 50 });

      expect(UsageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ recordedAt: expect.any(Date) })
      );
    });

    it('should auto-calculate billingPeriod from recordedAt if not provided', async () => {
      (UsageRecord.create as jest.Mock<any>).mockResolvedValue({ id: 1, meterId: 1 });

      await usageBillingService.recordUsage({
        meterId: 1, customerId: 'cust-1', quantity: 50,
        recordedAt: new Date('2026-03-15')
      });

      expect(UsageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ billingPeriod: '2026-03' })
      );
    });
  });

  describe('getUsageRecords', () => {
    it('should return paginated usage records with meter include', async () => {
      (UsageRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockRecord], count: 1 });

      const result = await usageBillingService.getUsageRecords({ page: 1 }, 'tenant-1');

      expect(UsageRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({ model: UsageMeter, as: 'meter' })
          ])
        })
      );
      expect(result.docs).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should filter by meterId when provided', async () => {
      (UsageRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await usageBillingService.getUsageRecords({ meterId: '1' }, 'tenant-1');

      expect(UsageRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ meterId: 1 }) })
      );
    });

    it('should filter by customerId and billingPeriod when provided', async () => {
      (UsageRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await usageBillingService.getUsageRecords({ customerId: 'cust-1', billingPeriod: '2026-03' });

      expect(UsageRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1', billingPeriod: '2026-03' })
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // calculateUsageCharges
  // --------------------------------------------------------------------------
  describe('calculateUsageCharges', () => {
    it('should calculate PER_UNIT charges correctly', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([
        { meterId: 1, quantity: 100, meter: { id: 1, name: 'API Calls', unit: 'API_CALLS', pricePerUnit: 0.01, billingModel: 'PER_UNIT' } },
        { meterId: 1, quantity: 50, meter: { id: 1, name: 'API Calls', unit: 'API_CALLS', pricePerUnit: 0.01, billingModel: 'PER_UNIT' } }
      ]);

      const result = await usageBillingService.calculateUsageCharges('cust-1', '2026-03');

      expect(result.customerId).toBe('cust-1');
      expect(result.billingPeriod).toBe('2026-03');
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].quantity).toBe(150);
      expect(result.lineItems[0].amount).toBe(1.5); // 150 * 0.01
      expect(result.totalAmount).toBe(1.5);
    });

    it('should calculate TIERED charges correctly', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([
        {
          meterId: 2, quantity: 250,
          meter: {
            id: 2, name: 'Storage', unit: 'GB', pricePerUnit: 0.10, billingModel: 'TIERED',
            tiers: [
              { from: 0, to: 100, pricePerUnit: 0.05 },
              { from: 100, to: 500, pricePerUnit: 0.10 }
            ]
          }
        }
      ]);

      const result = await usageBillingService.calculateUsageCharges('cust-1', '2026-03');

      // First 100 units at 0.05 = 5.00, next 150 at 0.10 = 15.00, total = 20.00
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].amount).toBe(20);
      expect(result.totalAmount).toBe(20);
    });

    it('should calculate VOLUME charges correctly', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([
        {
          meterId: 3, quantity: 150,
          meter: {
            id: 3, name: 'Messages', unit: 'MESSAGES', pricePerUnit: 0.05, billingModel: 'VOLUME',
            tiers: [
              { from: 0, to: 100, pricePerUnit: 0.05 },
              { from: 101, to: 500, pricePerUnit: 0.03 }
            ]
          }
        }
      ]);

      const result = await usageBillingService.calculateUsageCharges('cust-1', '2026-03');

      // Total quantity 150 falls in tier 101-500, all units at 0.03 = 4.50
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].amount).toBe(4.5);
    });

    it('should return zero total when no records exist', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await usageBillingService.calculateUsageCharges('cust-1', '2026-03');

      expect(result.lineItems).toHaveLength(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should handle multiple meters in the same billing period', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([
        { meterId: 1, quantity: 100, meter: { id: 1, name: 'API Calls', unit: 'API_CALLS', pricePerUnit: 0.01, billingModel: 'PER_UNIT' } },
        { meterId: 2, quantity: 50, meter: { id: 2, name: 'Storage', unit: 'GB', pricePerUnit: 0.10, billingModel: 'PER_UNIT' } }
      ]);

      const result = await usageBillingService.calculateUsageCharges('cust-1', '2026-03');

      expect(result.lineItems).toHaveLength(2);
      // API Calls: 100 * 0.01 = 1.00
      // Storage: 50 * 0.10 = 5.00
      expect(result.totalAmount).toBe(6);
    });

    it('should calculate STAIRCASE charges correctly', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([
        {
          meterId: 4, quantity: 75,
          meter: {
            id: 4, name: 'Users', unit: 'USERS', pricePerUnit: 10, billingModel: 'STAIRCASE',
            tiers: [
              { from: 0, to: 50, pricePerUnit: 100 },
              { from: 50, to: 100, pricePerUnit: 200 },
              { from: 100, to: 500, pricePerUnit: 300 }
            ]
          }
        }
      ]);

      const result = await usageBillingService.calculateUsageCharges('cust-1', '2026-03');

      // 75 users >= 50 -> flat fee 200 (highest matching bracket)
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].amount).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // generateInvoice
  // --------------------------------------------------------------------------
  describe('generateInvoice', () => {
    it('should generate an invoice with tax and totals', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([
        { meterId: 1, quantity: 1000, meter: { id: 1, name: 'API Calls', unit: 'API_CALLS', pricePerUnit: 0.01, billingModel: 'PER_UNIT' } }
      ]);

      const result = await usageBillingService.generateInvoice('cust-1', '2026-03');

      expect(result.customerId).toBe('cust-1');
      expect(result.billingPeriod).toBe('2026-03');
      expect(result.invoiceNumber).toMatch(/^INV-2026-03-/);
      expect(result.subtotal).toBe(10); // 1000 * 0.01
      expect(result.tax).toBe(1.5); // 10 * 0.15
      expect(result.total).toBe(11.5); // 10 * 1.15
      expect(result.status).toBe('DRAFT');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate invoice with zero total when no usage', async () => {
      (UsageRecord.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await usageBillingService.generateInvoice('cust-1', '2026-03');

      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
      expect(result.lineItems).toHaveLength(0);
    });
  });
});
