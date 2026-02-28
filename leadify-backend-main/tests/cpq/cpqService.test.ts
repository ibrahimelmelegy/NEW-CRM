
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import cpqService from '../../src/cpq/cpqService';
import { PriceBook, PriceBookEntry, CpqQuote, PricingRule } from '../../src/cpq/cpqModel';
import Client from '../../src/client/clientModel';
import User from '../../src/user/userModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/cpq/cpqModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

describe('CpqService', () => {
  const mockPriceBook: any = {
    id: 1, name: 'Standard', currency: 'USD', isActive: true, expiryDate: null,
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockEntry: any = {
    id: 10, priceBookId: 1, productName: 'Widget', sku: 'WDG-001',
    unitPrice: 100, minQty: null, maxDiscount: null,
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockQuote: any = {
    id: 1, quoteNumber: 'QT-0001', title: 'Test Quote', status: 'DRAFT',
    total: 1000, subtotal: 1000, discountTotal: 0,
    clientId: 'client-1', currency: 'USD', notes: '',
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Price Book CRUD
  // --------------------------------------------------------------------------
  describe('createPriceBook', () => {
    it('should create a price book with tenantId', async () => {
      (PriceBook.create as jest.Mock<any>).mockResolvedValue(mockPriceBook);

      const result = await cpqService.createPriceBook({ name: 'Standard', currency: 'USD' }, 'tenant-1');

      expect(PriceBook.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Standard', tenantId: 'tenant-1' }));
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getPriceBookById', () => {
    it('should return a price book with entries', async () => {
      (PriceBook.findByPk as jest.Mock<any>).mockResolvedValue(mockPriceBook);

      const result = await cpqService.getPriceBookById(1);

      expect(PriceBook.findByPk).toHaveBeenCalledWith(1, expect.anything());
      expect(result).toBe(mockPriceBook);
    });
  });

  describe('deletePriceBook', () => {
    it('should delete entries and the price book', async () => {
      (PriceBookEntry.destroy as jest.Mock<any>).mockResolvedValue(3);
      (PriceBook.findByPk as jest.Mock<any>).mockResolvedValue(mockPriceBook);

      const result = await cpqService.deletePriceBook(1);

      expect(PriceBookEntry.destroy).toHaveBeenCalledWith({ where: { priceBookId: 1 } });
      expect(mockPriceBook.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when price book is not found', async () => {
      (PriceBookEntry.destroy as jest.Mock<any>).mockResolvedValue(0);
      (PriceBook.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cpqService.deletePriceBook(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Quote CRUD
  // --------------------------------------------------------------------------
  describe('createQuote', () => {
    it('should create a quote with auto-generated quote number', async () => {
      (CpqQuote.findOne as jest.Mock<any>).mockResolvedValue(null);
      (CpqQuote.create as jest.Mock<any>).mockResolvedValue({ id: 1, quoteNumber: 'QT-0001' });

      const result = await cpqService.createQuote({ title: 'Test' }, 'tenant-1', 5);

      expect(CpqQuote.create).toHaveBeenCalledWith(
        expect.objectContaining({ quoteNumber: 'QT-0001', tenantId: 'tenant-1', createdBy: 5 })
      );
      expect(result).toHaveProperty('quoteNumber', 'QT-0001');
    });
  });

  describe('approveQuote', () => {
    it('should approve a DRAFT quote', async () => {
      const draft = { ...mockQuote, status: 'DRAFT', update: jest.fn() };
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(draft);

      const result = await cpqService.approveQuote(1);

      expect(draft.update).toHaveBeenCalledWith({ status: 'APPROVED' });
      expect(result).toBe(draft);
    });

    it('should return null when quote is already APPROVED', async () => {
      const approved = { ...mockQuote, status: 'APPROVED' };
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(approved);

      const result = await cpqService.approveQuote(1);

      expect(result).toBeNull();
    });

    it('should return null when quote is not found', async () => {
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cpqService.approveQuote(999);

      expect(result).toBeNull();
    });
  });

  describe('deleteQuote', () => {
    it('should delete an existing quote', async () => {
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(mockQuote);

      const result = await cpqService.deleteQuote(1);

      expect(mockQuote.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when quote is not found', async () => {
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cpqService.deleteQuote(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Discount Rules Engine (synchronous, no DB)
  // --------------------------------------------------------------------------
  describe('applyDiscountRules', () => {
    it('should apply a percentage discount correctly', () => {
      const rules = [{ type: 'percentage' as const, value: 10 }];

      const result = cpqService.applyDiscountRules(1000, rules);

      expect(result.totalDiscount).toBe(100);
      expect(result.appliedRules).toHaveLength(1);
    });

    it('should apply a fixed discount capped at subtotal', () => {
      const rules = [{ type: 'fixed' as const, value: 50 }];

      const result = cpqService.applyDiscountRules(30, rules);

      expect(result.totalDiscount).toBe(30);
    });

    it('should apply volume discount when min quantity is met', () => {
      const rules = [{ type: 'volume' as const, value: 5, minQuantity: 10 }];

      const result = cpqService.applyDiscountRules(1000, rules, { totalQuantity: 15 });

      expect(result.totalDiscount).toBe(50);
    });

    it('should not apply volume discount when min quantity is not met', () => {
      const rules = [{ type: 'volume' as const, value: 5, minQuantity: 10 }];

      const result = cpqService.applyDiscountRules(1000, rules, { totalQuantity: 5 });

      expect(result.totalDiscount).toBe(0);
    });

    it('should apply bundle discount when min items is met', () => {
      const rules = [{ type: 'bundle' as const, value: 3, minItems: 3 }];

      const result = cpqService.applyDiscountRules(1000, rules, { distinctItems: 4 });

      expect(result.totalDiscount).toBe(30);
    });
  });

  // --------------------------------------------------------------------------
  // Price Validation
  // --------------------------------------------------------------------------
  describe('validatePricing', () => {
    it('should return valid=false when price book is not found', async () => {
      (PriceBook.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cpqService.validatePricing(999, [{ entryId: 1, quantity: 1 }]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Price book 999 not found');
    });

    it('should return valid=false when no items are provided', async () => {
      (PriceBook.findByPk as jest.Mock<any>).mockResolvedValue(mockPriceBook);

      const result = await cpqService.validatePricing(1, []);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No items provided');
    });
  });

  // --------------------------------------------------------------------------
  // Quote-to-Deal Conversion
  // --------------------------------------------------------------------------
  describe('convertQuoteToDeal', () => {
    it('should return deal data for an APPROVED quote', async () => {
      const approved = { ...mockQuote, status: 'APPROVED', title: 'Enterprise Deal' };
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(approved);

      const result = await cpqService.convertQuoteToDeal(1);

      expect(result).toHaveProperty('dealData');
      expect((result as any).dealData.title).toBe('Enterprise Deal');
    });

    it('should return error message for non-APPROVED quotes', async () => {
      const draft = { ...mockQuote, status: 'DRAFT' };
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(draft);

      const result = await cpqService.convertQuoteToDeal(1);

      expect(result).toHaveProperty('error');
    });

    it('should return null when quote is not found', async () => {
      (CpqQuote.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await cpqService.convertQuoteToDeal(999);

      expect(result).toBeNull();
    });
  });
});
